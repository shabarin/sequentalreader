[![Build Status](https://travis-ci.org/shabarin/sequentalreader.svg?branch=master)](https://travis-ci.org/shabarin/sequentalreader)
# sequentalreader
Sequentally read arbitrary chunks of exactly desired amount of data from any ReadableStream

## Usage
```
var readNext = require('sequentalreader')(process.stdin);

readNext(10)
  .then((res) => {
    if (res === null) console.log('EOF');
    console.log('first 10 characters: %s', res);
    return readNext(5);
  })
  .then((res) => {
    if (res === null) console.log('EOF');
    console.log('next 5 characters: %s', res);
  });
```
