import { RtmClient } from '@slack/client';
import axios from 'axios';
import * as parser from 'xml2json';
import getNowPlaying from '../utils/getNowPlaying';
import parseTrackMetadata from '../utils/parseTrackMetadata';

import State from '../State';

export default async function slackPublicHandler (data: any, client: RtmClient, state: State, spotifyApi: any) {
  if (data.user === 'U37D2KZSP') {
    try {
      client.sendMessage(`Nope.`, state.channelId);
    } catch (err) {
      console.error(err);
    }
    return;
  }
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

  if (data.text.includes('https://open.spotify.com/')) {
    const parts = data.text.split(' ');
    const fullLink = parts[1].substr(1, parts[1].length - 2);
    const linkParts = fullLink.split('/').filter((el) => !!el);
    const id = linkParts[linkParts.length - 1];

    if (fullLink.includes('https://open.spotify.com/track/')) {
      client.sendTyping(state.channelId);
      const { body } = await spotifyApi.getTrack(id);

      const track = {
        title: body.name,
        artist: body.album.artists.map((a) => a.name).join(', '),
      };

      await state.device.queueSpotifyTrack(id);
      client.sendMessage(`<@${data.user}> added "${track.title}" by ${track.artist} to the queue!`, state.channelId);
    } else if (fullLink.includes('https://open.spotify.com/album/')) {
      client.sendTyping(state.channelId);

      const { body } = await spotifyApi.getAlbumTracks(id);
      const albumFull = await spotifyApi.getAlbum(id);
      const album = {
        count: body.items.length,
        name: albumFull.body.name,
        artist: albumFull.body.artists.map((a) => a.name).join(', '),
      };
      const trackPromises = [];

      body.items.forEach((track) => {
        trackPromises.push(state.device.queueSpotifyTrack(track.id));
      });

      await Promise.all(trackPromises);

      client.sendMessage(`<@${data.user}> added the album "${album.name}" by ${album.artist} to the queue!\n(${album.count} tracks)`, state.channelId);
    } else if (fullLink.includes('https://open.spotify.com/') && fullLink.includes('/playlist/')) {
      client.sendTyping(state.channelId);
      console.log(linkParts);

      const { body } = await spotifyApi.getPlaylistTracks(linkParts[3], id);
      const tracks = body.items;
      const trimmedTracks = tracks.slice(0, 20);
      const playlistFull = await spotifyApi.getPlaylist(linkParts[3], id);

      const playlist = {
        count: trimmedTracks.length,
        name: playlistFull.body.name,
      };

      const trackPromises = [];

      trimmedTracks.forEach(({ track }) => {
        trackPromises.push(state.device.queueSpotifyTrack(track.id));
      });

      await Promise.all(trackPromises);

      client.sendMessage(`<@${data.user}> added the playlist "${playlist.name}" to the queue!\n(${playlist.count} tracks)`, state.channelId);
    } else {
      client.sendMessage(`I don't recognise this`, data.channel);
    }

    return;
  }

  // !sonos sudo --force play <link>
  if (data.text.includes('sudo') && data.text.includes('https://open.spotify.com/track/')) {
    const parts = data.text.split(' ');
    const fullLink = parts[2].substr(1, parts[2].length - 2);
    const linkParts = fullLink.split('/').filter((el) => !!el);
    const id = linkParts[linkParts.length - 1];

    const { body } = await spotifyApi.getTrack(id);

    const track = {
      title: body.name,
      artist: body.album.artists.map((a) => a.name).join(', '),
    };

    await state.device.flush();
    await state.device.queueSpotifyTrack(id);
    await state.device.play();

    client.sendMessage(`<@${data.user}> cleared the queue to play "${track.title}" by ${track.artist}!`, state.channelId);
  }

  if (data.text.includes('hey')) {
    const greetings = ['Hey', 'Yo', 'What up', 'Sup', 'Howdy', 'Bro'];
    const chosen = Math.floor(Math.random() * (greetings.length + 1));
    const greeting = greetings[chosen];

    try {
      const waving = await axios('https://jckcthbrt.stdlib.com/kaomoji/?search=waving');
      client.sendMessage(`${greeting} ${waving.data.emoji}`, state.channelId);
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

  // Stop the queue
  if (data.text.includes('stop')) {
    try {
      const paused = await state.device.stop();
      const sadEmoji = await axios('https://jckcthbrt.stdlib.com/kaomoji/?search=sad');
      client.sendMessage(`Stopping the queue ${sadEmoji.data.emoji}`, state.channelId);
    } catch (err) {
      console.error(err);
    }
    return;
  }

  // Volume controls
  if (data.text.includes('volume')) {
    const parts = data.text.split(' ');
    if (parts.length === 3) {
      if (!(/^\d+$/.test(parts[2]))) {
        return;
      }

      if (Number(parts[2]) < 0) {
        return;
      }

      if (parts[2].length > 3) {
        return;
      }

      const volume = parseInt(parts[2], 0);

      // Limit volume to 50%
      if (volume > Number(process.env.MAX_VOLUME)) {
        try {
          const upsetEmoji = await axios('https://jckcthbrt.stdlib.com/kaomoji/?search=upset');
          client.sendMessage(`${parts[2]}% is too loud! ${upsetEmoji.data.emoji}`, state.channelId);
        } catch (err) {
          console.error(err);
        }
        return;
      }

      try {
        const setVolume = await state.device.setVolume(parts[2]);
        client.sendMessage(`Setting volume to ${parts[2]}%`, state.channelId);
      } catch (err) {
        console.error(err);
      }
      return;
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
    await state.device.flush();
    return;
  }
}
