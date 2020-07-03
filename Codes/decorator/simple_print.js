const Print = require('./print')

class SimplePrint extends Print {

    constructor(text) {
        super();
        this.text = text;
    }

    print() {
        console.log(this.text)
    }
}

module.exports = SimplePrint;