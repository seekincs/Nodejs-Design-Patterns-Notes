const Command = require('./command');
const Light = require('./light');

// 具体命令，关闭电灯模式。
class FlipDownCommand extends Command {
    constructor(light = new Light()) {
        super();
        this.light = light;
    }

    execute() {
        this.light.turnOff();
    }
}

module.exports = FlipDownCommand;