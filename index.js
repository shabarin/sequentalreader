'use strict'; 

module.exports = getStreamSequentalReader;

function getStreamSequentalReader(stream) {

    let eof = false;
    let wasUnshifted = false;

    return function (bytes) {

        return new Promise((resolve, reject) => {

            if (eof) {
                resolve(null);
                return;
            }

            var buf = new Buffer(0);

            var onReadable = () => {
                wasUnshifted = false;
                var tmp = stream.read();
                if (tmp !== null) {
                    var needBytes = bytes - buf.length;
                    if (tmp.length < needBytes) {
                        // we've read less bytes than we need or exactly the same amount as we need
                        buf = Buffer.concat([buf, tmp]);
                    } else {
                        // we've read more than we need
                        var firstChunk = tmp.slice(0, needBytes);
                        var secondChunk = tmp.slice(needBytes, tmp.length);
                        buf = Buffer.concat([buf, firstChunk]);
                        removeListeners();
                        if (secondChunk.length > 0) {
                            stream.unshift(secondChunk);
                            wasUnshifted = true;
                        }
                        resolve(buf);
                    }
                }

                // push out last chunk of data in case we're reading from stdin 
                stream.read(0);
            };

            var onEnd = () => {
                eof = true;
                removeListeners();
                resolve(buf && buf.length > 0 ? buf : null);
            };

            var onError = (e) => {
                return reject(e);
            };

            var removeListeners = () => {
                stream.removeListener('readable', onReadable);
                stream.removeListener('end', onEnd);
                stream.removeListener('error', onError);
            };

            stream.on('readable', onReadable);
            stream.on('end', onEnd);
            stream.on('error', onError);

            // emit readable event in case that internal buffer already contains data before the function was called
            /* if (wasUnshifted) */ stream.emit('readable');
        });
    };
}

