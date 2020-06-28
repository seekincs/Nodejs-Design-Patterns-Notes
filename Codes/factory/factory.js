const Car = require('./car')
const Computer = require('./computer')

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

module.exports = MyFactory