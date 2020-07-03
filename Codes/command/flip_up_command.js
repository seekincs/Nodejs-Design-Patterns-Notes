const Light = require('./light');
const Command = require('./command');

// 具体命令，打开电灯模式。
class FlipUpCommand extends Command {
    constructor(light = new Light()) {
        super();
        this.light = light;
    }

    execute() {
        this.light.turnOn();
    }
}

module.exports = FlipUpCommand;