#!/usr/bin/env node
const fs = require('fs');

const filePath = 'dist/libs/ilink/src/main.js';
const content = fs.readFileSync(filePath).toString();
const header = '#!/usr/bin/env node';

if (!content.includes(header)) {
  const data = content.split('\n');
  fs.writeFile(filePath, [header, ...data].join('\n'), function (err) {
    if (err) return console.log(err);
  });
}
