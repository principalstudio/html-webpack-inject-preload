jest.setTimeout(25000);
const fs = require('fs');
if (!fs.existsSync('./test/dist'))
  fs.mkdirSync('./test/dist');