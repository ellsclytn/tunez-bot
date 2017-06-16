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
        // TODO: This kind of sucks
        if (
          (Number(parts[1]) > process.env.MAX_VOLUME || Number(parts[1] < 0)) ||
          (/^\+?[1-9][\d]*$/.test(parts[1]) === false)
        ) {
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
        res.send('Bad request, try "/sonos help" for more info.');
    }
  }

  // Single part commands
  if (parts.length === 1) {
    switch (command) {
      case 'current':
      case 'playing':
      case 'nowplaying':
        console.log(req.state);
        req.device.currentTrack((err, track) => {
          console.log(track);
          res.send({
            response_type: 'ephemeral',
            attachments: [
              {
                text: `Currently playing: "${track.title}" by ${track.artist}`,
                color: '#1e1e1e',
                footer: 'For help with this, try "/sonos help"',
              },
            ],
          });
        });
        break;

      case 'upnext':
      case 'playlist':
      case 'queue':
        req.device.getQueue((err, queue) => {
          if (err) throw err;

          // Find the current position in the queue
          let currentPosition = 0;
          queue.items.forEach((track, index) => {
            const { title, artist } = req.state.currentTrack;
            if (track.title === title && track.artist === artist) {
              currentPosition = index;
            }
          });

          // Get the next 3 songs and format them nicely
          const songList = queue.items.slice(currentPosition + 1, currentPosition + 6)
            .map((t, i) => `${i + 1}. "${t.title}" by ${t.artist}`);

          res.send({
            response_type: 'ephemeral',
            attachments: [
              {
                title: 'Up next in the queue:',
                text: songList.join('\n'),
                color: '#1e1e1e',
                footer: 'For help with this, try "/sonos help"',
              },
            ],
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
          lib.jckcthbrt.kaomoji({ search: 'sad' })
            .then((result) => {
              res.send({
                reaponse_type: 'in_channel',
                text: result.emoji,
                attachments: [
                  {
                    text: `@${req.body.user_name} paused the queue`,
                    color: '#1e1e1e',
                  },
                ],
              });
            });
        });
        break;

      case 'stop':
        req.device.stop((err, stopped) => {
          if (err) throw err;
          console.log(stopped);
          lib.jckcthbrt.kaomoji({ search: 'sad' })
            .then((result) => {
              res.send({
                response_type: 'in_channel',
                text: result.emoji,
                attachments: [
                  {
                    text: `@${req.body.user_name} stopped the queue`,
                    color: '#1e1e1e',
                  },
                ],
              });
            });
        });
        break;

      case 'help':
        res.send({
          response_type: 'ephemeral',
          text: 'Available commands:',
          attachments: [
            {
              title: '/sonos play',
              color: '#1e1e1e',
            },
            {
              title: '/sonos pause',
              color: '#1e1e1e',
            },
            {
              title: '/sonos stop',
              color: '#1e1e1e',
            },
            {
              title: '/sonos upnext | queue | playlist',
              text: 'See the next 3 songs in the queue',
              color: '#1e1e1e',
            },
            {
              title: '/sonos skip | next',
              text: 'Request to skip the currently playing song',
              color: '#1e1e1e',
            },
            {
              title: '/sonos volume <number>',
              text: `Set the volume to a percentage between 0 and ${process.env.MAX_VOLUME}`,
              color: '#1e1e1e',
            },
            {
              title: '/sonos current | playing | nowplaying',
              text: 'See the currently playing song',
              color: '#1e1e1e',
            },
          ],
        });
        break;

      default:
        res.send('Bad request, try "/sonos help" for more info.');
    }
  }
};
