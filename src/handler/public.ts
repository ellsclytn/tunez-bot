import { RtmClient } from '@slack/client';
import axios from 'axios';
import * as parser from 'xml2json';
import parseTrackMetadata from '../utils/parseTrackMetadata';

import State from '../state';

async function getNowPlaying (state) {
  const trackPosition = await state.device.avTransport.GetPositionInfo();
  const metaData = parser.toJson(trackPosition.TrackMetaData);
  const track = parseTrackMetadata(metaData);
  return track;
}

export default async function slackPublicHandler (data: any, client: RtmClient, state: State) {
  // Guard clause to prevent massive sentences
  if (data.text.split(' ').length > 3) {
    try {
      const sadEmoji = await axios('https://jckcthbrt.stdlib.com/kaomoji/?search=crying');
      client.sendMessage(`Ahh! Too many words! ${sadEmoji.data.emoji}`, state.channelId);
    } catch (err) {
      console.error(err);
    }
    return;
  }

  // Get currently playing
  if (data.text.includes('playing')) {
    try {
      const track = await getNowPlaying(state);
      client.sendMessage(`Currently playing: "${track.title}" by ${track.artist}`, state.channelId);
    } catch (err) {
      console.error(err);
    }
    return;
  }

  // Pause the queue
  if (data.text.includes('pause')) {
    try {
      const paused = await state.device.pause();
      const sadEmoji = await axios('https://jckcthbrt.stdlib.com/kaomoji/?search=sad');
      client.sendMessage(`Pausing the queue ${sadEmoji.data.emoji}`, state.channelId);
    } catch (err) {
      console.error(err);
    }
    return;
  }

  // Play the queue
  if (data.text.includes('play')) {
    try {
      const played = await state.device.play();
      const dancingEmoji = await axios('https://jckcthbrt.stdlib.com/kaomoji/?search=dancing');
      client.sendMessage(`Starting tunez ${dancingEmoji.data.emoji}`, state.channelId);
    } catch (err) {
      console.error(err);
    }
    return;
  }

  // Volume controls
  if (data.text.includes('volume')) {
    const parts = data.text.split(' ');
    if (parts.length === 3) {

      // Limit volume to 50%
      if (parseInt(parts[2], 0) > Number(process.env.MAX_VOLUME)) {
        try {
          const upsetEmoji = await axios('https://jckcthbrt.stdlib.com/kaomoji/?search=upset');
          client.sendMessage(`${parts[2]}% is too loud! ${upsetEmoji.data.emoji}`, state.channelId);
        } catch (err) {
          console.error(err);
        }
        return;
      }

      // Set volume if under limit
      if (parseInt(parts[2], 0)) {
        try {
          const setVolume = await state.device.setVolume(parts[2]);
          client.sendMessage(`Setting volume to ${parts[2]}%`, state.channelId);
        } catch (err) {
          console.error(err);
        }
        return;
      }
    }

    // Get volume
    if (parts.length === 2) {
      try {
        const volume = await state.device.getVolume();
        client.sendMessage(`Volume is currently ${volume}%`, state.channelId);
      } catch (err) {
        console.error(err);
      }
      return;
    }
  }

  if (data.text.includes('help')) {
    const happyEmoji = await axios('https://jckcthbrt.stdlib.com/kaomoji/?search=happy');
    client.sendMessage(`Send me a private message for help ${happyEmoji.data.emoji}`, state.channelId);
    return;
  }

  if (data.text.includes('skip') || data.text.includes('next')) {
    const track = await getNowPlaying(state);
    const tableEmoji = await axios('https://jckcthbrt.stdlib.com/kaomoji/?search=table');
    client.sendMessage(`Skipping "${track.title}" by ${track.artist} ${tableEmoji.data.emoji}`, state.channelId);
    state.device.next();
    return;
  }

  if (data.text.includes('clear')) {
    const sadEmoji = await axios('https://jckcthbrt.stdlib.com/kaomoji/?search=sad');
    client.sendMessage(`Clearing the queue ${sadEmoji.data.emoji}`, state.channelId);
    state.device.flush();
    return;
  }
}
