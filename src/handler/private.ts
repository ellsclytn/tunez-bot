import { RtmClient } from '@slack/client';
import axios from 'axios';
import getNowPlaying from '../utils/getNowPlaying';

import State from '../State';

export default async function slackPrivateHandler (data: any, client: RtmClient, state: State, spotifyApi: any) {
  const parts: string[] = data.text.split(' ');

  const command = parts[0];

  if (command.toLowerCase() === 'playing') {
    try {
      const track = await getNowPlaying(state);
      client.sendMessage(`Currently playing: "${track.title}" by ${track.artist}`, data.channel);
    } catch (err) {
      console.error(err);
      client.sendMessage('Oops, I broke. Help!', data.channel);
    }
    return;
  }
}
