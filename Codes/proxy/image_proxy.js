const Image = require('./image')
const RealImage = require('./real_image')

// 代理类
class ImageProxy extends Image {

    constructor(filename) {
        super();
        this.image = new RealImage(filename);
    }

    displayImage() {
        this.image.displayImage(this.image.filename);
    }
}

module.exports = ImageProxy;