import { IChunkUploadTask } from '../src/createChunkUploadTask'
import { isFunc, getType } from './helpers'

export default function validate (options: IChunkUploadTask): boolean {
    const {chunkRequset, file} = options
    if (!chunkRequset || !isFunc(chunkRequset)) {
        errorInfo('chunkRequset requires that file be a Function')
        return false
    }
    if (!file || getType(file) !== 'file') {
        errorInfo('file requires that file be a File type')
        return false
    }
    return true
}

function errorInfo (warninfo: string) {
    if (process.env.NODE_ENV !== 'production') {
        console.error("[ChunkUp Warn]" + warninfo)
    }
}