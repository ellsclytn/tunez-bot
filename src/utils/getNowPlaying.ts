import * as parser from 'xml2json';
import parseTrackMetadata from './parseTrackMetadata';

export default async function getNowPlaying (state) {
  const trackPosition = await state.device.avTransport.GetPositionInfo();
  const metaData = parser.toJson(trackPosition.TrackMetaData);
  const track = parseTrackMetadata(metaData);
  return track;
}
