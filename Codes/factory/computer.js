const Vendor = require('./vendor')

class Computer extends Vendor {
    constructor(name) {
        super(name);
    }
    order() {
        super.order();
        console.log('computer vendor.')
    }
}

module.exports = Computer