
const State = require('./state')
const Confirm = require('./confirm')
const Delete = require('./delete')

class Cancel extends State {

    confirm(context) {
        context.setState(new Confirm())
    }

    cancel(context) {
        context.setState(new Cancel())
    }

    delete(context) {
        context.setState(new Delete())
    }

    get() {
        return 'CANCEL'
    }
}

module.exports = Cancel