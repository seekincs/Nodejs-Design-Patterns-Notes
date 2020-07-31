# Advanced Asynchronous Recipes

本章概要：

- 异步引入模块并初始化
- 在高并发的应用程序中使用批处理和缓存异步操作的性能优化
- 运行与Node.js处理并发请求的能力相悖的阻塞事件循环的同步CPU绑定操作

  

在第二章中，我们提到了require()是同步的，并且module.exports也不能异步设置。

但是，在核心模块和许多npm包中都存在许多同步API，是否同步加载会被作为一个option参数被提供，主要用于初始化任务。

另一方面，同步API可能并不总是可用的，特别是对于在初始化阶段使用网络的组件，例如执行三次握手协议或在网络中检索配置参数。 许多数据库驱动程序和消息队列等中间件系统的客户端都是如此。

在没有同步API的情况下，如何在组件使用之前进行初始化？下面将讨论这个问题。

##   典型的解决方案

假设现在有一个db模块，负责连接到远程数据库。因为只有在和服务器连接成功之后，db模块才能接受请求。

通常，有两种方案。

第一种方案是保证模块已经初始化。每次在调用一个异步操作的时候都需要进行这样的检查过程。

```javascript
const db = require('db'); // 异步模块
module.exports = function findAll(type, callback) {
  if (db.connected) { // 检查是否已经初始化
    runFind();
  } else {
    db.once('connected', runFind);
  }

  function runFind() {
    db.findAll(type, callback);
  };
};
```

另一种方案是使用依赖注入。这样我们可以让模块的初始化工作推迟到后面，并且模块的复杂性也转移到了其父模块。比如下面的app.js模块。

```javascript
// app.js
const db = require('db'); // 异步模块
const findAllFactory = require('./findAll');
db.on('connected', function() {
  const findAll = findAllFactory(db);
  // 这里可以执行一些执行异步操作
});

// findAll.js
module.exports = db => {
  // db在这里被初始化
  return function findAll(type, callback) {
    db.findAll(type, callback);
  }
}
```

有时候依赖注入的效果并不太理想，特别是对于大型项目，如果使用支持异步初始化模块的DI容器，问题可能还没那么糟糕。

不过，还有第三种解决方案。

## 预初始化队列

一个模块还没有初始化可以被其他模块调用吗？

可以的。一个可行的操纵是保存一个模块在尚未初始化的时候接收到的所有操作，然后在所有初始化步骤完成后立即执行这些操作。

### 实现一个异步初始化的模块

为了演示这个简单而有效的技术，我们来构建一个应用程序。首先创建一个名为asyncModule.js的异步初始化模块：

```javascript
const asyncModule = module.exports;

asyncModule.initialized = false;
asyncModule.initialize = callback => {
  setTimeout(() => {
    asyncModule.initialized = true;
    callback();
  }, 10000);
};

asyncModule.tellMeSomething = callback => {
  process.nextTick(() => {
    if(!asyncModule.initialized) {
      return callback(
        new Error('I don\'t have anything to say right now')
      );
    }
    callback(null, 'Current time is: ' + new Date());
  });
};
```

在上面的代码中，asyncModule使用了异步初始化的模式。 它有一个initialize()方法，在10秒的延迟后，将初始化的flag变量设置为true，并通知它的回调调用。
另一个方法tellMeSomething()返回当前的时间，但是如果模块还没有初始化，它抛出产生一个异常。 接下来，根据我们刚刚创建的服务创建另一个模块。 我们设计一个简单的HTTP请求处理程序：

```javascript
const asyncModule = require('./asyncModule');

module.exports.say = (req, res) => {
  asyncModule.tellMeSomething((err, something) => {
    if(err) {
      res.writeHead(500);
      return res.end('Error:' + err.message);
    }
    res.writeHead(200);
    res.end('I say: ' + something);
  });
};
在
```

handler中调用asyncModule的tellMeSomething()方法，然后将其结果写入HTTP响应中。 因为我们没有对asyncModule的初始化状态进行任何检查，这可能会导致一些意料之外的事情发生。
最后，我们创建app.js模块：

```javascript
const http = require('http');
const routes = require('./routes');
const asyncModule = require('./asyncModule');

asyncModule.initialize(() => {
  console.log('Async module initialized');
});

http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/say') {
    return routes.say(req, res);
  }
  res.writeHead(404);
  res.end('Not found');
}).listen(8000, () => console.log('Started'));
```

app.js作为程序的入口，我们运行这个程序，打开http://localhost:8000，和预期的一样，如果我们在服务器启动后立即发送请求，结果将是一个错误，如下所示：

```
Error:I don't have anything to say right now
```

从上面的例子可以看出，如果模块未初始化也可能带来一些潜在的问题。

### 用预初始化队列包装模块

我们可以在asyncModule尚未初始化的这段时间内对所有调用的操作推入一个预初始化队列，然后在异步模块加载好后处理它们时立即刷新队列。这其实是应用了状态模式。我们将需要两个状态，一个在模块尚未初始化的时候将所有操作排队，另一个在初始化完成时将每个方法简单地委托给原始的asyncModule模块。
首先，我们需要创建一个代理，并将原始异步模块的操作委托给这个代理：

```javascript
const asyncModule = require('./asyncModule');
const asyncModuleWrapper = module.exports;
asyncModuleWrapper.initialized = false;
asyncModuleWrapper.initialize = () => {
  activeState.initialize.apply(activeState, arguments);
};
asyncModuleWrapper.tellMeSomething = () => {
  activeState.tellMeSomething.apply(activeState, arguments);
};
```

上面的代码中asyncModuleWrapper将其每个方法简单地委托给activeState。 

```javascript
// 当模块没有被初始化时的状态
let pending = [];
let notInitializedState = {

  initialize: function(callback) {
    asyncModule.initialize(function() {
      asyncModuleWrapper.initalized = true;
      activeState = initializedState;

      pending.forEach(function(req) {
        asyncModule[req.method].apply(null, req.args);
      });
      pending = [];
    
      callback();
    });
  },

  tellMeSomething: function(callback) {
    return pending.push({
      method: 'tellMeSomething',
      args: arguments
    });
  }

};
```
当initialize()方法被调用时，将会初始化asyncModule模块。 这时候，asyncModuleWrapper就能够知道什么时候原始模块被初始化，在初始化后执行预初始化队列的操作，之后清空预初始化队列，再调用作为参数的回调函数。

重新运行这个程序。如果我们试图再次向服务器发送一个请求，我们会看到在asyncModule模块尚未初始化的时候，请求不会失败; 相反，他们会挂起，直到初始化完成，然后才会被实际执行。我们当然可以肯定，比起之前，容错率变得更高了。



## 异步批处理和缓存

在高负载的应用程序中，缓存起着至关重要的作用，几乎在网络中的任何地方，从网页，图像和样式表等静态资源到纯数据（如数据库查询的结果）都会使用缓存。 我们可以如何将缓存应用于异步操作，并且利用缓存解决高请求吞吐量的问题。

### 实现没有缓存或批处理的服务器

我们首先来实现一个小型的服务器，以便用它来衡量缓存和批处理等技术在解决高负载应用程序的优势。

考虑一个管理电子商务公司销售的Web服务器，我们要使用的数据模型是存储在sales这一个sublevel中的简单事务列表，它是以下的形式：

```
transactionId {amount, item}
```

key由transactionId表示，value则是一个JSON对象，它包含amount，表示销售金额和item，表示项目类型。 

```javascript
const level = require('level');
const sublevel = require('level-sublevel');

const db = sublevel(level('example-db', {valueEncoding: 'json'}));
const salesDb = db.sublevel('sales');

module.exports = function totalSales(item, callback) {
  console.log('totalSales() invoked');
  let sum = 0;
  salesDb.createValueStream()  
    .on('data', data => {
      if(!item || data.item === item) { 
        sum += data.amount;
      }
    })
    .on('end', () => {
      callback(null, sum);  
    });
};
```

该模块的核心是totalSales函数。这个函数的基本逻辑如下：

从包含交易信息的salesDb的sublevel创建一个Stream。Stream将从数据库中提取所有条目。
监听data事件，这个事件触发时，将从数据库Stream中提取出每一项，如果这一项的item参数正是我们需要的item，就去累加它的amount到总的sum里面。
最后，end事件触发时，我们最终调用callback()方法。
上述查询方式可能在性能方面并不好。理想情况下，在实际的应用程序中，我们可以使用索引，甚至使用增量映射来缩短实时计算的时间；但是，由于我们需要体现缓存的优势，对于上述例子来说，慢速的查询实际上更好，因为它会突出显示我们要分析的模式的优点。
为了完成总销售应用程序，我们只需要从HTTP服务器公开totalSales的API：

```javascript
// app.js
const http = require('http');
const url = require('url');
const totalSales = require('./totalSales');

http.createServer((req, res) => {
  const query = url.parse(req.url, true).query;
  totalSales(query.item, (err, sum) => {
    res.writeHead(200);
    res.end(`Total sales for item ${query.item} is ${sum}`);
  });
}).listen(8000, () => console.log('Started'));
```

启动这个服务，请求这个HTTP接口，访问以下URL：http://localhost:8000/?item=book
不过，为了更好地了解服务器的性能，我们需要连续发送多个请求。

如果我们以200ms的间隔发送请求，我们会发现，这些请求需要一定的时间才能完成。

### 批量异步请求

在处理异步操作时，最基本的缓存级别可以通过将一组调用集中到同一个API来实现。这非常简单：如果我们在调用异步函数的同时在队列中还有另一个尚未处理的回调，我们可以将回调附加到已经运行的操作上，而不是创建一个全新的请求。。

### 在电子商务销售的Web服务器中使用批处理

现在让我们在totalSales API上添加一个批处理层。我们要使用的模式非常简单：如果在API被调用时已经有另一个相同的请求挂起，我们将把这个回调添加到一个队列中。当异步操作完成时，其队列中的所有回调立即被调用。
现在，创建一个名为totalSalesBatch.js的新模块。在这里，我们将在原始的totalSales API之上实现一个批处理层：

```javascript
const totalSales = require('./totalSales');

const queues = {};
module.exports = function totalSalesBatch(item, callback) {
  if(queues[item]) {  
    console.log('Batching operation');
    return queues[item].push(callback);
  }

  queues[item] = [callback];  
  totalSales(item, (err, res) => {
    const queue = queues[item];  
    queues[item] = null;
    queue.forEach(cb => cb(err, res));
  });
};
```

totalSalesBatch()函数是原始的totalSales() API的代理，它的工作原理如下：
如果请求的item已经存在队列中，则意味着该特定item的请求已经在服务器任务队列中。在这种情况下，我们所要做的只是将回调push到现有队列，并立即从调用中返回。不进行后续操作。如果请求的item没有在队列中，这意味着我们必须创建一个新的请求。为此，我们为该特定item的请求创建一个新队列，并使用当前回调函数对其进行初始化。 接下来，我们调用原始的totalSales() API。
当原始的totalSales()请求完成时，则执行我们的回调函数，我们遍历队列中为该特定请求的item添加的所有回调，并分别调用这些回调函数。

totalSalesBatch()函数的行为与原始的totalSales() API的行为相同，不同之处在于，现在对于相同内容的请求API进行批处理，从而节省时间和资源。

如果我们现在尝试再次启动服务器并进行负载测试，我们首先看到的是请求被批量返回。
除此之外，我们观察到请求的总时间大大减少；它应该至少比对原始totalSales() API执行的原始测试快很多了。


### 异步请求缓存策略

异步批处理模式的问题之一是对于API的答复越快，我们对于批处理来说，其意义就越小。有人可能会争辩说，如果一个API已经很快了，那么试图优化它就没有意义了。然而，它仍然是一个占用应用程序的资源负载的因素，总结起来，仍然可以有解决方案。另外，如果API调用的结果不会经常改变；因此，这时候批处理将并不会有较好的性能提升。在这种情况下，减少应用程序负载并提高响应速度的最佳方案肯定是更好的缓存模式。

缓存模式很简单：一旦请求完成，我们将其结果存储在缓存中，该缓存可以是变量，数据库中的条目，也可以是专门的缓存服务器。因此，下一次调用API时，可以立即从缓存中检索结果，而不是产生另一个请求。

对于一个有经验的开发人员来说，缓存不应该是多么新的技术，但是异步编程中这种模式的不同之处在于它应该与批处理结合在一起，以达到最佳效果。原因是因为多个请求可能并发运行，而没有设置缓存，并且当这些请求完成时，缓存将会被设置多次，这样做则会造成缓存资源的浪费。

### 有关实现缓存机制的说明

我们必须记住，在实际应用中，我们可能想要使用更先进的失效技术和存储机制。 这可能是必要的，原因如下：

大量的缓存值可能会消耗大量内存。 在这种情况下，可以应用最近最少使用（LRU）算法来保持恒定的存储器利用率。

当应用程序分布在多个进程中时，对缓存使用简单变量可能会导致每个服务器实例返回不同的结果。如果这对于我们正在实现的特定应用程序来说是不希望的，那么解决方案就是使用共享存储来存储缓存。 常用的解决方案是Redis和Memcached。

与定时淘汰缓存相比，手动淘汰高速缓存可使得高速缓存使用寿命更长，同时提供更新的数据，但当然，管理起缓存来要复杂得多。



## 运行CPU密集型任务

虽然上面的totalSales()在系统资源上面消耗较大，但是其也不会影响服务器处理并发的能力。 在事件循环机制中，调用异步操作会导致堆栈退回到事件循环，从而使其免于处理其他请求。

但是，当我们运行一个长时间的同步任务时，会发生什么情况，从不会将控制权交还给事件循环？

这种任务也被称为CPU密集型任务，因为它的主要特点是CPU利用率较高，而不是I/O操作繁重。 

下面以子集和问题作为作为一个例子。

### 解决子集总和问题

子集总和问题：我们需要判断一个数组中是否具有一个子数组，其总和为0。

例如，如果数组[1, 2, -4, 5, -3]作为输入，则满足问题的子数组是[1, 2, -3]和[2, -4, 5, -3]。

最简单的算法是把每一个数组元素做遍历然后依次计算，时间复杂度为O(2^n)，

当然，这个问题的解决方案可能并不算复杂。为了使事情变得更加困难，我们将考虑数组和问题的以下变化：给定一组整数，我们要计算所有可能的组合，其总和等于给定的任意整数。

```javascript
const EventEmitter = require('events').EventEmitter;
class SubsetSum extends EventEmitter {
  constructor(sum, set) {
      super();
      this.sum = sum;
      this.set = set;
      this.totalSubsets = 0;
    } //...
}
```

SubsetSum类是EventEmitter类的子类；这使得我们每次找到一个匹配收到的总和作为输入的新子集时都会发出一个事件。 

接下来，我们可以使用一个简单的HTTP服务器对响应的任务作出响应。 我们希望以

```http
/subsetSum?data=<Array>&sum=<Integer>
```

这样的请求格式进行响应，传入给定的数组和sum，使用SubsetSum算法进行匹配。
创建一个名为app.js的模块中实现这个简单的服务器：

```javascript
const http = require('http');
const SubsetSum = require('./subsetSum');

http.createServer((req, res) => {
  const url = require('url').parse(req.url, true);
  if(url.pathname === '/subsetSum') {
    const data = JSON.parse(url.query.data);
    res.writeHead(200);
    const subsetSum = new SubsetSum(url.query.sum, data);
    subsetSum.on('match', match => {
      res.write('Match: ' + JSON.stringify(match) + '\n');
    });
    subsetSum.on('end', () => res.end());
    subsetSum.start();
  } else {
    res.writeHead(200);
    res.end('I\m alive!\n');
  }
}).listen(8000, () => console.log('Started'));
```

由于SubsetSum实例使用事件返回结果，所以我们可以在算法生成后立即对匹配的结果使用Stream进行处理。另一个需要注意的细节是，每次我们的服务器都会返回I'm alive!，这样我们每次发送一个不同于/subsetSum的请求的时候。可以用来检查我们服务器是否挂掉了。

我们启动一下这个服务，连续发送两个请求，并且在第一个请求，没有完成之前发送第二个请求。这时候，问题就暴露出来了：后面那个请求一直处于挂起状态，服务器没有返回响应。

这是因为Node.js事件循环运行在一个单独的线程中，如果这个线程被一个长的同步计算阻塞，它将不能再执行一个循环来响应I'm alive!， 我们必须知道，这种代码显然不能够用于同时接收到多个请求的应用程序。

但是不要对Node.js绝望，我们可以通过几种方式来解决这种情况。最常见的是使用setImmediate和interleaving模式。

### 使用多个进程

在Node.js中处理进程很简单，可能比修改一个使用setImmediate()的算法更容易，并且多进程允许我们轻松使用多个处理器，而无需扩展主应用程序本身。

Node.js有一个充足的API库带来与外部进程交互。

#### 将子集求和任务委托给其他进程

我们现在的目标是创建一个单独的子进程，负责处理CPU密集型的任务，使服务器的事件循环专注于处理来自网络的请求。

大概思路如下：

可以创建一个新模块，它将允许我们创建一个正在运行的进程池。创建一个新的进程代价昂贵，需要时间，因此我们需要保持它们不断运行，尽量不要产生中断，时刻准备好处理请求，使我们可以节省时间和CPU。

此外，进程池需要帮助我们限制同时运行的进程数量，以避免将使我们的应用程序受到拒绝服务（DoS）攻击。

接下来，我们将创建一个名为subsetSumFork.js的模块，负责抽象子进程中运行的SubsetSum任务。 它的角色将与子进程进行通信，并将任务的结果展示为来自当前应用程序。

最后，我们需要一个worker（我们的子进程），一个新的Node.js程序，运行子集求和算法并将其结果转发给父进程。

#### 实现一个进程池

先从构建processPool.js模块开始：

```javascript
const fork = require('child_process').fork;
class ProcessPool {
  constructor(file, poolMax) {
      this.file = file;
      this.poolMax = poolMax;
      this.pool = [];
      this.active = [];
      this.waiting = [];
    } //...
}
```
在模块的第一部分，引入我们将用来创建新进程的child_process.fork()函数。 然后，我们定义ProcessPool的构造函数，该构造函数接受表示要运行的Node.js程序的文件参数以及池中运行的最大实例数poolMax作为参数。然后我们定义三个实例变量：

- pool 表示的是准备运行的进程
- active 表示的是当前正在运行的进程列表
- waiting 包含所有这些请求的任务队列，保存由于缺少可用的资源而无法立即实现的任务

然后实现ProcessPool类的acquire()方法，它负责取出一个准备好被使用的进程：

```javascript
acquire(callback) {
  let worker;
  if(this.pool.length > 0) {  
    worker = this.pool.pop();
    this.active.push(worker);
    return process.nextTick(callback.bind(null, null, worker));
  }

  if(this.active.length >= this.poolMax) {  
    return this.waiting.push(callback);
  }

  worker = fork(this.file);  
  this.active.push(worker);
  process.nextTick(callback.bind(null, null, worker));
}
```
函数逻辑如下：
如果在进程池中有一个准备好被使用的进程，我们只需将其移动到active数组中，然后通过异步的方式调用其回调函数。
如果池中没有可用的进程，或者已经达到运行进程的最大数量，必须等待。通过把当前回调放入waiting数组。
如果我们还没有达到运行进程的最大数量，我们将使用child_process.fork()创建一个新的进程，将其添加到active列表中，然后调用其回调。
ProcessPool类的最后一个方法是release()，其目的是将一个进程放回进程池中：

```javascript
release(worker) {
  if(this.waiting.length > 0) {  
    const waitingCallback = this.waiting.shift();
    waitingCallback(null, worker);
  }
  this.active = this.active.filter(w => worker !==  w);  
  this.pool.push(worker);
}
```
#### 和子进程通信

现在我们的ProcessPool类已经准备就绪，我们可以使用它来实现SubsetSumFork模块，SubsetSumFork的作用是与子进程进行通信得到子集求和的结果。前面曾说到，用child_process.fork()启动一个进程也给了我们创建了一个简单的基于消息的管道，通过实现subsetSumFork.js模块来看看它是如何工作的：

```javascript
const EventEmitter = require('events').EventEmitter;
const ProcessPool = require('./processPool');
const workers = new ProcessPool(__dirname + '/subsetSumWorker.js', 2);

class SubsetSumFork extends EventEmitter {
  constructor(sum, set) {
    super();
    this.sum = sum;
    this.set = set;
  }

  start() {
    workers.acquire((err, worker) => {  
      worker.send({sum: this.sum, set: this.set});

      const onMessage = msg => {
        if (msg.event === 'end') {  
          worker.removeListener('message', onMessage);
          workers.release(worker);
        }
    
        this.emit(msg.event, msg.data);  
      };
    
      worker.on('message', onMessage); 
    });
  }
}
module.exports = SubsetSumFork;
```

#### 与父进程进行通信

现在我们来创建subsetSumWorker.js模块，我们的应用程序，这个模块的全部内容将在一个单独的进程中运行：

```javascript
const SubsetSum = require('./subsetSum');

process.on('message', msg => { 
  const subsetSum = new SubsetSum(msg.sum, msg.set);

  subsetSum.on('match', data => {  
    process.send({event: 'match', data: data});
  });

  subsetSum.on('end', data => {
    process.send({event: 'end', data: data});
  });

  subsetSum.start();
});
```

由于我们的handler处于一个单独的进程中，我们不必担心这类CPU密集型任务阻塞事件循环，所有的HTTP请求将继续由主应用程序的事件循环处理，而不会中断。不过当子进程不是Node.js进程时，则上述的通信管道就不可用了。在这种情况下，我们仍然可以通过在暴露于父进程的标准输入流和标准输出流之上实现我们自己的协议来建立父子进程通信的接口。

多进程模式比较强大和灵活；然而，由于单个机器提供的CPU和内存资源量仍然是一个硬性限制，所以它仍然不可扩展。在这种情况下，将负载分配到多台机器上，则是更优秀的解决办法。

在运行CPU密集型任务时，多线程可以成为多进程的替代方案。目前，有几个npm包公开了一个用于处理用户级模块的线程的API；其中最流行的是webworker-threads。但是，即使线程更轻量级，完整的进程也可以提供更大的灵活性，并具备更高更可靠的容错处理。



