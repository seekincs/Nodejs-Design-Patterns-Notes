const Light = require('./light');
const FlipUpCommand = require('./flip_up_command');
const FlipDownCommand = require('./flip_down_command');
const Switch = require('./switch');
const readlineSync = require('readline-sync');

let lamp = new Light();
let flipUpCommand = new FlipUpCommand(lamp);
let flipDownCommand = new FlipDownCommand(lamp);
let lightSwitch = new Switch();


let choice = readlineSync.question('press On/OFF to turn on/off the light:')

while (choice) {
    if (choice === 'ON') {
        lightSwitch.storeAndExecute(flipUpCommand);
    } else {
        lightSwitch.storeAndExecute(flipDownCommand);
    }
    choice = readlineSync.question('Again:')
}
