function calHash () {
  self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js'); // @todo 网络引用 or npm
  function createHashComputer(fileChunkList: { fileChunk: Blob }[]) {
    const spark = new self.SparkMD5.ArrayBuffer(); // @todo
    const reader = new FileReader();
    // 配合慢启动的话 这里得重构 @todo
    function allFileHash(index: number) {
      let percentage = 0;
      let count = 0;
      reader.readAsArrayBuffer(fileChunkList[index].fileChunk);
      reader.onload = (e: ProgressEvent<FileReader>) => {
        count++;
        spark.append(e.target?.result);

        if (count === fileChunkList.length) {
          self.postMessage({
            percentage: 100,
            hash: spark.end(),
          });
          self.close();
        } else {
          percentage += 100 / fileChunkList.length;
          self.postMessage({
            percentage,
          });
          // 计算下个切片
          allFileHash(count);
        }
      };
    }
    function partFileHash(file: File) {
      const offset = 2 * 1024 * 1024;
      const fileSize = file.size;
      // 前切块
      const chunks = [file.slice(0, offset)];
      let cur = 0;
      while (cur < fileSize) {
        // 后切块
        if (cur + offset >= fileSize) {
          chunks.push(file.slice(cur, cur + offset));
        } else {
          // 中间每次跨度都抽三个节点
          const mid = cur + offset / 2;
          const end = cur + offset;
          chunks.push(file.slice(cur, cur + 2));
          chunks.push(file.slice(mid, mid + 2));
          chunks.push(file.slice(end, end - 2));
        }
        cur += offset;
      }
      // 拼接
      reader.readAsArrayBuffer(new Blob(chunks));
      reader.onload = (e: ProgressEvent<FileReader>) => {
        spark.append(e.target?.result);
        self.postMessage({
          percentage: 100,
          hash: spark.end(),
        });
        self.close();
      };
    }
    // 如果是数组 证明文件被拆分过, 则是全量
    return Array.isArray(fileChunkList) ? allFileHash(0) : partFileHash(fileChunkList);
  }
  self.onmessage = (e) => {
    const { fileChunkList } = e.data;
    createHashComputer(fileChunkList);
  };

} 

/**
 * it will be shaked on build stage by rollup if don't do that
 */
const blob = new Blob(['(' + calHash.toString() +')()']);
export default window.URL.createObjectURL(blob)