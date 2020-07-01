# 带回调的异步控制流模式

## 回调地狱

大量闭包和回调将代码转换成不可读的、难以管理的情况称为回调地狱。它是`Node.js`中最受认可和最严重的反模式之一。典型的形式如下：

```javascript
asyncFoo(err => {
    asyncBar(err => {
        asyncFunc(err => {
            //...
        })
    })
})
```

缺点：

- 代码嵌套太深，可读性较差
- 变量名重叠，作用域不明确

解决方法：逻辑扁平化，错误检查及时返回。

## 顺序执行

这种方式在执行完成一个异步任务之后才调用下一个，避免了在处理异步代码的时候使用闭包。

```javascript
function task1(callback) {
    asyncOperation(() => {
        task2(callback);
    });
}

function task2(callback) {
    asyncOperation(result() => {
        task3(callback);
    });
}

function task3(callback) {
    asyncOperation(() => {
        callback(); // 最后执行的回调
    });
}

task1(() => {
    //当 task1, task2 和 task3 都完成的时候执行这里的代码
    console.log('tasks 1, 2 and 3 executed');
});
```

## 并行执行

在某些情况下，任务执行的顺序并不重要，我们只需要在任务完成的时候通知我们。

但是由于`Node.js`是单线程模型，只有在`I/O`操作（如读写文件、数据库、DNS解析等）的时候才启动线程池，分派其他线程来完成`I/O`操作，这时候，主线程继续处理其他任务，不会发生阻塞。

比如说，现在主线程是`Main`，有两个工作线程`Task1`和`Task2`。

我们有一个`Main`函数执行两个异步任务：

1. `Main`触发`Task 1`和`Task 2`的执行。由于这些触发异步操作，这两个函数会立即返回，并将控制权返还给主线程，之后等到事件循环完成再通知主线程。
2. 当`Task 1`的异步操作完成时，事件循环给与其线程控制权。当`Task 1`同步操作完成时，它通知`Main`函数。
3. 当`Task 2`的异步操作完成时，事件循环给与其线程控制权。当`Task 2`同步操作完成时，它再次通知`Main`函数。在这一点上，`Main`函数知晓`Task 1`和`Task 2`都已经执行完毕，所以它可以继续执行其后操作或将操作的结果返回给另一个回调函数。

## 竞态条件

有并发就会产生数据读写的不一致问题。通常来说，需要采取一些访问控制措施，如加锁、信号量、版本号等等来保持线程之间读写数据的正确性。但是Node.js不需要这些，因为它是单线程模型。不过，不同Worker线程之间却会存在竞态条件，可以通过一个简单的互斥量来避免数据的不一致。

比如说，现在的场景是多个Worker线程同时不断地往一个字典（Map）里面添加数据，现在存在的问题是，后面添加的数据可能会覆盖前面的数据。

通过加入一个互斥量，当一个线程试图往里面加入数据的时候，检查数据是否已经加入过（也就是是否已经存在）。从而避免数据覆盖。

```javascript
const map = new Map();

function put(map, data, callback) {
    if (map.has(data.key)) {
        return process.nextTick(callback);
    }
    map.set(data.key, data.value);
    // ...
}
```

## async库

这个库是`Node.js`异步操作的封装，包含了大多数异步控制流。

比如说，对于顺序执行，有很多函数可以帮我们完成不同的任务。

```javascript
eachSeries(), mapSeries(), filterSeries(), rejectSeries(), reduce(), reduceRight()
```

## 总结

由于`Node.js`异步的设计方案，异步操作的控制变得困难，因为很难预测一组异步操作执行的顺序。不过，可以通过加入一定的流程控制来实现，主要是通过带回调的顺序执行和线程池的并发执行。