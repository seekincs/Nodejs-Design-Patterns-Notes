const Vendor = require('./vendor')

class Car extends Vendor {
    constructor(name) {
        super(name);
    }
    order() {
        super.order();
        console.log('car vendor.')
    }
}

module.exports = Car