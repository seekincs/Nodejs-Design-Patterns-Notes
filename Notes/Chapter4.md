# ES2015及更高版本的异步控制流模式

## Promise

### 是什么

Promise是一组异步操作的封装，通常具有下面的形式：

```javascript
promise.then([onFulfilled], [onRejected])
```

其中onFulfilled和onRejected是两个函数参数，它们代表了异步操作的不同结果：成功或者失败。当执行成功时，返回onFulfilled，而失败则返回onRejected，并且返回的结果同样是Promise对象。这个对象存在三种状态，fulfilled, rejected,和 pending。

- **Fulfilled:** 当onFulfilled被调用并且已经成功返回时。
- **Rejected:** 当onRejected被调用并且失败了。
- **Pending:** 操作还没有完成。

Promise如果不是处于pending状态也被叫做**settled**状态，一旦Promise转到**settled**状态它的状态就不能再次发生改变。

有一个Prmise/A+规范，实现的产品有Bluebird、Q、When.js等。

### Promise的链式调用

如果存在多个异步操作，可以用then来封装，因为then每次都返回一个Promise，Promise会将这些then里面的函数视作异步的操作。比如下面的例子。

```javascript
const wait = (time) => new Promise(() => {
    setTimeout(() => console.log('waiting...'), time)
})

wait(200)
    .then(a => a)
    .then(b => console.log(b))
    .then(c => {
        throw new Error('error in c.')
    }).catch(() => {
    console.log('error caught.')
})
```

## Generator

Generator生成器内部使用yield生成一些操作，这些操作不会马上执行，当调用其next方法时才开始执行。Generator的基本形式如下面所示。

```javascript
function* makeGenerator() {
  yield ops1()
  yield ops2()
  //...
}
```

比如说，下面的例子就是不断的获取yield生成的值。

```javascript
function* fruitGenerator() {
    yield 'apple'
    yield 'orange'
    return 'watermelon'
}

const fruit = fruitGenerator()
console.log(fruit.next())
console.log(fruit.next())
console.log(fruit.next())
```

运行这个例子，可以看到在控制台输出如下。这里每次调用next获取一个操作的结果，从而我们可以控制何时以及以什么样的顺序执行我们设计的函数。

```json
{ value: 'apple', done: false }
{ value: 'orange', done: false }
{ value: 'watermelon', done: true }
```

此外，Generator其实还可以当做迭代器使用。比如可以用下面这种方式来遍历一个集合。

```javascript
function* iterator(array) {
    for (let item of array) {
        yield item
    }
}

const it = iterator([3, 5, 4, 6])
let current = it.next()
while (!current.done) {
    console.log(current.value)
    current = it.next()
}
```

由于Generator可以定义一些以后才执行的操作，可以借助这一点来实现异步。比如下面的runGenerator就定义了两个异步操作，分别拿到result1和result2。

```javascript
function request(url) {
    return new Promise(function (resolve, reject) {
        makeAjaxCall(url, function (err, text) {
            if (err) reject(err)
            else resolve(text)
        })
    })
}

runGenerator(function* main() {
    let result1
    try {
        result1 = yield request('http://some.url.1')
    } catch (err) {
        console.log('Error:' + err)
        retrun
    }
    const data = JSON.parse(result1)

    let result2
    try {
        result2 = yield request('http://some.url.2?id=' + data.id)
    } catch (err) {
        console.log('Error:' + err)
        retrun
    }
    let resp = JSON.parse(result2);
    console.log("The value you asked for: " + resp.value)
})
```

## async/await

这是一种更加简洁的解决方案，async关键字用在函数前面可以直接让这个函数返回一个Promise，await则等待函数返回一个结果。如果是同步的操作，结果会直接返回；但异步的情况下，await会阻塞整一个流程，直到结果返回之后，才会继续下面的代码。

比如下面的例子。

```javascript
function foo() {
    return "func foo"
}

async function testAsync() {
    return Promise.resolve("hello async")
}

async function test() {
    const v1 = await foo()
    const v2 = await testAsync()
    console.log(v1, v2)
}

test()
```

foo是一个普通的函数，定义的是一个同步操作；testAsync返回一个Promise，它是异步的，在test函数中，使用await登分别等待foo函数和testAsync函数返回结果，才执行下面的代码（console.log(v1, v2)）。

## 总结

这一章主要介绍了分别使用Promise、Generator和async/await来实现异步。Promise封装一组异步操作，并且使用then组成调用链；Generator使用yiled使得一个操作暂时不会执行，只有在调用其next方法的时候才会执行；async/await则是一种更加简单的实现异步的方式。