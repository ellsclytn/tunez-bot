import * as SpotifyWebApi from 'spotify-web-api-node';

async function connectToSpotify () {
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  });
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    return spotifyApi;
  } catch (err) {
    console.error(err);
  }
}

export default connectToSpotify;
