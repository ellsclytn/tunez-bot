import { Search, Sonos } from '@homeaudio/sonos';
import {
  CLIENT_EVENTS,
  MemoryDataStore,
  RTM_EVENTS,
  RtmClient,
} from '@slack/client';
import axios from 'axios';
import * as chalk from 'chalk';
import { config } from 'dotenv';
import * as parser from 'xml2json';

import { slackPrivateHandler, slackPublicHandler } from './handler';
import { IChannel } from './interfaces';
import State from './State';
import connectToSpotify from './utils/connectToSpotify';

// dotenv
config();

// setup app
const state = new State();
const token = process.env.BOT_TOKEN || '';
const client = new RtmClient(token, {
  logLevel: 'error',
  dataStore: new MemoryDataStore({}),
});

client.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (data) => {
  const botName = data.self.name;

  const musicChannel = data.channels.find((c: IChannel) => {
    return c.is_member && c.name === process.env.MUSIC_CHANNEL;
  });

  if (musicChannel === undefined) {
    console.log(`${botName} is connected to slack, but not connected to the defined music channel!`);
  }
});

client.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
  const user = client.dataStore.getUserById(client.activeUserId);
  const team = client.dataStore.getTeamById(client.activeTeamId);
  const channel = client.dataStore.getChannelByName(process.env.MUSIC_CHANNEL);
  state.updateChannelID(channel.id);

  console.log(chalk.magenta('[Sonny]') + ` Connected to ${team.name} as ${user.name} in channel #${channel.name}`);
});

// Ensure that each listened message is in the correct format
client.on(RTM_EVENTS.MESSAGE, async (data) => {

  // Private message handler
  if (/^D/.exec(data.channel)) {
    console.log(`${chalk.magenta('[Sonny]')} Command received from ${chalk.blue('direct message')}`);
    const spotifyApi = await connectToSpotify();
    await slackPrivateHandler(data, client, state, spotifyApi);
    return;
  }

  // Public handler
  if (!!data.text && data.text.indexOf('!sonos') !== -1 && data.channel === state.channelId) {
    console.log(`${chalk.magenta('[Sonny]')} Command received from ${chalk.yellow('public')} channel`);
    await slackPublicHandler(data, client, state);
    return;
  }
});

client.start();

console.log(chalk.magenta('[Sonny]') + ' Searching for devices...');
const searcher = new Search({});
searcher.on('DeviceAvailable', async (device, model) => {
  const sonos = new Sonos(device.host);
  const deviceInfo = await sonos.getDeviceDescription();

  if (deviceInfo.root.device.roomName === process.env.SONOS_ROOM) {
    state.updateDevice(device);
  }
});
