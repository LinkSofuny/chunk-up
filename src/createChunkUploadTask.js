const SIZE = 10 * 1024 * 1024


export default async function createChunkUploadTask ({
    chunkRequset, 
    mergeRequest, 
    file, 
    checkUploaded, 
    size = SIZE, 
    allCal = true,
    concurNum = 4
}) {
    const fileChunkList = []
    let fileChunkData = []
    // 创建切片和文件hash
    async function createFileChunk(file, size) {
        let cur = 0
        // 分片
        while (cur < file.size) {
            fileChunkList.push({ file: file.slice(cur, cur + size) })
            cur += size
        }
    }

    function createfileChunkData(hash) {
        fileChunkData = fileChunkList.map(({ file }, index) => ({
            fileHash: hash,
            chunk: file, // 切块
            hash: hash + '-' + index, // hash值
            percentage: 0,
            index
        }))
    }
    // 计算hash
    function calculateHash() {
        return new Promise(resolve => {
            const worker = new Worker('src/utils/hash.js')
            worker.postMessage({ fileChunkList: allCal ? fileChunkList : file })
            worker.onmessage = e => {
                const { percentage, hash } = e.data
                if (hash) {
                    resolve({ hash, percentage})
                }
            }
        })
    }

    function createUploadRequest (uploadedList = [], hash) {
        const requsetList = fileChunkData
        .filter(({ hash }) => !uploadedList.includes(hash))
        .map(({ chunk, hash, fileHash, index }) => {
            const formData = new FormData()
            formData.append('fileHash', fileHash)
            formData.append('chunk', chunk)
            formData.append('hash', hash)
            formData.append('filename', file.name)
            return { formData, index }
        })
        .map(({ formData, index }) => {
            return () => chunkRequset(formData, createProgressHandler(fileChunkData[index]))
        })
        return requsetList
    }
    /**
     * 
     * @param {*} requsetList 切片数组
     * @param {*} concurrencyControlNum 并发数量
     */
    async function concurrencyControl (requsetList, concurrencyControlNum) {
        return new Promise(resolve => {
            const len = requsetList.length
            let max = concurrencyControlNum
            let counter = 0
            let idx = 0
            const start = async () => {
                while (idx < len && max > 0) {
                    max--
                    console.log('并发请求开始', idx)
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

    // 进度条
    function createProgressHandler(item) {
        return e => {
            item.percentage = parseInt(String((e.loaded / e.total) * 100))
        }
    }

    createFileChunk(file, size)
    const { hash, percentage } = await calculateHash()
    createfileChunkData(hash)
    const { shouldUpload, uploadedList } = await checkUploaded(file.name, hash)
    if (!shouldUpload) {
        // 不许要重新上传 todo
        console.log('上传过了')
        return
    }
    // 创建切片请求
    debugger
    const requsetList = createUploadRequest(uploadedList, hash)
    // 并发控制 todo
    await concurrencyControl(requsetList, concurNum)
    // 请求合并 todo
    if (uploadedList.length + requsetList.length === fileChunkData.length) {
        await mergeRequest(file.name, size, hash)
    }
}

