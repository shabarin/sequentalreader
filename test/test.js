"use strict";

let assert = require('chai').assert;
let stream = require('stream');
let getStreamSequentalReader = require('../index');

/**
 * creates ReadableStream that generates stream of 0, 1, 2 ... 9, 0, 1, 2, ...
 * @options.maxSize the maximum count of elements until eof
 */
class MyReadable extends stream.Readable {

    constructor(options) {
        super(options);
        this._num = 0;
        this._maxSize = options.maxSize;
    }

    _read() {
        while (true) {
            if (this._num >= this._maxSize) {
                this.push(null);
                break;
            } else {
                let data = new Buffer ( (this._num % 10).toString(), 'utf8');
                let res = this.push(data.toString());
                this._num++;
                if (res === false) break;
            }
        }
    }
}

/**
 * Checks that data buffer contains the same data as it would have been emitted by MyReadable stream
 * @param data
 * @param length
 * @param initialNum
 * @returns {boolean}
 */
function checkMyReadable(data, length, initialNum) {
    if (data.length != length) return false;
    let num = initialNum || 0;
    for (let i=0; i<data.length; i++) {
        if (String.fromCharCode(data[i]) !== (num % 10).toString()) return false;
        num ++;
    }
    return true;
}

describe('sequentalreader', function () {

    it('Reads correct data from stream', function (done) {
        let testStream = new MyReadable({ maxSize: 1000 });
        let readNext = getStreamSequentalReader(testStream);
        readNext(1000)
            .then((res) => {
                if (checkMyReadable(res, 1000)) done();
                else done('Data read does not match stream data');
            });
    });

    it('Handles end of stream', function(done) {
        let testStream = new MyReadable({ maxSize: 1000 });
        let readNext = getStreamSequentalReader(testStream);
        readNext(1001)
            .then((res) => {
                if (checkMyReadable(res, 1000)) done();
                else done('Data read does not match stream data');
            });
    });

    it('Correctly handles multiple sequental reads', function(done) {
        let testStream = new MyReadable({ maxSize: 100 });
        let readNext = getStreamSequentalReader(testStream);
        let buf = new Buffer(0);
        readNext(10)
            .then((res) => {
                buf = Buffer.concat([buf, res]);
                return readNext(20);
            })
            .then((res) => {
                buf = Buffer.concat([buf, res]);
                return readNext(70);
            })
            .then((res) => {
                buf = Buffer.concat([buf, res]);
                if (checkMyReadable(buf, 100)) done();
                else done('data mismatch');
            })
    });

    it('Correctly handles multiple sequental reads and eof', function(done) {
        let testStream = new MyReadable({ maxSize: 99 });
        let readNext = getStreamSequentalReader(testStream);
        let buf = new Buffer(0);
        readNext(10)
            .then((res) => {
                buf = Buffer.concat([buf, res]);
                return readNext(20);
            })
            .then((res) => {
                buf = Buffer.concat([buf, res]);
                return readNext(70);
            })
            .then((res) => {
                buf = Buffer.concat([buf, res]);
                if (checkMyReadable(buf, 99)) done();
                else done('data mismatch');
            })
    });

    it('Correctly handles multiple sequental reads and eof on chunk boundary', function(done) {
        let testStream = new MyReadable({ maxSize: 30 });
        let readNext = getStreamSequentalReader(testStream);
        let buf = new Buffer(0);
        readNext(10)
            .then((res) => {
                if (res !== null) buf = Buffer.concat([buf, res]);
                return readNext(20);
            })
            .then((res) => {
                if (res !== null) buf = Buffer.concat([buf, res]);
                return readNext(70);
            })
            .then((res) => {
                if (res !== null) buf = Buffer.concat([buf, res]);
                if (checkMyReadable(buf, 30)) done();
                else done('data mismatch');
            })
    });

    it('Correctly handles empty stream', function(done) {
        let testStream = new MyReadable({ maxSize: 0 });
        let readNext = getStreamSequentalReader(testStream);
        readNext(10)
            .then((res) => {
                if (res === null) done();
                else done('error')
            })
    });
});
