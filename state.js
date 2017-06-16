module.exports = class State {
  constructor() {
    this.skipCount = 0;
    this.skipRequesters = [];
    this.currentTrack = null;
    this.playingState = null;
  }

  updateSkipCount(count, userId) {
    this.skipCount = count;
    this.skipRequesters = [...this.skipRequesters, userId];
  }

  updateCurrentTrack(track) {
    this.currentTrack = {
      title: track.title,
      artist: track.artist,
    };
  }

  updatePlayingState(state) {
    this.playingState = state;
  }

  resetSkip() {
    this.skipCount = 0;
    this.skipRequesters = [];
  }
};
