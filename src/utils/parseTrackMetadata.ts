
/**
 *
 * @param metaData The resulting XML string from sonos.avTransport.GetPositionInfo
 */
export default function parseTrackMetadata (metadata: string) {
  const trackInfo = JSON.parse(metadata)['DIDL-Lite'];
  return {
    title: trackInfo.item['dc:title'],
    artist: trackInfo.item['dc:creator'],
    album: trackInfo.item['upnp:album'],
    albumArtUri: trackInfo.item['upnp:albumArtURI'],
  };
}
