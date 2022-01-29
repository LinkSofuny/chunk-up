import calHash from './hash'
import { isExist, isFunc } from '../utils/helpers'
const SIZE = 10 * 1024 * 1024

type TFileChunkDataItem = {
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

type TprogressInner = (e: any) => any // @todo

type TprogressHanlder = (item: TFileChunkDataItem) => TprogressInner

type TchunkRequest = (data: object, onProgress: TprogressHanlder) => void

type TbeforeUpload = (filename: string, fileHash: string) => uploadedStatus

type Tuploaded = (fulfilled: boolean, filename: string, size: number, fileHash: string) => void

type TCalhash = {
  hash: string
  percentage: string
}
interface IChunkUploadTask {
  chunkRequset: TchunkRequest
  uploaded: Tuploaded
  beforeUpload: TbeforeUpload
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

// 创建切片和文件hash
function createFileChunk(fileChunkList: { fileChunk: Blob }[], file: File, size: number) {
  let cur = 0
  // 分片
  while (cur < file.size) {
    fileChunkList.push({ fileChunk: file.slice(cur, cur + size) })
    cur += size
  }
}

function createfileChunkData(hash: string, fileChunkList: { fileChunk: Blob }[]) : TFileChunkDataItem[]{
  return fileChunkList.map(({ fileChunk }, index) => ({
    fileHash: hash,
    chunk: fileChunk, // 切块
    hash: `${hash}-${index}`, // hash值
    percentage: 0,
    index,
  }))
}

// 计算hash
function calculateHash(allCal: boolean, fileChunkList: { fileChunk: Blob }[], file: File): Promise<TCalhash> {
  return new Promise((resolve) => {
    const worker = new Worker(calHash)
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
    item.percentage = parseInt(String((e.loaded / e.total) * 100), 10)
  }
}

function createUploadRequest(
  uploadedList: string[] = [], 
  fileChunkData: TFileChunkDataItem[], 
  chunkRequset: TchunkRequest, 
  file: File
) {
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

function getFilename(filename: string, hash: string): string {
  if (!filename) return ''
  const reg = /\.[^\.]+$/
  const result: any = filename.match(reg)
  return hash + result[0]
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
        // @todo slow start
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

async function createChunkUploadTask({
  chunkRequset,
  uploaded,
  file,
  beforeUpload,
  size = SIZE,
  allCal = true,
  concurNum = 4,
}: IChunkUploadTask): Promise<void> {
  const fileChunkList: { fileChunk: Blob }[] = []
  let fileChunkData: TFileChunkDataItem[] = []
  let uploadedList: string[] =[]

  createFileChunk(fileChunkList, file, size)
  const { hash } = await calculateHash(allCal, fileChunkList, file)
  fileChunkData = createfileChunkData(hash, fileChunkList)


  // beforeUpload @todo
  if (isExist(beforeUpload) && isFunc(beforeUpload)) {
    const obj = await beforeUpload(file.name, hash)
    uploadedList = obj.uploadedList
    
    if (!obj.shouldUpload) {
      // 不许要重新上传 @todo
      console.log('上传过了')
      return
    }
  }

  

  // 创建切片请求
  const requsetList = createUploadRequest(uploadedList, fileChunkData, chunkRequset, file)
  // 并发控制 @todo
  await concurrencyControl(requsetList, concurNum)
  // uploadedList and requsetList equal fileChunkData mean that 
  // all chunks had been uploaded 
  const fulfilled: boolean = uploadedList.length + requsetList.length === fileChunkData.length
  if (isExist(uploaded) && isFunc(uploaded)) {
    await uploaded(fulfilled, getFilename(file.name, hash), size, hash)
  }
}

function main(options: IChunkUploadTask) {
  // if (!validate(options)) callHooks()
  createChunkUploadTask(options)
}

export default main