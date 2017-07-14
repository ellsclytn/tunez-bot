import { Sonos } from '@homeaudio/sonos';
import * as chalk from 'chalk';

interface ITrack {
  title: string;
  artist: string;
}

class State {
  public skipCount: number;
  public skipRequesters: string[];
  public currentTrack: ITrack;
  public playingState: string;
  public device: Sonos;
  public channelId: string;

  constructor () {
    this.skipCount = 0;
    this.skipRequesters = [];
    this.currentTrack = null;
    this.playingState = null;
    this.device = null;
  }

  public updateChannelID (channelId: string) {
    this.channelId = channelId;
  }

  public updateSkipCount (count: number,  userId: string) {
    this.skipCount = count;
    this.skipRequesters = [...this.skipRequesters, userId];
  }

  public updateCurrentTrack (track: ITrack) {
    this.currentTrack = {
      title: track.title,
      artist: track.artist,
    };
  }

  public updateDevice (device: any) {
    console.log(chalk.magenta('[Sonny]') + ' Device updated!');
    this.device = device;
  }

  public resetSkip () {
    this.skipCount = 0;
    this.skipRequesters = [];
  }
}

export default State;
