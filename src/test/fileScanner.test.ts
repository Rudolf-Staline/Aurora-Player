import { describe, expect, it } from 'vitest';
import { isSupportedAudioFileName, scanDirectory } from '../utils/fileScanner';

type MockEntry = FileSystemFileHandle | FileSystemDirectoryHandle;

const createFileHandle = (name: string): FileSystemFileHandle => ({
  kind: 'file',
  name,
  getFile: () => Promise.resolve(new File(['data'], name)),
});

const createDirectoryHandle = (name: string, entries: MockEntry[]): FileSystemDirectoryHandle => ({
  kind: 'directory',
  name,
  async *values() {
    yield* entries;
  },
});

describe('fileScanner', () => {
  it('detects supported audio extensions case-insensitively', () => {
    expect(isSupportedAudioFileName('song.MP3')).toBe(true);
    expect(isSupportedAudioFileName('mix.flac')).toBe(true);
    expect(isSupportedAudioFileName('voice-note.ogg')).toBe(true);
    expect(isSupportedAudioFileName('cover.png')).toBe(false);
    expect(isSupportedAudioFileName('README')).toBe(false);
  });

  it('recursively scans directories and filters non-audio files', async () => {
    const nested = createDirectoryHandle('nested', [
      createFileHandle('episode.m4a'),
      createFileHandle('cover.jpg'),
    ]);

    const root = createDirectoryHandle('root', [
      createFileHandle('track.mp3'),
      createFileHandle('notes.txt'),
      nested,
    ]);

    const files = await scanDirectory(root);

    expect(files.map((file) => file.name)).toEqual(['track.mp3', 'episode.m4a']);
  });
});
