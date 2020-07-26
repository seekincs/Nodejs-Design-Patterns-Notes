## 《Node.js Design Patterns》读书笔记

### Node.js平台

#### 小模块

以包的形式尽可能多的复用模块，原则上每个模块的容量尽量小而精。

原则：

- "Small is beautiful." ---小而精
- "Make each program do one thing well." ---单一职责原则

因此，一个Node.js应用由多个包搭建而成，包管理器（npm）的管理使得他们相互依赖而不起冲突。

#### 简单且实用

> “简单就是终极的复杂。” ————达尔文

遵循KISS(Keep It Simple, Stupid)原则，即优秀的简洁的设计，能够更有效地传递信息。

设计必须很简单，无论在实现还是接口上，更重要的是实现比接口更简单，简单是重要的设计原则。

我们做一个设计简单，功能完备，而不是完美的软件：

- 实现起来需要更少的努力
- 允许用更少的速度进行更快的运输资源
- 具有伸缩性，更易于维护和理解
- 促进社区贡献，允许软件本身的成长和改进

而对于Node.js而言，因为其基于JavaScript，简单和函数、闭包、对象等特性，可取代复杂的面向对象的类语法。如单例模式和装饰者模式，它们在面向对象的语言都需要很复杂的实现，而对于JavaScript则较为简单。

#### 异步I/O

在Node.js中，绝大多数的操作都以异步的方式进行调用，从文件读取到网络请求，均是如此，异步I/O意味着每个调用之间无须等待之前的I/O调用结束，在编程模型上可以提升效率，如果存在两个文件读取任务，最终的耗时只取决于最慢的那个文件读取耗时，对于同步I/O而言，它的耗时是两个任务之和。

#### 事件与回调

在Node.js中事件得到了广泛的应用，如创建一个服务器，我们会为器其绑定request对象，对于请求对象绑定data和end事件，同时在前端我们通常也是为Ajax请求绑定success事件、error事件等。同样，在Node.js中回调也是无处不在的，事件的处理基本都是依赖回调来实现的，在JavaScript中，可以将函数作为对象传递给方法作为实参进行调用。

#### 单线程

Node.js保持了JavaScript在浏览器中单线程的特点，而且在Node.js中，JavaScript与其余线程是无法共享任何状态的。JavaScript采用单线程的原因和他最早的用途用惯，最早在Web浏览器中，JavaScript主要做的是响应用户DOM操作以及做表单校验，这些功能使用单线程来处理完全够了，而且对于DOM操作来说，使用多线程的话还将造成线程安全问题，同时多线程还将给浏览器带来更大的内存消耗并降低CPU的使用率。

单就单线程本身来说，存在如下几个弱点：

- 1、无法利用多核CPU
- 2、错误会引起整个应用退出，应用的健壮性需要考虑
- 3、大量计算占用CPU将使阻塞程序的运行

严格来说，Node.js并非真正的单线程架构，Node.js自身还有一定的I/O线程存在，这些I/O线程由底层libuv处理，这就意味着Node.js在访问系统I/O时还是多线程的，对于文件读取、SQL查询、网路请求这些具体操作，Node.js还是使用多线程来进行处理从而保证Node.js的处理效率。

为了应对单线程存在的CPU利用率问题，Node.js采用了多进程的架构，也就是著名的Master-Worker模式，又称主从模式，如下图所示，这种典型的用于并行处理业务的分布式架构具有较好的伸缩性和稳定性。Node.js通过fork()复制的进程都是一个个独立的进程，这个进程中有着独立的V8实例，每个独立进程需要至少30毫秒的启动时间和至少10MB的内存，虽然fork()进程是有一定开销的，但是可以提高多核CPU的利用率，这在CPU普遍多核化的今天还是有很大的作用的，同时我们也应该认识到Node.js通过事件驱动的方式在单线程上已经可以解决大并发的问题，启动多进程只是为充分利用CPU资源。

![](https://user-gold-cdn.xitu.io/2019/5/10/16a9fd796cf2c885?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

Node.js的Master-Worker多进程模式中主进程和工作进程通过消息传递的形式而不是共享或直接操作资源的方式进行通信，通过fork()创建工作进程之后会在主进程和工作进程之间创建IPC通道，关于多进程相关内容，Node官方也提供了cluster模块对进程进行管理。

关于应用的健壮性问题，我们同样可以采用上述的Master-Worker模式，主进程只负责管理工作进程，具体的业务处理交由工作进程来完成，在工作进程中监听uncaughtException事件可以捕获未知的异常，然后告知主进程，主进程根据策略重新创建工作进程，或者直接退出主进程，这种情况代码中一定要给出足够的日志信息，通过日志监控任务及时产生报警。

#### 跨平台

Node.js刚发布的时候，只能在Linux平台上运行，后来Node.js在架构层面进行了改动，在Node.js和操作系统之间引入了一层libuv，从而实现跨平台。

#### 适合的应用场景

##### I/O密集型

Node.js异步I/O的特点使得他可以轻松面对I/O密集型的业务场景，处理效率将比同步I/O高，虽然同步I/O可以采用多线程或者多进程的方式进行，但是相比Node.js自带异步I/O的特性来说，将增加对内存和CPU的开销。

##### 高并发场景

针对高并发请求场景，Node.js的异步I/O以及事件回调特点可以高效的处理并发请求。

总体来说Node.js的异步I/O能在开销固定的情况下极大的提高并发处理速度，适合高并发，I/O密集型的使用场景，同时由于单线程的特点，Node.js程序不如多线程程序健壮性高，也不能利用多线程来使用多核CPU，不过对于Node.js来说，使用多进程的成本相对较小，上述问题都可以通过合理使用多进程来处理，最终程序的高效稳定运行还是取决于软件架构和编码质量。

### 异步的实现

#### 操作系统的非阻塞I/O引擎

每个操作系统对于事件多路复用器有其自身的接口，Linux是epoll，Mac OSX是kqueue，Windows的IOCP API。除外，即使在相同的操作系统中，每个I/O操作对于不同的资源表现不一样。例如，在Unix下，普通文件系统不支持非阻塞操作，所以，为了模拟非阻塞行为，需要使用在事件循环外用一个独立的线程。所有这些平台内和跨平台的不一致性需要在事件多路复用器的上层做抽象。这就是为什么Node.js为了兼容所有主流平台而 编写C语言库libuv，目的就是为了使得Node.js兼容所有主流平台和规范化不同类型资源的非阻塞行为。libuv今天作为Node.js的I/O引擎的底层。

#### Reactor模式

**I/O是缓慢的**

在计算机的基本操作中，输入输出肯定是最慢的。访问内存的速度是纳秒级(10e-9 s)，同时访问磁盘上的数据或访问网络上的数据则更慢，是毫秒级(10e-3 s)。内存的传输速度一般认为是GB/s来计算，然而磁盘或网络的访问速度则比较慢，一般是MB/s。虽然对于CPU而言，I/O操作的资源消耗并不算大，但是在发送I/O请求和操作完成之间总会存在时间延迟。除此之外，我们还必须考虑人为因素，通常情况下，应用程序的输入是人为产生的，例如：按钮的点击、即时聊天工具的信息发送。因此，输入输出的速度并不因网络和磁盘访问速率慢造成的，还有多方面的因素。

**阻塞I/O**

在一个阻塞I/O模型的进程中，I/O请求会阻塞之后代码块的运行。在I/O请求操作完成之前，线程会有一段不定长的时间浪费。（它可能是毫秒级的，但甚至有可能是分钟级的，如用户按着一个按键不放的情况）。以下例子就是一个阻塞I/O模型。

```javascript
// 直到请求完成，数据可用，线程都是阻塞的
data = socket.read();
// 请求完成，数据可用
print(data);
```

我们知道，阻塞I/O的服务器模型并不能在一个线程中处理多个连接，每次I/O都会阻塞其它连接的处理。出于这个原因，对于每个需要处理的并发连接，传统的web服务器的处理方式是新开一个新的进程或线程（或者从线程池中重用一个进程）。这样，当一个线程因 I/O操作被阻塞时，它并不会影响另一个线程的可用性，因为他们是在彼此独立的线程中处理的。

**非阻塞I/O**

除阻塞I/O之外，大部分现代的操作系统支持另外一种访问资源的机制，即非阻塞I/O。在这种机制下，后续代码块不会等到I/O请求数据的返回之后再执行。如果当前时刻所有数据都不可用，函数会先返回预先定义的常量值(如undefined)，表明当前时刻暂无数据可用。

例如，在Unix操作系统中，fcntl()函数操作一个已存在的文件描述符，改变其操作模式为非阻塞I/O(通过O_NONBLOCK状态字)。一旦资源是非阻塞模式，如果读取文件操作没有可读取的数据,或者如果写文件操作被阻塞,读操作或写操作返回-1和EAGAIN错误。

非阻塞I/O最基本的模式是通过轮询获取数据，这也叫做**忙-等模型**。看下面这个例子，通过非阻塞I/O和轮询机制获取I/O的结果。

```javascript
resources = [socketA, socketB, pipeA];
while(!resources.isEmpty()) {
  for (i = 0; i < resources.length; i++) {
    resource = resources[i];
    // 进行读操作
    let data = resource.read();
    if (data === NO_DATA_AVAILABLE) {
      // 此时还没有数据
      continue;
    }
    if (data === RESOURCE_CLOSED) {
      // 资源被释放，从队列中移除该链接
      resources.remove(i);
    } else {
      consumeData(data);
    }
  }
}
```

![](https://user-gold-cdn.xitu.io/2017/10/7/2be476c37d434e4e8ba2cd064b6410d6?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

我们可以看到，通过这个简单的技术，已经可以在一个线程中处理不同的资源了，但依然不是高效的。事实上，在前面的例子中，用于迭代资源的循环只会消耗宝贵的CPU，而这些资源的浪费比起阻塞I/O反而更不可接受，轮询算法通常浪费大量CPU时间。

**事件多路复用**

对于获取非阻塞的资源而言，忙-等模型不是一个理想的技术。但是幸运的是，大多数现代的操作系统提供了一个原生的机制来处理并发，非阻塞资源（同步事件多路复用器）是一个有效的方法。这种机制被称作事件循环机制，这种事件收集和I/O队列源于发布-订阅模式。事件多路复用器收集资源的I/O事件并且把这些事件放入队列中，直到事件被处理时都是阻塞状态。看下面这个伪代码：

```javascript
socketA, pipeB;
wachedList.add(socketA, FOR_READ);
wachedList.add(pipeB, FOR_READ);
while(events = demultiplexer.watch(wachedList)) {
  // 事件循环
  foreach(event in events) {
    // 这里并不会阻塞，并且总会有返回值（不管是不是确切的值）
    data = event.resource.read();
    if (data === RESOURCE_CLOSED) {
      // 资源已经被释放，从观察者队列移除
      demultiplexer.unwatch(event.resource);
    } else {
      // 成功拿到资源，放入缓冲池
      consumeData(data);
    }
  }
}
```

事件多路复用的三个步骤：

- 资源被添加到一个数据结构中，为每个资源关联一个特定的操作，在这个例子中是read。
- 事件通知器由一组被观察的资源组成，一旦事件即将触发，会调用同步的watch函数，并返回这个可被处理的事件。
- 最后，处理事件多路复用器返回的每个事件，此时，与系统资源相关联的事件将被读并且在整个操作中都是非阻塞的。直到所有事件都被处理完时，事件多路复用器会再次阻塞，然后重复这个步骤，以上就是event loop。

**具体实现**

现在来说reactor模式，它通过一种特殊的算法设计的处理程序（在Node.js中是使用一个回调函数表示），一旦事件产生并在事件循环中被处理，那么相关handler将会被调用。

它的结构如图所示：

![](https://user-gold-cdn.xitu.io/2017/10/7/71a0217230777a169f9eac0072249971?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

reactor模式的步骤为：

- 应用程序通过提交请求到时间多路复用器产生一个新的I/O操作。应用程序指定handler，handler 在操作完成后被调用。提交请求到事件多路复用器是非阻塞的，其调用所以会立马返回，将执行权返回给应用程序。
- 当一组I/O操作完成，事件多路复用器会将这些新事件添加到事件循环队列中。
- 此时，事件循环会迭代事件循环队列中的每个事件。
- 对于每个事件，对应的handler被处理。
- handler，是应用程序代码的一部分，handler执行结束后执行权会交回事件循环。但是，在handler 执行时可能请求新的异步操作，从而新的操作被添加到事件多路复用器。
- 当事件循环队列的全部事件被处理完后，循环会在事件多路复用器再次阻塞直到有一个新的事件可处理触发下一次循环。

我们现在可以定义Node.js的核心模式：

模式(反应器)阻塞处理I/O到在一组观察的资源有新的事件可处理，然后以分派每个事件对应handler的方式反应。

#### 解决方案

1、**回调函数**

回调函数是最基本的一种异步调用模式，回调函数会在异步操作完成之后被调用。下面是一个简单的Node.js中异步读取文件的例子：

```javascript
// readFileCallback.js
const fs = require('fs');

fs.readFile('a.txt', (err, data) => {
  if (err) {
    throw err;
  }
  console.log(data.toString());
});

console.log('foo');
```

我们再来看看在同步模式中写代码的场景。假设用户想要读取一个文件，由于读取文件（内部是一个系统调用，需要陷入内核）是一个耗时操作（文件比较大或者使用机械硬盘的时候的尤其耗时），因此在同步模式下，这个读取操作会阻塞当前进程（假设目前没有使用多线程），当前进程将被挂起。当前进程的其他代码在该读取操作完成之前无法被执行，如果这个文件的读取需要耗费1秒，则当前进程就要被阻塞1秒，也就是说宝贵的CPU资源在程序运行的时候要被白白浪费1秒。不要小看这1秒，1秒的CPU资源在程序在运行的时候是非常宝贵的。

缺点就是会导致回调地狱。

2、**Promise**

ES 6中原生提供了Promise对象，Promise对象代表`某个未来才会知道结果的事件`(一般是一个异步操作)，换句话说，一个Pomise就是一个代表了异步操作最终完成或者失败的对象。Promise本质上是一个绑定了回调的对象，而不是像callback异步编程那样直接将回调传入函数内部。

Promise对外提供了统一的API，可供进一步处理。Promise的`最终`状态有两种：`fulfilled`和`rejected`，`fulfilled`表示Promise处于完成状态，`rejected`表示Promise处于被拒绝状态，这两种状态都是Promise的`已决议`状态，相反如果Promise还未被`决议`，它就处于`未决议`状态。

需要强调的一点是，Promise一经决议就无法改变其状态，这使得Promise和它的名字一样：君子一言驷马难追。

使用Promise对象可以用同步操作的流程写法来表达异步操作，避免了层层嵌套的异步回调，代码也更加清晰易懂，方便维护。用Promise重写读取文件的例子：

```javascript
// promiseReadSingleFile.js
const fs = require('fs')

const read = filename => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, data) => {
    	if (err){
    		reject(err);
    	}
    	resolve(data);
    });
  });
}
    
read('a.txt')
.then(data => {
  console.log(data);
}, err => {
  console.error("err: " + err);
});
```

缺点：

- 不可取消
- 不可打断
- 一经决议就不可变

3、**Generator**

ES 6中引入了生成器函数(Generator Function)。生成器函数用`function *`定义。它和普通函数相比有一些有意思的特性。

用一个简单的例子来展示生成器函数的工作方式：

```javascript
// generator.js
function *generator() {
  console.log('hello');
  const x = 10 * (yield 'world');
  return x;
};

const it = generator();
let res = it.next();
console.log(res); // { value: 'world', done: false }

console.log('pause here');

res = it.next(4);
console.log(res); // { value: 40, done: true }
```

通过解析这段代码我们可以发现几个很有意思的事情：

1. 生成器内部可以通过yield主动交出控制权，使控制权回到调用方。
2. yield后面可以有值，有值得yield会将这个值`返回`出来。
3. 可以通过`next()`将值传入生成器中，该值将作为对应yield的值。
4. 调用`next()`后，会获得一个结果，这个结果包含两个值，`value`表示当前yield的执行结果（或者return的结果）`done`表示生成器执行状态的信息：true/false分别表示执行完毕和还未执行完毕。
5. 生成器通过`yeild`和`next`使得外部和生成器内部的通信称为可能。

4、**async/await**

直到ES 7中出现async/await之前，业界普遍都是采用co库的方案。

async和await是ES 7中的新语法，新到连ES 6都不支持，但是可以通过Babel一类的预编译器处理成ES 5的代码。目前比较一致的看法是async和await是js对异步的终极解决方案。要注意的一个点是，await只能用在async函数中，但async函数中未必一定要有await。

下面是一个例子。

```javascript
// async.js
const promiseWrapper = fn => {
  return function () {
    const args = [].slice.call(arguments); // convert arguments to a real array
    return new Promise((resolve, reject) => {
      const cb = (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      };
      fn.apply(null, args.concat(cb));
    });
  };
};

const fs = require('fs');

const readFile = promiseWrapper(fs.readFile);
    
const asyncReadFile = async function () {
	const f1 = await readFile('a.txt', 'utf8');
	const f2 = await readFile('b.txt', 'utf8');
	console.log(f1); // file a content
	console.log(f2); // file b content
};
    
asyncReadFile();
```

除了回调函数、Promise、Generator、async/await这些异步方案以外，还有一种常见的异步方案：事件。在Node.js中使用事件编程十分简单，下面是一个示例：

```javascript
// event.js
var events = require('events');

var eventEmitter = new events.EventEmitter();

eventEmitter.on('news', payload => {
  console.log(payload.data);
});

eventEmitter.on('logout', payload => {
  console.log(`User logout: ${payload.data}`);
});

eventEmitter.emit('news', { data: 'Hello world!'});
eventEmitter.emit('logout', { data: 'Foo'});
```

事件的一大特定是它的解耦能力，事件相比方法调用的耦合度要低一些。