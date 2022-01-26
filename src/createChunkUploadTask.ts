import { ChunkUploadTask, fileChunkDataItem, calhash } from '../types/createChunkUploadTask'

const SIZE = 10 * 1024 * 1024

export default async function createChunkUploadTask({
  chunkRequset,
  mergeRequest,
  file,
  checkUploaded,
  size = SIZE,
  allCal = true,
  concurNum = 4,
}: ChunkUploadTask): Promise<void> {
  const fileChunkList: {fileChunk: Blob}[] = []
  let fileChunkData: fileChunkDataItem[] = []
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
  function calculateHash(): Promise<calhash> {
    return new Promise((resolve) => {
      const worker = new Worker('src/utils/hash.js')
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
  function createProgressHandler(item: fileChunkDataItem) {
    return (e) => {
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
  async function concurrencyControl(requsetList, concurrencyControlNum) {
    return new Promise((resolve) => {
      const len = requsetList.length
      let max = concurrencyControlNum
      let counter = 0
      let idx = 0
      const start = async () => {
        while (idx < len && max > 0) {
          max--
          requsetList[idx++]().then(() => {
            max++
            counter++
            if (counter === len) {
              resolve()
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
  const { hash, percentage } = await calculateHash()
  createfileChunkData(hash)
  const { shouldUpload, uploadedList } = await checkUploaded(file.name, hash)
  if (!shouldUpload) {
    // 不许要重新上传 todo
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
