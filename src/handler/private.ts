import { RtmClient } from '@slack/client';
import axios from 'axios';

import State from '../State';

export default async function slackPrivateHandler (data: any, client: RtmClient, state: State, spotifyApi: any) {
  const parts = data.text.split(' ');

  const command = parts[0];

  if (command === 'search') {
    client.sendTyping(data.channel);
    const searchQuery: string[] = data.text.split(' ');
    const searchString = searchQuery.slice(1, searchQuery.length).join(' ');

    try {
      const apiData = await spotifyApi.searchTracks(searchString);
      const tracks = apiData.body.tracks.items.slice(0, 10).map((item) => {
        return {
          name: item.name,
          artists: item.artists.map((a) => a.name).join(', '),
          album: item.album.name,
          id: item.id,
        };
      });

      let trackList = 'I found:\n';
      tracks.forEach((track, idx) => {
        trackList += `${idx + 1}: ${track.name}" - ${track.artists} from ${track.album}\n`;
        trackList += `        Type \`add ${track.id}\`\n\n`;
      });

      client.sendMessage(trackList, data.channel);
    } catch (err) {
      console.error(err);
    }

    return;
  }

  if (command === 'add') {
    try {
      const queued = await state.device.queueSpotifyTrack(parts[1]);
      const addedTracks = await spotifyApi.getTracks([parts[1]]);
      const trackInfo = addedTracks.body.tracks[0];
      const track = {
        title: trackInfo.name,
        artist: trackInfo.artists.map((a) => a.name).join(', '),
      };

      client.sendMessage(`<@${data.user}> added "${track.title}" by ${track.artist} to the queue!`, state.channelId);
    } catch (err) {
      console.error(err);
      client.sendMessage('I can\'t add this to the Sonos speaker', data.channel);
    }

    return;
  }

  // Help command
  let helpMessage = 'I don\'t understand that yet, try something like...';
  helpMessage += '\n';
  helpMessage += '```search toto africa```';
  helpMessage += '\n';
  helpMessage += 'and then...';
  helpMessage += '\n';
  helpMessage += '```add 6VJhf9l4ALDquID0bN51QQ```';
  helpMessage += '\n';
  helpMessage += '\n';
  helpMessage += `Altnernatively, try posting in <#${state.channelId}>`;

  client.sendMessage(helpMessage, data.channel);
}
