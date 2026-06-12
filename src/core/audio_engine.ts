import { Howl, Howler } from 'howler';
import { usePlayerStore, type Track } from '../store/usePlayerStore';
import { useHistoryStore } from '../store/useHistoryStore';

class AudioEngine {
  private currentHowl: Howl | null = null;
  private timerId: number | null = null;
  private currentTrackId: string | null = null;

  constructor() {
    Howler.volume(usePlayerStore.getState().volume);
    
    // Subscribe to volume changes
    usePlayerStore.subscribe((state) => {
      Howler.volume(state.volume);
    });

    // Subscribe to currentTrack changes
    usePlayerStore.subscribe((state, prevState) => {
      if (
        state.currentTrack &&
        state.currentTrack.id !== this.currentTrackId &&
        state.currentTrack.id !== prevState.currentTrack?.id
      ) {
        this.play(state.currentTrack);
      }
    });

    // Detect headset disconnection
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        // Pause playback when audio devices change (e.g. unplugging headphones)
        // for better privacy and user experience.
        if (usePlayerStore.getState().isPlaying) {
          this.pause();
        }
      });
    }
  }

  playAndStart(track: Track) {
    usePlayerStore.getState().playTrack(track);
  }

  play(track: Track) {
    if (this.currentHowl) {
      this.currentHowl.stop();
      this.currentHowl.unload();
      this.stopProgressTimer();
    }

    this.currentTrackId = track.id;

    // Log history
    useHistoryStore.getState().addEntry({
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      artworkUrl: track.artworkUrl,
      url: track.url,
      duration: track.duration || 0,
      source: track.album === 'Cloud Storage' ? 'drive' : (track.album === 'Podcast Episode' ? 'podcast' : 'local')
    });

    // Setup Media Session for Headsets/Hardware Controls
    this.updateMediaSession(track);

    this.currentHowl = new Howl({
      src: [track.url],
      html5: true, 
      format: ['mp3', 'flac', 'wav', 'm4a', 'ogg'],
      volume: usePlayerStore.getState().volume,
      onplay: () => {
        usePlayerStore.getState().resume();
        const duration = this.currentHowl?.duration() || 0;
        usePlayerStore.getState().setDuration(duration);
        this.startProgressTimer();
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      },
      onpause: () => {
        usePlayerStore.getState().pause();
        this.stopProgressTimer();
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      },
      onend: () => {
        const state = usePlayerStore.getState();
        this.stopProgressTimer();
        state.setProgress(0);
        state.setCurrentTime(0);
        
        if (state.repeatMode === 'one') {
          this.play(track);
        } else {
          state.playNext();
        }
      },
      onloaderror: (_id, error) => {
        console.error('AudioEngine Load Error:', error);
      },
      onplayerror: (_id, error) => {
        console.error('AudioEngine Play Error:', error);
      }
    });

    this.currentHowl.play();
  }

  private updateMediaSession(track: Track) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'Omed Player',
        artwork: track.artworkUrl ? [
          { src: track.artworkUrl, sizes: '96x96',   type: 'image/png' },
          { src: track.artworkUrl, sizes: '128x128', type: 'image/png' },
          { src: track.artworkUrl, sizes: '192x192', type: 'image/png' },
          { src: track.artworkUrl, sizes: '256x256', type: 'image/png' },
          { src: track.artworkUrl, sizes: '384x384', type: 'image/png' },
          { src: track.artworkUrl, sizes: '512x512', type: 'image/png' },
        ] : []
      });

      const actions: MediaSessionAction[] = ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto'];
      
      actions.forEach(action => {
        try {
          navigator.mediaSession.setActionHandler(action, (details) => {
            switch (action) {
              case 'play': this.resume(); break;
              case 'pause': this.pause(); break;
              case 'previoustrack': usePlayerStore.getState().playPrevious(); break;
              case 'nexttrack': usePlayerStore.getState().playNext(); break;
              case 'seekto': 
                if (details.seekTime !== undefined) this.seek(details.seekTime);
                break;
            }
          });
        } catch {
          console.warn(`Action ${action} not supported.`);
        }
      });
    }
  }

  pause() {
    if (this.currentHowl) {
      this.currentHowl.pause();
    }
  }

  resume() {
    if (this.currentHowl && !this.currentHowl.playing()) {
      this.currentHowl.play();
    }
  }

  togglePlay() {
    if (this.currentHowl) {
      if (this.currentHowl.playing()) {
        this.pause();
      } else {
        this.resume();
      }
    }
  }

  seek(time: number) {
    if (this.currentHowl) {
      this.currentHowl.seek(time);
      usePlayerStore.getState().setCurrentTime(time);
      const duration = this.currentHowl.duration();
      if (duration > 0) {
        usePlayerStore.getState().setProgress(time / duration);
      }
    }
  }

  setVolume(volume: number) {
    Howler.volume(volume);
    usePlayerStore.getState().setVolume(volume);
  }

  private startProgressTimer() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }
    this.timerId = window.setInterval(() => {
      if (this.currentHowl && this.currentHowl.playing()) {
        const currentTime = this.currentHowl.seek() as number;
        const duration = this.currentHowl.duration();
        usePlayerStore.getState().setCurrentTime(currentTime);
        if (duration > 0) {
          usePlayerStore.getState().setProgress(currentTime / duration);
        }
        
        if ('mediaSession' in navigator && (navigator.mediaSession as unknown as { setPositionState?: (state: { duration: number; playbackRate: number; position: number }) => void }).setPositionState) {
          try {
            (navigator.mediaSession as unknown as { setPositionState: (state: { duration: number; playbackRate: number; position: number }) => void }).setPositionState({
              duration: duration,
              playbackRate: 1,
              position: currentTime
            });
          } catch {
            // Ignore position state errors
          }
        }
      }
    }, 1000);
  }

  private stopProgressTimer() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const audioEngine = new AudioEngine();
