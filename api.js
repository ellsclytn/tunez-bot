const chalk = require('chalk');
const lib = require('lib');

module.exports = (req, res) => {
  console.log(req.body);

  const parts = req.body.text.split(' ');

  const command = parts[0];
  console.log(chalk.yellow(`Command received: ${command}`));

  console.log(parts);

  // Multi part commands
  if (parts.length > 1) {
    switch (parts[0]) {
      case 'volume':
        if (Number(parts[1]) > process.env.MAX_VOLUME || Number(parts[1] < 0)) {
          res.send(`Use a number between 0 and ${process.env.MAX_VOLUME} to set volume`);
          return;
        }

        req.device.setVolume(Number(parts[1]), (err, volume) => {
          if (err) throw err;
          console.log(volume);
          res.send({
            response_type: 'in_channel',
            attachments: [
              {
                text: `@${req.body.user_name} set the volume to ${parts[1]}%`,
                color: '#1e1e1e',
              },
            ],
          });
        });
        break;

      case 'add':
        // search spotify api
        res.send('Not yet implemented :(');
        break;

      default:
        res.send('Bad request');
    }
  }

  // Single part commands
  if (parts.length === 1) {
    switch (command) {
      case 'current':
      case 'playing':
        console.log(req.state);
        req.device.currentTrack((err, track) => {
          console.log(track);
          res.send({
            response_type: 'ephemeral',
            text: `Currently playing: "${track.title}" by ${track.artist}`,
            attachments: [
              {

              }
            ],
          });
        });
        break;

      case 'upnext':
        req.device.getQueue((err, queue) => {
          if (err) throw err;

          queue.items.forEach((track, index) => {
            if (track.title === req.state.currentTrack) {
              const upNext = queue.items.slice(index + 1, index + 4).map((nextTrack, nextIndex) => {
                return `${nextIndex + 1}. ${nextTrack.title} - ${nextTrack.artist}`;
              });
              res.send({
                response_type: 'emphemeral',
                text: upNext.join('\n'),
              });
            }
          });
        });
        break;

      case 'skip':
      case 'next':
        const { SKIPS_REQUIRED } = process.env;

        if (req.state.skipRequesters.includes(req.body.user_id)) {
          res.send('You\'ve already requested to skip this song!');
        } else {
          req.state.updateSkipCount(req.state.skipCount + 1, req.body.user_id);
          console.log(req.state);

          if (req.state.skipCount === Number(SKIPS_REQUIRED)) {
            lib.jckcthbrt.kaomoji({ search: 'table flip' })
              .then((result) => {
                req.device.next((err, movedToNext) => {
                  if (err) throw err;
                  console.log(movedToNext);
                  req.state.resetSkip();
                  res.send({
                    response_type: 'in_channel',
                    text: result.emoji,
                    attachments: [
                      {
                        text: `${SKIPS_REQUIRED} people have requested to skip this song, skipping now...`,
                        color: '#1e1e1e',
                      },
                    ],
                  });
                });
              });
          } else {
            lib.jckcthbrt.kaomoji({ search: 'table flip' })
              .then((result) => {
                const { title, artist } = req.state.currentTrack;
                res.send({
                  response_type: 'in_channel',
                  text: result.emoji,
                  attachments: [
                    {
                      text: `@${req.body.user_name} wants to skip "${title}" by ${artist}`,
                      footer: `${SKIPS_REQUIRED - req.state.skipCount} more needed to skip`,
                      color: '#1e1e1e',
                    },
                  ],
                });
              });
          }
        }

        break;

      case 'play':
        req.device.play((err, played) => {
          if (err) throw err;
          console.log(played);
          lib.jckcthbrt.kaomoji({ search: 'dancing' })
            .then((result) => {
              res.send({
                response_type: 'in_channel',
                text: result.emoji,
                attachments: [
                  {
                    text: `@${req.body.user_name} started the queue`,
                    color: '#1e1e1e',
                  },
                ],
              });
            });
        });
        break;

      case 'pause':
        req.device.pause((err, paused) => {
          if (err) throw err;
          console.log(paused);
          res.send('Pausing queue...');
        });
        break;

      case 'help':
        res.send('Available commands:\nplay, pause, skip, upnext, current, add');
        break;

      default:
        res.send('Bad request');
    }
  }
};
