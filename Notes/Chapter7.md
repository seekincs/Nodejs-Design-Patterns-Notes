# Wiring Modules

## 模块发挥了什么作用

一个软件系统庞大起来的时候，代码的组织将是一个重要的问题。

大型系统的依赖关系一般比较复杂，一个实体在给其他实体提供服务的同时，也调用了其他实体。如果把系统进行划分，应用分而治之的思想，将复杂的系统拆分为多个简单的模块，将会大大提高系统的可读性和可维护性。

## 内聚性和耦合性

衡量模块之间的依赖关系（或者说独立性）通常有两个指标：**内聚性和耦合性**。

- 内聚性是说模块内部的功能组织，其中的每个部分（比如说函数）都只完成特定的功能；

- 耦合性是说模块之间的依赖程度。

在设计的时候，应该尽量做到保持高内聚和低耦合，这样的系统复用性比较高，可拓展性也比较强。

## Node.js中模块的组织模式

一般来说，有四种方式组织模块，分别是硬编码模式、依赖注入模式和服务定位器。

### 硬编码

硬编码模式，就是在一个模块中，通过`require`关键字直接引入其他模块，并且模块通过文件名来区别。

这是最常见的方式。比如下面的例子。`function.js`作为一个模块，为了让其他模块能够使用到它，需要将其导出。在别的模块中，直接通过文件名`function.js`引用这个模块，并使用模块内部的方法或者数据。

```javascript
// function.js
class Function {
    foo() {
        return 'function foo.';
    }
}
// 将模块导出为一个对象
module.exports = new Function();

// client.js
// 硬编码模式导入模块
const Function = require('./function');
Function.foo();
```

上面的例子将`function`模块导出为一个对象，这个对象其实是个单例，由于`Node.js`的模块缓存机制，其他模块导入`function`模块的时候，也将使用同一个对象。事实上，全局都将共享这个对象。

硬编码模式的优点是模块可以是有状态的，这在一些地方就很有用，比如用户登录状态的管理。在无状态的情况下，登录状态不会得到保存，用户每次操作都需要提供身份信息，重新登录，这无疑是难以接受的。但是硬编码模式也有明显的缺点，在单元测试的时候，这种有状态模式就会带来麻烦。因为通常测试需要提供多组数据，有状态情况下，前面的测试可能会对后面的测试数据产生影响。

### 依赖注入

依赖注入模式背后的主要思想是由外部实体提供输入的组件的依赖关系。

这种模式最大的优点是解耦。不需要将模块硬编码到其他模块，可以通过一个工厂来进行管理，将模块作为参数传递。

下面是一个例子。`db.js`是一个通用的底层数据库连接管理模块，以函数的形式导出。`session.js`以参数的形式使用`db`作为模块名，并调用模块的`exec`函数完成一些操作，比如说对数据进行增删改查。在使用的时候，将`db`和`service`作为工厂，通过这个工厂使用模块里的函数或者数据。这种通过依赖注入的方式创建的模块是没有状态的，比如可以通过`dbFactory`工厂创建很多不同的`db`，每一个`db`都是不同的状态。

```javascript
// db.js
module.exports = function (dbName) {
    // do something
    return session(dbName);
}

// service.js
// 传入db作为模块名，op是具体的操作
module.exports = function (db, op) {
    return db.exec(op);
}

// client.js
// 创建工厂
const dbFactory = require('db');
const serviceFactory = require('service');

// 模块调用
const db = dbFactory('db-example');
const service = serviceFactory(db, (data, type) => {
    // manipulate data
})
```

依赖注入的优点是复用性提高了很多，模块的依赖链变短了，只在应用的最顶层引入依赖，其他层只需要将模块作为参数传入。

不过，依赖注入的方式会增加模块设计的复杂性，具体的使用需要在复用性和简单性之间做一个`tradoff`。

### 服务定位器

这种模式和依赖注入很像。它的原则是拥有一个中央注册中心，以便管理系统组件，并在模块需要加载依赖时作为中介。

我们只需要设计一个定位器，管理模块的注册和管理。比如，下面就是一个简单的服务定位器。在使用上，通常是创建模块的工厂，然后将需要使用的模块注册进去，然后通过拿到模块的实例来使用模块里面的数据或者方法。

```javascript
// locator.js
module.exports = () => {
    const dependencies = {};
    const factories = {};
    const serviceLocator = {};

    // 创建工厂
    serviceLocator.factory = (name, factory) => {
        factories[name] = factory;
    };

    // 注册一个模块
    serviceLocator.register = (name, instance) => {
        dependencies[name] = instance;
    };

    // 根据模块名返回模块的实例
    serviceLocator.get = (name) => {
        if (!dependencies[name]) {
            const factory = factories[name];
            dependencies[name] = factory && factory(serviceLocator);
            if (!dependencies[name]) {
                throw new Error('Cannot find module: ' + name);
            }
        }
        return dependencies[name];
    };
    return serviceLocator;
};

// client.js
// 注册模块
const locator = require('locator.js')();
locator.resigter('dbName', 'db-example');
locator.factory('db', require('db'));
locator.factory('service', require('service'));

// 使用模块
locator.get('service');
```

服务定位器的优点在于将模块创建的控制权集中到一个中心注册中心，并且能够根据需要创建对应的模块。但是，如果某个模块发生了问题，通过服务定位器发现问题并不简单，因为服务定位器虽然将模块的依赖关系提取了出来，但模块之间的调用需要通过工厂、注册的方式，模块之间的依赖关系变得透明，不容易通过调用链来确定。