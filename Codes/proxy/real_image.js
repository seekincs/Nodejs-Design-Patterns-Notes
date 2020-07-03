const Image = require('./image')

// 具体类
class RealImage extends Image {

    constructor(filename) {
        super();
        this.filename = filename;
        this.loadFromDisk(filename);
    }

    displayImage() {
        console.log('Displaying ' + this.filename + '...');
    }

    loadFromDisk() {
        console.log('Loading ' + this.filename + '...');
    }
}

module.exports = RealImage;