TorrentHandler = function(app) {
    var self = this;

    self.trackers = [
        'wss://pocketnet.app:3001/announce'
    ]

    self.seed = function(file, clbk) {
        app.client.seed(
            Buffer.from(file, 'base64'), {
                private: false,
                announce: self.trackers,
                info: {
                    encryptedSignature: app.user.keys().sign(Buffer.from(bitcoin.crypto.hash256(file), 'utf8')).toString('hex'),
                    // publickKey: //....
                }
            },
            torrent => {
                console.log('started', torrent.magnetURI, torrent.infoHash);
                console.log('true', app.user.keys().sign(Buffer.from(bitcoin.crypto.hash256(file), 'utf8')).toString('hex'));
                console.log('string', torrent.info.encryptedSignature.toString());
                console.log('string', torrent.info.encryptedSignature.toString('hex'));
                


                var rationInt = setInterval(function () {
                    console.log(torrent.ratio);

                    if (torrent.ratio >= 1) {

                        if (clbk) clbk(torrent.infoHash);
                        clearTimeout(rationInt);
                    }
                }, 500);
                torrent.on('error', function (err) {
                    console.log(err);
                });
            },
        );
    }

    self.add = function(link, clbk) {
        var newAdd = app.client.add(link, {
            announce: self.trackers,
            private: false,
        }, function (torrent) {
            console.log('sign', torrent.info.encryptedSignature);

            torrent.on('warning', function (err) {
                console.log(err);
            });

            torrent.on('error', function (err) {
                console.log(err);
            });

            torrent.on('done', function () {
                console.log('torrent download finished', torrent.files);
                torrent.files[0].getBuffer(function callback(err, buffer) {
                    console.log(buffer.toString('base64'));

                    console.log('signing!!!!', app.user.keys().verify(
                        bitcoin.crypto.hash256(buffer.toString('base64')),
                        Buffer.from(torrent.info.encryptedSignature.toString(), 'hex') //это то что в метадату 7592
                    ));

                    if (clbk) clbk('data:image/png;base64, ' +
                        buffer.toString('base64').toString());
                })
                // var stream = torrent.files[0].createReadStream();
                // stream.on('readable', () => {
                //     var chunk;
                //     while (null !== (chunk = stream.read())) {
                //         console.log('chunk',chunk);
                //     }
                // });
                // var reader = new FileReader();
                // torrent.files[0].getBlob(function (blob) {
                //     reader.readAsArrayBuffer(blob);
                // });
                // reader.onload = function () {
                //     console.log('fiiiile', reader.result);
                // };
                // console.log('sign', torrent.info.encryptedSignature.toString());
                
                // keypair from public key...
                

                
            });


        });

        newAdd.on('infoHash', function(hash) {console.log('Hash ', hash)});
        newAdd.on('ready', function(rdy) {console.log('Ready ', rdy)});
        newAdd.on("metadata", function(meta) {console.log("Got", meta)});
        newAdd.on('error', function(err) {console.log("Error", err)});
        newAdd.on('warning', function(warn) {console.log("Warning", warn)});
        newAdd.on('wire', function(wire) {console.log("Wired new!")});
    }

    return self;
}

if (typeof module != "undefined") {
    module.exports = TorrentHandler;
}