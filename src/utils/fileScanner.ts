import { parseBlob } from 'music-metadata';

export interface FileMetadata {
  title: string;
  artist: string;
  album: string;
  artworkUrl?: string;
  duration?: number;
}

export const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.m4a', '.ogg'] as const;

export const isSupportedAudioFileName = (fileName: string): boolean => {
  const normalizedName = fileName.toLowerCase();
  return SUPPORTED_AUDIO_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
};

const parseArtistAndTitleFromFileName = (fileName: string): Pick<FileMetadata, 'artist' | 'title'> => {
  const titleWithoutExtension = fileName.replace(/\.[^/.]+$/, '');
  const separator = ' - ';

  if (!titleWithoutExtension.includes(separator)) {
    return { artist: 'Unknown Artist', title: titleWithoutExtension };
  }

  const [artist, ...titleParts] = titleWithoutExtension.split(separator);
  const parsedTitle = titleParts.join(separator).trim();

  return {
    artist: artist.trim() || 'Unknown Artist',
    title: parsedTitle || titleWithoutExtension,
  };
};

export const getFileMetadata = async (file: File): Promise<FileMetadata> => {
  const fallback = parseArtistAndTitleFromFileName(file.name);
  let title = fallback.title;
  let artist = fallback.artist;
  let album = 'Local Files';
  let artworkUrl: string | undefined;
  let duration: number | undefined;

  try {
    const metadata = await parseBlob(file);

    if (metadata.common.title) title = metadata.common.title;
    if (metadata.common.artist) artist = metadata.common.artist;
    if (metadata.common.album) album = metadata.common.album;
    if (metadata.format.duration) duration = metadata.format.duration;

    const picture = metadata.common.picture?.[0];
    if (picture) {
      const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
      artworkUrl = URL.createObjectURL(blob);
    }
  } catch (error) {
    console.warn(`Failed to parse metadata for ${file.name}, using fallback.`, error);
  }

  return { title, artist, album, artworkUrl, duration };
};

export const scanDirectory = async (dirHandle: FileSystemDirectoryHandle): Promise<File[]> => {
  const files: File[] = [];

  for await (const entry of dirHandle.values()) {
    try {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (isSupportedAudioFileName(file.name)) {
          files.push(file);
        }
        continue;
      }

      const subFiles = await scanDirectory(entry);
      files.push(...subFiles);
    } catch (error) {
      console.warn(`Skipping unreadable ${entry.kind} entry: ${entry.name}`, error);
    }
  }

  return files;
};
