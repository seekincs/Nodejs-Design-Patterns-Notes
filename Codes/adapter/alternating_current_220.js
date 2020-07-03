const AlternatingCurrent = require('./alternating_current');

// 220V 交流电压
class AlternatingCurrent220 extends AlternatingCurrent {

    constructor() {
        super();
        this.value = 220;
    }

    output() {
        return this.value;
    }
}

module.exports = AlternatingCurrent220;