const State = require('./state')

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

module.exports = Context