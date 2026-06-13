import { describe, expect, it } from 'vitest';
import { isSupportedAudioFileName } from '../utils/fileScanner';

describe('fileScanner', () => {
  it('detects supported audio extensions case-insensitively', () => {
    expect(isSupportedAudioFileName('song.MP3')).toBe(true);
    expect(isSupportedAudioFileName('mix.flac')).toBe(true);
    expect(isSupportedAudioFileName('voice-note.ogg')).toBe(true);
    expect(isSupportedAudioFileName('cover.png')).toBe(false);
    expect(isSupportedAudioFileName('README')).toBe(false);
  });
});
