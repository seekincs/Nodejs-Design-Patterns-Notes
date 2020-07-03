
const AlternatingCurrent220 = require('./alternating_current_220')
const ChinaPowerAdapter = require('./china_power_adapter')

let alternating_current_220 = new AlternatingCurrent220()
let adapter = new ChinaPowerAdapter(alternating_current_220)
if (adapter.support()) {
    adapter.output()
}
