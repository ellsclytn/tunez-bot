// global vars
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// imports
const chalk = require('chalk');
const sonos = require('sonos');
const express = require('express');

const app = express();
const api = require('./api');
const State = require('./state');
const bodyParser = require('body-parser');

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// SONOS SETUP
console.log('Searching for Sonos devices...');
const search = sonos.search();

search.on('DeviceAvailable', (device, model) => {
  if (device.host === process.env.SONOS_IP) {
    const state = new State();

    // Attach the device to each request
    app.use((req, res, next) => {
      req.device = device;
      req.state = state;
      next();
    });

    // Only setup the route after the device is found
    app.post('/api', api);

    // Setup transport event listener
    const Listener = require('sonos').Listener;
    const x = new Listener(device);

    x.listen((err) => {
      if (err) throw err;

      x.addService('/MediaRenderer/AVTransport/Event', (error, sid) => {
        if (error) throw error;
        console.log('Successfully subscribed, with subscription id', sid);
      });

      x.on('serviceEvent', (endpoint, sid, data) => {
        // It's a shame the data isn't in a nice track object, but this might need some more work.
        // At this moment we know something is changed, either the play state or an other song.

        console.log(`Received event from ${endpoint} (${sid})`);
        // console.log(data);

        device.currentTrack((trackErr, track) => {
          if (trackErr) throw trackErr;

          if (track.title !== state.currentTrack) {
            state.resetSkip();
            state.updateCurrentTrack(track);
          }
        });

        device.getCurrentState((stateErr, playingState) => {
          if (stateErr) throw stateErr;
          state.updatePlayingState(playingState);
        });
      });
    });

    // maybe useful info about the device
    console.log(chalk.blue(`\nFound Sonos device at ${process.env.SONOS_IP}`));
    console.log(` - Model: ${model}`);
    console.log(` - Spotify region: ${device.options.spotify.region}`);

    device.getCurrentState((stateErr, playingState) => {
      if (stateErr) throw stateErr;

      if (playingState === 'playing') {
        console.log(` - State: ${chalk.green('Playing')}`);
      } else {
        console.log(` - State: ${chalk.red('Stopped')}`);
      }

      // Start API only after finding the device
      app.listen(3000, () => {
        console.log('\n\nAPI server running on http://0.0.0.0:3000/api/');
      });
    });
  }
});

// Optionally stop searching and destroy after some time
setTimeout(() => {
  console.log('Stopped searching for Sonos devices');
  search.destroy();
}, 30000);
