
const State = require('./state')
const Cancel = require('./cancel')
const Delete = require('./delete')

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

module.exports = Confirm