// 命令控制器，负责具体命令的调用。
class Switch {
    constructor() {
        this.history = []
    }
    storeAndExecute(command) {
        this.history.push(command);
        command.execute();
    }
}

module.exports = Switch;