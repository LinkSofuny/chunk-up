import { isExist, isFunc } from "../utils/helpers";
interface Istrat {
    [key: string]: (that: any) => Promise<void> | Promise<boolean>
}

const strat: Istrat = {
    'beforeUpload': async (that: any) => {
        const obj = await that.beforeUpload(that.hashFilename, that.hash, that.fileChunkData)
        that.uploadedList = obj.uploadedList
        return !!obj.shouldUpload
    },
    'uploaded': async (that: any) => {
        // uploadedList and requsetList equal fileChunkData mean that 
        // all chunks had been uploaded 
        const fulfilled: boolean = that.uploadedList.length + that.requsetList.length === that.fileChunkData.length
        await that.uploaded(fulfilled, that.hashFilename, that.size, that.hash)
    }
}

export default async function callHooks(that: any, hook: string) {
    if (isExist(that[hook]) && isFunc(that[hook])) {
        return await strat[hook](that)
    } else {
        return true
    }
}