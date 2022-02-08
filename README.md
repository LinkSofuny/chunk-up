<div align=center>
 <h1>chunk-up</h1>
</div>

<div align=center>
  <a href="https://github.com/vuejs/vue"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
</div>

一个开箱即用的切片上传工具, 支持断点续传, 并发控制, 采用worker线程计算hash, 保证性能的同时, 保证准确性.

 


# Usage
```js
npm install chunk-up
```
```js
import chunkUp from 'chunk-up'

// chunkUp 将返回一个实例
const uploadTask = chunkUp({
    chunkRequset: chunkRequset, 
    beforeUpload: verifyUpload,
    uploaded: mergeRequest, 
    file: container.file, 
})
```
## e.g.
@todo 原生例子

## chunkUp的参数配置表
|Name|Description|Default
|---|---|---|
|chunkRequset|`required` 分片上传的接口|null|
|beforeUpload|上传前被调用的钩子, 要求返回一个对象, 值分别为: {`shouldUpload`: `boolean` `uploadedList`: `array`}|null|
|uploaded|分片上传结束即调用该函数, 一般用于发送切片合并请求|null|
|file|`required` 目标文件对象, 一般在`input`标签事件中获取到|null|
|allCal|是否全量计算hash, 默认情况下文件的hash值是抽样计算的, 这是牺牲一点准确率下的性能优化, 当然你完全可以使用全量计算|false|
|concurNum|并发数, 即一次性发起多少个请求|4|
|size|单个切片的大小|10MB|
### chunkRequset
`chunkRequset`要求必传, 它需要返回一个**promise对象**, 并且将接受到两个参数`formData`, `onPregess函数`. 你可以像这个案例一样书写, 这将完美运行.

- `formData`是切块的表单数据

- `onProgress`是一个进度条函数, 在为xhr提供实时的进度条变化(但是目前这个功能还有些问题@todo)
```js
async function chunkRequset(formData, onProgress) {
  return await request({
    url: 'http://localhost:8080',
    formData,
    onProgress
  })
}
```
### beforeUpload
`beforeUpload`非必传, 它默认接收到`hashFilename`, `hash` 2个参数, 方便你发送验证请求.
- `hashFilename` 经过文件**hash + 原文件扩展名**拼接而成, 用于向后端验证当前文件是否存在
- `hash` 作用同上, 由于存在未生成文件, 而是一个切片文件夹的情况, 可能需要hash进行验证

请在这个函数中返回一个对象: `{ shouldUpload: boolean, uploadedList: hashString[] }`

- `shouldUpload`: 是一个布尔值, `true`表明需要上传, `false`表明不需要, **如果你在这个字段中返回 `false`, chunkUp将中断上传任务的执行**
- `uploadedList`: 已切片名字数组, 用于校验哪些切片是否已经上传, 在上传阶段, 切片的名字将已  `hash + '-' + 切片数` 的形式发送给后端. 后端只需要将已上传的切片名通过数组返回即可.

例如: 我们上传 `demo.mp3` 这个文件, 计算完hash, 它就会被切片
```js
demo.mp3 计算 hash => 12asd9058asasjf.mp3

它的切块:
  12asd9058asasjf-1
  12asd9058asasjf-2
  12asd9058asasjf-3
```
我们上传完, 切片1, 切片2的时候暂停了, 之后要恢复重传, 就需要后端返回`uploadedList`了, 这个`uploadedList`数组应该长这样:
```js
uploadedList = [
  '12asd9058asasjf-1',
  '12asd9058asasjf-2'
]
```
根据这个数组, chunkUp就会跳过这两个切片的上传

### uploaded
`uploaded` 非必传, 一般用于切片上传完毕后, 发送合并请求, 它将接收到4个参数`fulfilled`, `hashFilename`, `size`, `fileHash`
- `fulfilled`: 将告知你, 当前切片上传是否正常, 你可以根据这个判断是否要发送合并请求
- `hashFilename`: hash文件名
- `size`: 切块大小
-  `fileHash`: 文件hash

### file
`file` 必传, 要求是一个文件对象, 一般在input标签获取. 比如: 
```html
<body>
    <input type="file" id="uploadFile">
    <script>
        uploadFile.addEventListener('change', function (e) {
            const [file] = e.target.files // 文件对象
            // 一般也在这个位置使用 chunkup
        })
    </script>
</body>

```
## chunkUp实例
`uploadTask.on`执行后将完成文件的切片工作和hash计算工作, 并返回一个`fileChunk`数组, 提供每个切片的基本信息, 包括进度条等.
```js
const fileChunk = uploadTask.on()
```
`uploadTask.send`执行后正式发起请求, 上传切片
```js
uploadTask.send()
```


# todo
2. 慢启动策略
3. 重传错误切片配置
4. 断点续传
7. jest(待定...)