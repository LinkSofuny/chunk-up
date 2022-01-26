export type progressHanlder = (item: object) => (e: any) => void

export type mergeRequest = (filename: string, size: number, fileHash: string) => void

export type calhash = {
  hash: string
  percentage: string
}

export interface ChunkUploadTask {
  chunkRequset: (data: object, onProgress: progressHanlder) => void
  mergeRequest: mergeRequest
  file: File
  checkUploaded: string
  size?: number
  allCal?: boolean
  concurNum?: number
}

export type fileChunkDataItem = {
  fileHash: string
  chunk: Blob
  hash: string
  percentage: number
  index: number
}
