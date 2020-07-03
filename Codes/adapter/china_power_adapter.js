const Adapter = require('./adapter');

class ChinaPowerAdapter extends Adapter {

    constructor(alternatingCurrent) {
        super();
        // 支持的电压
        this.value = 220;
        this.alternatingCurrent = alternatingCurrent;
    }

    support() {
        return this.value === this.alternatingCurrent.output()
    }

    output() {
        let input = this.alternatingCurrent.output();
        let output = this.alternatingCurrent.output() / 44; // 220V / 44 = 5V
        console.log(`After transfer voltage: ${input} => ${output}`);
        return output;
    }
}

module.exports = ChinaPowerAdapter;