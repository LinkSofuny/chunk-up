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
