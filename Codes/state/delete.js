const State = require('./state')
const Confirm = require('./confirm')
const Cancel = require('./cancel')

class Delete extends State {

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
        return 'DELETE';
    }
}

module.exports = Delete