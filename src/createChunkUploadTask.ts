export type TFileChunkDataItem = {
  fileHash: string
  chunk: Blob
  hash: string
  percentage: number
  index: number
}
interface uploadedStatus {
  shouldUpload: boolean
  uploadedList: string[]
}

export type TprogressInner = (e: any) => any // @todo

export type TprogressHanlder = (item: TFileChunkDataItem) => TprogressInner

export type TchunkRequest = (data: object, onProgress: TprogressHanlder) => void

export type TcheckUploaded = (filename: string, fileHash: string) => uploadedStatus

export type TmergeRequest = (filename: string, size: number, fileHash: string) => void

export type TCalhash = {
  hash: string
  percentage: string
}
export interface IChunkUploadTask {
  chunkRequset: TchunkRequest
  mergeRequest: TmergeRequest
  checkUploaded: TcheckUploaded
  file: File
  size?: number
  allCal?: boolean
  concurNum?: number
}
// self.importScripts or either will doesn't work it declare that
declare global {
  interface Window {
    importScripts: any
    SparkMD5: any
  }
}

const SIZE = 10 * 1024 * 1024

export default async function createChunkUploadTask({
  chunkRequset,
  mergeRequest,
  file,
  checkUploaded,
  size = SIZE,
  allCal = true,
  concurNum = 4,
}: IChunkUploadTask): Promise<void> {
  const fileChunkList: { fileChunk: Blob }[] = []
  let fileChunkData: TFileChunkDataItem[] = []
  // 创建切片和文件hash
  function createFileChunk() {
    let cur = 0
    // 分片
    while (cur < file.size) {
      fileChunkList.push({ fileChunk: file.slice(cur, cur + size) })
      cur += size
    }
  }

  function createfileChunkData(hash: string) {
    fileChunkData = fileChunkList.map(({ fileChunk }, index) => ({
      fileHash: hash,
      chunk: fileChunk, // 切块
      hash: `${hash}-${index}`, // hash值
      percentage: 0,
      index,
    }))
  }

  // 计算hash
  function calculateHash(): Promise<TCalhash> {
    return new Promise((resolve) => {
      const worker = new Worker('/Users/chenyudong/note/frag-upload/src/hash.ts')
      worker.postMessage({ fileChunkList: allCal ? fileChunkList : file })
      worker.onmessage = (e) => {
        const { percentage, hash } = e.data
        if (hash) {
          resolve({ hash, percentage })
        }
      }
    })
  }

  // 进度条
  function createProgressHandler(item: TFileChunkDataItem): TprogressInner {
    return (e: any) => {
      console.log(e, 'e')
      item.percentage = parseInt(String((e.loaded / e.total) * 100), 10)
    }
  }
  function createUploadRequest(uploadedList: string[] = []) {
    const requsetList = fileChunkData
      .filter(({ hash }) => !uploadedList.includes(hash))
      .map(({
        chunk, hash, fileHash, index,
      }) => {
        const formData = new FormData()
        formData.append('fileHash', fileHash)
        formData.append('chunk', chunk)
        formData.append('hash', hash)
        formData.append('filename', file.name)
        return { formData, index }
      })
      .map(({ formData, index }) => () => chunkRequset(formData, createProgressHandler(fileChunkData[index])))
    return requsetList
  }
  /**
     *
     * @param {*} requsetList 切片数组
     * @param {*} concurrencyControlNum 并发数量
     */
  async function concurrencyControl(requsetList: any, concurrencyControlNum: number) {
    return new Promise((resolve) => {
      const len = requsetList.length
      let max = concurrencyControlNum
      let counter = 0
      let idx = 0
      const start = async () => {
        while (idx < len && max > 0) {
          max--
          // @todo
          requsetList[idx++]().then(() => {
            max++
            counter++
            if (counter === len) {
              resolve('ok') // @todo
            } else {
              start()
            }
          })
        }
      }
      start()
    })
  }

  createFileChunk()
  const { hash } = await calculateHash()
  createfileChunkData(hash)
  const { shouldUpload, uploadedList } = await checkUploaded(file.name, hash)
  if (!shouldUpload) {
    // 不许要重新上传 @todo
    console.log('上传过了')
    return
  }
  // 创建切片请求
  const requsetList = createUploadRequest(uploadedList)
  // 并发控制 todo
  await concurrencyControl(requsetList, concurNum)
  // 请求合并 todo
  if (uploadedList.length + requsetList.length === fileChunkData.length) {
    await mergeRequest(file.name, size, hash)
  }
}
