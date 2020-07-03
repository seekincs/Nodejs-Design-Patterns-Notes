const Print = require('./print')
const StarDecorator = require('./star_decorator')
const HashTagDecorator = require('./hashtag_decorator')
const SimplePrint = require('./simple_print')

const text = 'simple text';
let print = new StarDecorator(new HashTagDecorator(new SimplePrint(text)));
print.print()
