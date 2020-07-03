const Decorator = require('./decorator')
const Print = require('./print')

class HashTagDecorator extends Decorator{
    constructor(printObject = new Print()) {
        super();
        this.printObject = printObject;
    }

    print(text) {
        console.log('##');
        this.printObject.print(text);
        console.log('##');
    }
}

module.exports = HashTagDecorator;