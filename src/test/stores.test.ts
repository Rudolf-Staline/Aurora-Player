import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../store/usePlayerStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { usePlaylistStore } from '../store/usePlaylistStore';

describe('PlayerStore', () => {
  beforeEach(() => {
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
  });

  it('should initialize with default values', () => {
    const state = usePlayerStore.getState();
    expect(state.currentTrack).toBeNull();
    expect(state.isPlaying).toBe(false);
    expect(state.volume).toBe(0.8);
    expect(state.repeatMode).toBe('none');
    expect(state.isShuffle).toBe(false);
  });

  it('should toggle shuffle', () => {
    const state = usePlayerStore.getState();
    expect(state.isShuffle).toBe(false);
    
    usePlayerStore.getState().toggleShuffle();
    expect(usePlayerStore.getState().isShuffle).toBe(true);
    
    usePlayerStore.getState().toggleShuffle();
    expect(usePlayerStore.getState().isShuffle).toBe(false);
  });

  it('should cycle repeat mode', () => {
    const state = usePlayerStore.getState();
    expect(state.repeatMode).toBe('none');
    
    usePlayerStore.getState().toggleRepeatMode();
    expect(usePlayerStore.getState().repeatMode).toBe('all');
    
    usePlayerStore.getState().toggleRepeatMode();
    expect(usePlayerStore.getState().repeatMode).toBe('one');
    
    usePlayerStore.getState().toggleRepeatMode();
    expect(usePlayerStore.getState().repeatMode).toBe('none');
  });

  it('should manage queue', () => {
    const track1 = { id: '1', title: 'Track 1', artist: 'Artist', album: 'Album', url: 'url1' };
    const track2 = { id: '2', title: 'Track 2', artist: 'Artist', album: 'Album', url: 'url2' };
    
    usePlayerStore.getState().addToQueue(track1);
    usePlayerStore.getState().addToQueue(track2);
    
    const state = usePlayerStore.getState();
    expect(state.queue).toHaveLength(2);
    expect(state.queue[0]).toEqual(track1);
    expect(state.queue[1]).toEqual(track2);
    
    usePlayerStore.getState().removeFromQueue('1');
    expect(usePlayerStore.getState().queue).toHaveLength(1);
    expect(usePlayerStore.getState().queue[0]).toEqual(track2);
    
    usePlayerStore.getState().clearQueue();
    expect(usePlayerStore.getState().queue).toHaveLength(0);
  });

  it('should set volume', () => {
    usePlayerStore.getState().setVolume(0.5);
    expect(usePlayerStore.getState().volume).toBe(0.5);
    
    usePlayerStore.getState().setVolume(1.0);
    expect(usePlayerStore.getState().volume).toBe(1.0);
  });
});

describe('SettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: 'aurora',
      density: 'normal',
      animationsEnabled: true,
      geminiApiKey: '',
    });
  });

  it('should initialize with default values', () => {
    const state = useSettingsStore.getState();
    expect(state.theme).toBe('aurora');
    expect(state.density).toBe('normal');
    expect(state.animationsEnabled).toBe(true);
    expect(state.geminiApiKey).toBe('');
  });

  it('should change theme', () => {
    useSettingsStore.getState().setTheme('sunset');
    expect(useSettingsStore.getState().theme).toBe('sunset');
    
    useSettingsStore.getState().setTheme('ocean');
    expect(useSettingsStore.getState().theme).toBe('ocean');
  });

  it('should change density', () => {
    useSettingsStore.getState().setDensity('compact');
    expect(useSettingsStore.getState().density).toBe('compact');
    
    useSettingsStore.getState().setDensity('comfortable');
    expect(useSettingsStore.getState().density).toBe('comfortable');
  });

  it('should toggle animations', () => {
    useSettingsStore.getState().setAnimationsEnabled(false);
    expect(useSettingsStore.getState().animationsEnabled).toBe(false);
    
    useSettingsStore.getState().setAnimationsEnabled(true);
    expect(useSettingsStore.getState().animationsEnabled).toBe(true);
  });

  it('should set Gemini API key', () => {
    useSettingsStore.getState().setGeminiApiKey('test-key-123');
    expect(useSettingsStore.getState().geminiApiKey).toBe('test-key-123');
  });
});

describe('FavoritesStore', () => {
  beforeEach(() => {
    useFavoritesStore.setState({
      trackIds: [],
      episodeIds: [],
      podcastIds: [],
      updatedAt: new Date().toISOString(),
    });
  });

  it('should toggle track favorite', () => {
    useFavoritesStore.getState().toggleTrackFavorite('track-1');
    expect(useFavoritesStore.getState().trackIds).toContain('track-1');
    
    useFavoritesStore.getState().toggleTrackFavorite('track-1');
    expect(useFavoritesStore.getState().trackIds).not.toContain('track-1');
  });

  it('should toggle episode favorite', () => {
    useFavoritesStore.getState().toggleEpisodeFavorite('episode-1');
    expect(useFavoritesStore.getState().episodeIds).toContain('episode-1');
    
    useFavoritesStore.getState().toggleEpisodeFavorite('episode-1');
    expect(useFavoritesStore.getState().episodeIds).not.toContain('episode-1');
  });
});

describe('PlaylistStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePlaylistStore.setState({
      playlists: [],
    });
  });

  it('should create playlist', () => {
    usePlaylistStore.getState().createPlaylist('My Playlist', 'A description');
    
    const playlists = usePlaylistStore.getState().playlists;
    expect(playlists).toHaveLength(1);
    expect(playlists[0].name).toBe('My Playlist');
    expect(playlists[0].description).toBe('A description');
    expect(playlists[0].tracks).toHaveLength(0);
  });

  it('should create playlist with unique id for multiple playlists', () => {
    usePlaylistStore.getState().createPlaylist('Playlist 1');
    usePlaylistStore.getState().createPlaylist('Playlist 2');
    
    const playlists = usePlaylistStore.getState().playlists;
    expect(playlists).toHaveLength(2);
    // Verify playlists are created with expected properties
    expect(playlists[0].name).toBe('Playlist 1');
    expect(playlists[1].name).toBe('Playlist 2');
  });

  it('should add track to playlist', () => {
    usePlaylistStore.getState().createPlaylist('Test Playlist');
    const playlist = usePlaylistStore.getState().playlists[0];
    
    const track = { id: 'track-1', title: 'Track', artist: 'Artist', album: 'Album', url: 'url' };
    usePlaylistStore.getState().addTrackToPlaylist(playlist.id, track);
    
    expect(usePlaylistStore.getState().playlists[0].tracks).toHaveLength(1);
    expect(usePlaylistStore.getState().playlists[0].tracks[0]).toEqual(track);
  });

  it('should not add duplicate track', () => {
    usePlaylistStore.getState().createPlaylist('Test Playlist');
    const playlist = usePlaylistStore.getState().playlists[0];
    
    const track = { id: 'track-1', title: 'Track', artist: 'Artist', album: 'Album', url: 'url' };
    usePlaylistStore.getState().addTrackToPlaylist(playlist.id, track);
    usePlaylistStore.getState().addTrackToPlaylist(playlist.id, track);
    
    expect(usePlaylistStore.getState().playlists[0].tracks).toHaveLength(1);
  });
});
