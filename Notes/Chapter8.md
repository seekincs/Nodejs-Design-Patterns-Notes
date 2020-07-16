# Universal JavaScript for Web Applications

## Share Codes with Browser

因为Node.js和浏览器都有用到JavaScript，所以，可以通过JavaScript组织的共享模块来实现浏览器和Node.js后台的交互。

在CommonJS中，一个文件就是一个模块，通常使用require引入模块，exports导出模块，但是模块的加载是同步的。

Node.js也受到CommonJS的影响，不同的是，Node.js还可以使用module.exports导出对象。

> **exports和module.exports的区别**
>
> module是一个对象，其中有一个exports属性，单独的exports是一个普通的变量，引用了module.exports。

由于CommonJS同步加载模块存在不少弊端，随后便出现了AMD。

AMD（Asynchronous Module Definition，异步模块定义）是为了解决CommonJS不支持异步加载和在浏览器运行的问题而被提出的，RequireJS实现了AMD的API。但AMD实现起来比较复杂，代码难写也难读，不过至少也是一种不错的解决方案。

与AMD关联的还有UMD（Universal Module Definition，通用模块定义），UMD能兼容AMD和CommonJS。可以通过UMD实现模块的共享。下面是一个例子。

因为浏览器和Node.js需要共用同一份代码，所以首先要判断当前环境，根据环境的不同走不同的代码分支。一般可以通过判断全局变量来决定。

```javascript
(function (root, factory) {
    // 环境判断
    if (typeof define === 'function' && define.amd) {
        // 浏览器环境
        define(['mustache'], factory);
    } else if (typeof module === 'object' && typeof module.exports === 'object') {
        // 服务器环境
        const mustache = require('mustache');
        module.exports = factory(mustache);
    } else {
        root.umdModule = factory(root.umdModule);
    }
}(this, function (mustache) {
    let template = '<h1>Hello <i>{{name}}</i></h1>';
    mustache.parse(template);

    return {
        // 公共函数
        sayHello(toWhom) {
            return mustache.render(template, {name: toWhom});
        }
    };
}));
```

在Node.js这边，可以像常规那样引入模块。

```javascript
const umdModule = require('./umdModule');
console.log(umdModule.sayHello('Server!'));
```

而在浏览器部分，则需要提供一个HTML文件。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Browser</title>
    <script src="../node_modules/mustache/mustache.js"></script>
    <script src="./umdModule.js"></script>
</head>
<body>
    <div id="main">
        <script>
            document.getElementById("main").innerHTML = umdModule.sayHello("Browser!");
        </script>
    </div>
</body>
</html>
```

上面两端代码都调用了umdModule模块的sayHello函数，但是在Node.js环境和浏览器环境，表现出来的行为却不同。

## Webpack

webpack是一个打包工具，我们可以用Node.js的方式来写模块代码，使用webpack插件就可以将这些代码转换为能浏览器上跑的代码（虽然同样是JavaScript代码，但是浏览器会存在一些限制，像fs这种模块，即使放到浏览器上跑，也不会起作用）。

这里沿用上面的例子。不管怎样，sayHello函数都是浏览器和Node.js后台共用的函数，可以先封装起来当成一个独立的模块。

```javascript
// sayHello.js
const mustache = require('mustache');

let template = '<h1>Hello <i>{{name}}}</i></h1>';
mustache.parse(template);

module.exports = (toWhom) => {
    return mustache.render(template, {name: toWhom});
}
```

为了让上面的代码片段能在浏览器上面跑，我们需要指定入口函数，比如加一个监听器，当窗口发生load事件的时候，执行预先设计好的代码。

```javascript
// main.js
window.addEventListener('load', () => {
    let sayHello = require('./sayHello');
    let helloMessage = sayHello('Browser!');
    let body = document.getElementsByName('body')[0];
    body.innerHTML = helloMessage;
})
```

这样，使用webpack插件的时候，就可以生成相应的代码。

```bash
# mode 指定环境 
$ webpack --mode=development main.js bundle.js
```

webpack的功能远远不止上面所说的，事实上，webpack能够支持大量的第三方库，像http、path这些，能够将复杂的依赖树解析出来，并且拥有丰富的插件系统。

## Cross-platform Development

跨平台很多时候都是在原有系统上再加一层，屏蔽底层的异构性。比如JVM就是在操作系统上做了一个抽象，使得任何安装JVM的机器上面都可以跑Java程序，不管是Windows系统、Linux系统还是Mac系统。所以，要实现跨平台，首先要解决的是识别不同的平台，然后根据不同的平台执行不同的代码。

比如说，使用JavaScript写的代码需要能在浏览器上跑，也能在Node.js后台跑，那么首先就得适配相应的平台。一般来说，可以根据全局变量实现。

像浏览器全局变量window是Node.js所没有的，可以根据当前环境的window变量情况来区分开不同的环境。

在区分不同平台的时候，有两种方式，运行时的识别和编译时的识别。

对于运行时的识别，只有在运行系统代码的时候才能识别出当前的环境。这可能会导致生成的bundle代码过于庞大，难以维护。

```javascript
// window变量 运行时才能知道是不是undefined
if(typeof window !== 'undefined' && window.document) {
    // client codes
} else {
    // server codes
}
```

对于编译时的识别，只是发生的时间提前到编译时期，同样是通过一些特殊变量来区分环境。比如下面的\__BROWSER__。

```javascript
if(typeof __BROWSER__ !== 'undefined') {
    // client codes
} else {
    // server codes
}
```

在使用webpack打包的时候，只需要配置一下，将`__BROWSER__`列为可解析符号，并在编译的时候对其做一个替换。

比如说下面的配置将`__BROWSER__`识别出来并替换为字符串`"true"`。

```javascript
const definePlugin = new webpack.DefinePlugin({
    "__BROWSER__": "true"
});
```

同时，由于`typeof "true" !== 'undefined'`永远为真，所以，编译器将进一步优化代码为：

```javascript
if(true) {
    // client codes
} else {
    // server codes
}
```

最后，浏览器部分的代码将会被执行。

当然，如果配置不同，也可能会执行不同的代码。

## Conclusion

- 这章主要讲述了使用通用的`JavaScript`来开发`Web`应用。
- 无论是通过AMD，还是webpack，本质上都是浏览器和`Node.js`共享代码。
- 不过，这是一种前后端不分离的设计方案，后端和前端的代码掺杂在一起（共享模块），当项目越来越庞大，管理起来可能会比较困难。
- 跨平台部分严格地说不是真正的跨越多个平台，这里应该是指跨越浏览器和Node.js平台。

