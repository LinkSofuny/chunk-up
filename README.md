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