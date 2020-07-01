# Streams

## 是什么

stream是 Node.js 中处理流式数据的抽象接口，它的优点是能够实时处理I/O，及时返回数据，不需要缓冲。在网路传输和处理大文件的时候，stream的优势更加明显。

比如说读取一个100MB的文件，通常需要将其读入内存的缓冲区，然后才对数据进行操作，但是使用流的话不需要太多的内存开销。

又比如，将一个文件在网络上传输的时候，通常要等整个文件读取完毕之后才可以上传，使用stream可以逐个字节分别传输，时间效率更高。

## stream的几种结构

stream根据其特征可以分为4类：

- `stream.Readable`：可以读入数据的流
- `stream.Writable`：可以写入数据的流
- `stream.Duplex`：双向流，既可以读又可以写
- `stream.Transform`：在读写过程中可以修改或转换数据的 `Duplex` 流

其中每一个`stream`也是`EventEmitter`的一个实例。因此可以认为stream也支持异步操作。

## 可读的stream

标准输入（stdin）就是一个可读的流。比如下面的代码从标准输入流中读取数据，并将其输出到标准输出。

```javascript
process.stdin
    .on('readable', () => {
        let chunk;
        console.log('New data available');
        while ((chunk = process.stdin.read()) !== null) {
            console.log(
                `Chunk read: (${chunk.length}) "${chunk.toString()}"`
            );
        }
    })
    .on('end', () => process.stdout.write('End of stream'));
```

如何实现可读流？

可以通过继承`stream.Readable`的原型来创建一个新的类，然后重写`_read()`方法来实现。

```javascript
const stream = require('stream');
const Chance = require('chance');

const chance = new Chance();

class RandomStream extends stream.Readable {
    constructor(options) {
        super(options);
    }

    _read(size) {
        const chunk = chance.string(); 
        console.log(`Pushing chunk of size: ${chunk.length}`);
        this.push(chunk, 'utf8'); 
        if (chance.bool({
            likelihood: 5
        })) { 
            this.push(null);
        }
    }
}

module.exports = RandomStream;
```

## 可写的stream

这种流也是单向的，它会将数据写入目标位置。要实现可写的流也很简单，继承stream.Writable重写_write方法。

```javascript
const stream = require('stream')

class MyWriteStream extends stream.Writable {
    constructor(options) {
        super(options);
    }

    _write(chunk, encoding, callback) {
        // do something...
    }
}

module.exports = MyWriteStream
```

## 双向的stream

双向的`stream`既是可读的，也是可写的。 当我们想描述一个既是数据源又是数据终点的实体时（例如`socket`），这就显得十分有用了。 这种流只是继承`stream.Readable`和`stream.Writable`的方法，所以它对我们来说并不新鲜。并且这意味着我们可以`read()`或`write()`数据。

## 转换的stream

转换的流是专门设计用于处理数据转换的一种特殊类型的双向流。

在一个简单的双向流中，从`stream`中读取的数据和写入到其中的数据之间没有直接的关系（至少`stream`是不可知的）。 比如说一个`TCP socket`，它只是向远程节点发送数据和从远程节点接收数据。`TCP socket`自身没有意识到输入和输出之间有任何关系。

另一方面，转换的`Streams`对从可写入端接收到的每个数据块应用某种转换，然后在其可读端使转换的数据可用。