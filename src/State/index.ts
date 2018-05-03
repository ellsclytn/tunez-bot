import { Sonos } from '@homeaudio/sonos';
import * as chalk from 'chalk';

interface ITrack {
  title: string;
  artist: string;
}

class State {
  public device: Sonos;
  public channelId: string;

  constructor () {
    this.channelId = null;
    this.device = null;
  }

  public updateChannelID (channelId: string) {
    this.channelId = channelId;
  }

  public updateDevice (device: any) {
    console.log(chalk.magenta('[Tunez]') + ' Device updated!');
    this.device = device;
  }
}

export default State;
