# 设计模式

## 简单工厂模式

这是一种创建型的模式，它允许根据实际对象的属性（比如说ID）确定需要实例化的对象。

![](Images\SimpleFactory.jpg)

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

![](Images\Builder.jpg)

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

![](Images\State.jpg)

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