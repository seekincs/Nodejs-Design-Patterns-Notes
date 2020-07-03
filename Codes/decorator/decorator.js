const Print = require('./print')

class Decorator extends Print {

    constructor(printObject = new Print()) {
        super();
        this.printObject = printObject;
    }

    print(text) {
        this.printObject.print(text)
    }
}

module.exports = Decorator;