import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Howler
vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    unload: vi.fn(),
    playing: vi.fn().mockReturnValue(false),
    seek: vi.fn().mockReturnValue(0),
    duration: vi.fn().mockReturnValue(180),
    volume: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
  })),
  Howler: {
    volume: vi.fn(),
    mute: vi.fn(),
  },
}));

// Mock navigator.mediaSession
Object.defineProperty(navigator, 'mediaSession', {
  value: {
    metadata: null,
    playbackState: 'none',
    setActionHandler: vi.fn(),
    setPositionState: vi.fn(),
  },
  writable: true,
});

// Mock MediaMetadata
class MockMediaMetadata {
  title: string | null = null;
  artist: string | null = null;
  album: string | null = null;
  artwork: { src: string }[] = [];

  constructor(init: { title?: string; artist?: string; album?: string; artwork?: { src: string }[] }) {
    this.title = init.title ?? null;
    this.artist = init.artist ?? null;
    this.album = init.album ?? null;
    this.artwork = init.artwork ?? [];
  }
}
Object.defineProperty(window, 'MediaMetadata', {
  value: MockMediaMetadata,
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Silence console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
