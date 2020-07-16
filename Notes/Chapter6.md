# 设计模式

## 简单工厂模式

这是一种创建型的模式，它允许根据实际对象的属性（比如说ID）确定需要实例化的对象。

![](..\Images\SimpleFactory.jpg)

举个例子。现在存在一个生产商，可以出售汽车和计算机两种商品，我们可以将其抽象为一个父类，简单起见，这里只定义了一个预定的接口`order`。并且规定了需要生产的商品的名称`name`，之后可以根据这个`name`来生成对应的实例。

```javascript
class Vendor {
    constructor(name) {
        this.name = name;
    }
    order(){}
}
```

然后，可以定义这个生产商的具体商品，具体的商品需要继承这个父类。

比如说`Car`类。

```javascript
class Car extends Vendor {
    constructor(name) {
        super(name);
    }
    order() {
        super.order();
        console.log('car vendor.')
    }
}
```

然后，可以定义一个工厂，这个工厂可以根据之前定义的规则来派生出对应的对象。比如说，如果提供的类型为`car`，就实例化`Car`类。这样不需要讲具体的创建对象逻辑写在一起，降低耦合性。

```javascript
class MyFactory {
    static fac(type) {
        let vendor
        switch (type) {
            case 'car': {
                vendor = new Car()
                break
            }
            case 'computer': {
                vendor = new Computer()
                break
            }
        }
        vendor.order()
    }
}
```

[源码链接](https://github.com/seekincs/Nodejs-Design-Patterns-Notes/tree/master/Codes/factory)

## 创建者模式

这也是创建型的设计模式。

![](..\Images\Builder.jpg)

如果一个类包含很多属性，而且需要为这个写构造函数的话，尽管可以重载构造函数，从而提供更多的“根据属性创建对象的方法”，但是这会让类的代码变得臃肿庞大。

比如说，如果一个类有3个属性，现在需要通过给定3个属性中的任意多个来创建对象，我们可能就得写8个构造函数。这只是3个属性，如果更多会更加麻烦。

使用创建者模式，可以根据所需创建包含想要属性的对象，代码会更加简洁。

比如说，现在需要根据根据年龄和性别来创建对象，如果是普通的构造函数的写法的话，需要写4个构造函数，下面是使用builder模式实现同样逻辑的代码。

```javascript
class UserBuilder {

    withAge(age = 21) {
        this.age = age;
        return this;
    }

    withGender(gender = 'M') {
        this.gender = gender;
        return this;
    }

    build() {
        return new User(this);
    }
}

class User {
    constructor({age, gender}) {
        this.age = age;
        this.gender = gender;
    }
}
```

创建对象的写法也和简洁，只需要指定需要填充的属性。

```javascript
let user = new UserBuilder()
    .withAge(22)
    .withGender('F')
    .build()
```

[源码链接](https://github.com/seekincs/Nodejs-Design-Patterns-Notes/tree/master/Codes/builder)

## 状态模式

这是一种行为型的设计模式。它的主要特点是能够将状态改变的代码从状态本身抽离出来，降低耦合性，提高内聚性。

![](..\Images\State.jpg)

具体实现的时候，通过一个通用的状态定义，以及一个状态管理器，实现状态之间的转移。

比如说，如果现在需要管理订单的状态，假定状态只有3种：已确认、已取消和已删除。

在通用状态里，我们可以这样定义。我们并没有指定每一个状态具体的实现逻辑，因为通过传入一个context参数，状态现在已经交给Context来管理了。

```javascript
class State {
    confirm(context) {
    }

    cancel(context) {
    }

    delete(context) {
    }

    get() {
    }
}
```

然后就可以实现具体的状态。

```javascript
class Confirm extends State{

    confirm(context) {
        context.setState(new Cancel())
    }

    cancel(context) {
        context.setState(new Confirm())
    }

    delete(context) {
        context.setState(new Delete())
    }

    get() {
        return 'CONFIRM'
    }
}
```

通过Context管理上面定义的这些状态。Context实际上充当了一个中间者的角色。

```javascript
class Context {

    constructor() {
        this.state = new State()
    }

    setState(state) {
        this.state = state
    }

    confirm() {
        this.state.confirm(this)
        console.log('reservation confirm.')
    }

    cancel() {
        this.state.cancel(this)
        console.log('reservation cancel.')
    }

    delete() {
        this.state.delete(this)
        console.log('reservation delete.')
    }
}
```

[源码链接](https://github.com/seekincs/Nodejs-Design-Patterns-Notes/tree/master/Codes/state)

## 代理模式

这是一种结构型的模式。

代理模式建议新建一个与原服务对象接口相同的代理类， 然后更新应用以将代理对象传递给所有原始对象客户端。 代理类接收到客户端请求后会创建实际的服务对象， 并将所有工作委派给它。另外，代理对象和主体对象有一套相同的接口，这使得在使用代理的过程中，实际的对象对于使用者而言是透明的。

UML图如下所示。

![](..\Images\Proxy.jpg)

假设现在有一个图像类，对外暴露一个`displayImage`接口，以显示图像。

```javascript
class RealImage extends Image {
    constructor(filename) {
        super();
        this.filename = filename;
        this.loadFromDisk(filename);
    }
    displayImage() {
        console.log('Displaying ' + this.filename + '...');
    }
    loadFromDisk() {
        console.log('Loading ' + this.filename + '...');
    }
}
```

代理类通过加入一个具体类的对象并调用其相应的方法，来屏蔽实际对象。比如说，下面的这个代理类。`ImageProxy`将`RealImage`的一个实例变为其中的属性，并通过调用这个属性的`displayImage`方法，从而让使用者在不知道实际类的情况下使用实际类的一些功能。

```javascript
class ImageProxy extends Image {
    constructor(filename) {
        super();
        this.image = new RealImage(filename);
    }
    displayImage() {
        this.image.displayImage(this.image.filename);
    }
}
```

[源码链接](https://github.com/seekincs/Nodejs-Design-Patterns-Notes/tree/master/Codes/proxy)

## 装饰器模式

这是一种结构型的设计模式。

通过在实际的真实对象上再封装一层，**能够在不改变原类文件和使用继承的情况下，动态的扩展一个对象的功能。**

UML图如下所示。

![](..\Images\Decorator.jpg)

比如现在有一个原始的类，能够将给定的字符打印出来。

```javascript
class SimplePrint extends Print {
    constructor(text) {
        super();
        this.text = text;
    }
    print() {
        console.log(this.text)
    }
}
```

在不改变这个类的基础上，我们需要对的打印的字符串做一个装饰，比如说增加一些特殊字符（`**`）。

```javascript
class StarDecorator extends Decorator {
    constructor(printObject = new Print()) {
        super();
        this.printObject = printObject;
    }
    print(text) {
        console.log('**');
        this.printObject.print(text)
        console.log('**');
    }
}
```

这样，可以通过使用通用接口来调用之前定义的方法，就是这里的`print`方法。本来只有`SimplePrint`类，但是我们需要增加一些功能，但是又改变原有的类，因此，通过装饰器，我们将在原对象的基础上增加了一些功能。

```javascript
const text = 'simple text';
let print = new StarDecorator(new HashTagDecorator(new SimplePrint(text)));
print.print()

// 输出
//**
//##
//simple text
//##
//**
```

[源码链接](https://github.com/seekincs/Nodejs-Design-Patterns-Notes/tree/master/Codes/decorator)

## 适配器模式

这是一种结构型的设计模式。

适配器在客户类和目标类之间扮演了一个中间角色，本来客户类不能直接访问目标类，但是通过适配器做一个转换就可以。

适配器模式的UML图如下图所示。

![](..\Images\Adapter.jpg)

举个例子。现在中国的家用电压都是220V，但是手机的使用电压可能只有5V，我们不能直接将220V的电通到手机，需要做转换。

用一个类来表示220V的电压。

```javascript
class AlternatingCurrent220 extends AlternatingCurrent {
    constructor() {
        super();
        this.value = 220;
    }
    output() {
        return this.value;
    }
}
```

此外，我们需要一个适配器，将220V转换为5V。适配器传入原来的220V电压，经过一定的处理，输出目标电压。

```javascript
class ChinaPowerAdapter extends Adapter {
    constructor(alternatingCurrent) {
        super();
        // 支持的电压
        this.value = 220;
        this.alternatingCurrent = alternatingCurrent;
    }
    support() {
        return this.value === this.alternatingCurrent.output()
    }
    output() {
        let input = this.alternatingCurrent.output();
        let output = this.alternatingCurrent.output() / 44; // 220V / 44 = 5V
        console.log(`After transfer voltage: ${input} => ${output}`);
        return output;
    }
}
```

在使用的时候，我们不用管原始电压是多少，只要用对了适配器，总是能得到理想的电压。

```javascript
let alternating_current_220 = new AlternatingCurrent220()
let adapter = new ChinaPowerAdapter(alternating_current_220)
if (adapter.support()) {
    adapter.output()
}
```

[源码链接](https://github.com/seekincs/Nodejs-Design-Patterns-Notes/tree/master/Codes/adapter)

## 命令模式

这是一种行为型设计模式。

通常，在执行命令的时候，我们都需要制定执行命令的主体对象，并由主体对象来触发命令。

但是，在命令模式中，命令与执行命令的主体是脱离的，它们接触了耦合关系。

命令模式的典型组织可以描述如下：

- `Command`：这是封装调用一个必要信息的对象方法或功能。
- `Client`：这将创建该命令并将其提供给调用者。
- `Invoker`：这是负责执行目标上的命令。
- `Target`（或`Receiver`）：这是调用的主题。它可以是一个单独的功能或对象的方法。

其UML图如下所示。

![](..\Images\Command.jpg)

假设现在有一个命令的主体：电灯，在电灯上有两个命令，分别是开灯和关灯。我们现在不把开灯和关灯的执行逻辑写进电灯这个对象里面，只是单独保存电灯的两个动作，具体动作的执行者由其他类来控制。

电灯这个类可以简单这如下。

```javascript
class Light {
    turnOn() {
        console.log('Light is on...');
    }
    turnOff() {
        console.log('Light is off...');
    }
}
```

然后，我们需要单独定封装两个命令类，传入分别传入一个电灯对象作为`Reciever`。

```javascript
// 具体命令，打开电灯模式。
class FlipUpCommand extends Command {
    constructor(light = new Light()) {
        super();
        this.light = light;
    }
    execute() {
        this.light.turnOn();
    }
}
```

最后，定义一个调度器来执行这两个命令。

```javascript
// 命令控制器，负责具体命令的调用。
class Switch {
    constructor() {
        this.history = []
    }
    storeAndExecute(command) {
        this.history.push(command);
        command.execute();
    }
}
```

使用的时候，分别初始化电灯类、封装好的两个命令，以及命令调度器。在用户选择下，执行不同的命令。

```javascript
let lamp = new Light();
let flipUpCommand = new FlipUpCommand(lamp);
let flipDownCommand = new FlipDownCommand(lamp);
let lightSwitch = new Switch();


let choice = readlineSync.question('press On/OFF to turn on/off the light:')

while (choice) {
    if (choice === 'ON') {
        lightSwitch.storeAndExecute(flipUpCommand);
    } else {
        lightSwitch.storeAndExecute(flipDownCommand);
    }
    choice = readlineSync.question('Again:')
}
```

[源码链接](https://github.com/seekincs/Nodejs-Design-Patterns-Notes/tree/master/Codes/command)