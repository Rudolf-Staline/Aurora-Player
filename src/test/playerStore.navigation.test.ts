import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayerStore, type Track } from '../store/usePlayerStore';

const makeTrack = (id: string): Track => ({
  id,
  title: `Track ${id}`,
  artist: 'Test Artist',
  album: 'Test Album',
  url: `https://example.com/${id}.mp3`,
});

const resetPlayerStore = () => {
  usePlayerStore.setState({
    currentTrack: null,
    isPlaying: false,
    volume: 0.8,
    progress: 0,
    currentTime: 0,
    duration: 0,
    queue: [],
    localTracks: [],
    repeatMode: 'none',
    isShuffle: false,
  });
};

describe('PlayerStore navigation hardening', () => {
  beforeEach(() => {
    resetPlayerStore();
    vi.restoreAllMocks();
  });

  it('clamps playback scalar values to safe ranges', () => {
    usePlayerStore.getState().setVolume(2);
    usePlayerStore.getState().setProgress(-0.25);
    usePlayerStore.getState().setCurrentTime(Number.NaN);
    usePlayerStore.getState().setDuration(-99);

    const state = usePlayerStore.getState();
    expect(state.volume).toBe(1);
    expect(state.progress).toBe(0);
    expect(state.currentTime).toBe(0);
    expect(state.duration).toBe(0);
  });

  it('plays the first local track when next is called from an unknown current track', () => {
    const tracks = [makeTrack('a'), makeTrack('b')];

    usePlayerStore.setState({
      currentTrack: makeTrack('external'),
      isPlaying: true,
      localTracks: tracks,
    });

    usePlayerStore.getState().playNext();

    expect(usePlayerStore.getState().currentTrack).toEqual(tracks[0]);
  });

  it('plays the first local track when previous is called from an unknown current track', () => {
    const tracks = [makeTrack('a'), makeTrack('b')];

    usePlayerStore.setState({
      currentTrack: makeTrack('external'),
      isPlaying: true,
      localTracks: tracks,
    });

    usePlayerStore.getState().playPrevious();

    expect(usePlayerStore.getState().currentTrack).toEqual(tracks[0]);
  });

  it('pauses when next is requested without a current track or local queue', () => {
    usePlayerStore.setState({ isPlaying: true });

    usePlayerStore.getState().playNext();

    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it('does not replay the same track in shuffle mode when alternatives exist', () => {
    const tracks = [makeTrack('a'), makeTrack('b'), makeTrack('c')];
    vi.spyOn(Math, 'random').mockReturnValue(0);

    usePlayerStore.setState({
      currentTrack: tracks[0],
      localTracks: tracks,
      isShuffle: true,
    });

    usePlayerStore.getState().playNext();

    expect(usePlayerStore.getState().currentTrack?.id).toBe('b');
  });
});
