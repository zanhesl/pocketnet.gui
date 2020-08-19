TorrentHandler = function (app) {
  var self = this;

  self.trackers = ['wss://pocketnet.app:3001/announce'];

  self.store = {};

  self.uploadQuery = {};

  self.pending = {};

  //cash со статусами

  self.seed = function (file, clbk) {
    var keyPair = app.user.keys();
    console.log('KEEEEEEEEEYS', keyPair.publicKey, keyPair.publicKey.toString('hex'));
    app.client.seed(
      Buffer.from(file, 'base64'),
      {
        private: false,
        announce: self.trackers,
        info: {
          name: makeid(true),
          encryptedSignature: keyPair
            .sign(Buffer.from(bitcoin.crypto.hash256(file), 'utf8'))
            .toString('hex'),
          address: app.platform.sdk.address.pnet().address,
          publicKey: keyPair.publicKey.toString('hex'), //сгенерировать адрес из паблик кей satolist/pnetsimple
        },
        maxWebConns: 10000,
      },
      (torrent) => {
        console.log('started', torrent.infoHash);
        self.pending[torrent.infoHash] = false;
        var rationInt = setInterval(function () {
          console.log(torrent.ratio);

          if (torrent.ratio >= 1) {
            self.pending[torrent.infoHash] = true;

            if (
              clbk &&
              _.every(_.values(self.pending), function (item) {
                return item;
              })
            ) {
              clearTimeout(rationInt);
              clbk(torrent.infoHash);
            }
          }
        }, 500);
        torrent.on('error', function (err) {
          console.log(err);
        });
      },
    );
  };

  self.add = function (link, clbk) {
    self.uploadQuery[link] = true;

    var newAdd = app.client.add(
      link,
      {
        announce: self.trackers,
        private: false,
        maxWebConns: 10000,
      },
      function (torrent) {
        torrent.on('warning', function (err) {
          console.log(err);
        });

        torrent.on('error', function (err) {
          console.log(err);
        });

        torrent.on('done', function () {
          console.log('done, sign', torrent.info.publicKey.toString(), torrent.info.address.toString());

          torrent.files[0].getBuffer(function callback(err, buffer) {
            var keyPair = bitcoin.ECPair.fromPublicKey(
              Buffer.from(torrent.info.publicKey.toString(), 'hex'),
            );
            console.log('keyPair', keyPair);

            if (
              keyPair.verify(
                bitcoin.crypto.hash256(buffer.toString('base64')),
                Buffer.from(torrent.info.encryptedSignature.toString(), 'hex'), //это то что в метадату 7592
              ) &&
              app.platform.sdk.address.pnetsimple(
                keyPair.publicKey, 'p2pkh'
              ).address === torrent.info.address.toString()
            ) {
              console.log('Verified!');

              if (clbk)
                clbk(
                  'data:image/png;base64,' +
                    buffer.toString('base64').toString(),
                );
            } else {
              console.log('Failed!');
              if (clbk) clbk('data:image/png;base64,');
            }
          });
        });
      },
    );

    newAdd.on('infoHash', function (hash) {
      console.log('Hash ', hash);
    });
    newAdd.on('ready', function (rdy) {
      console.log('Ready ', rdy);
    });
    newAdd.on('metadata', function (meta) {
      console.log('Got', meta);
    });
    newAdd.on('error', function (err) {
      console.log('Error', err);
    });
    newAdd.on('warning', function (warn) {
      console.log('Warning', warn);
    });
    newAdd.on('wire', function (wire) {
      console.log('Wired new!');
    });
  };

  return self;
};

if (typeof module != 'undefined') {
  module.exports = TorrentHandler;
}
