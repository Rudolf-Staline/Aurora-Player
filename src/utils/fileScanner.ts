import { parseBlob } from 'music-metadata';

interface FileMetadata {
  title: string;
  artist: string;
  album: string;
  artworkUrl?: string;
  duration?: number;
}

export const getFileMetadata = async (file: File): Promise<FileMetadata> => {
  let title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension fallback
  let artist = 'Unknown Artist';
  let album = 'Local Files';
  let artworkUrl: string | undefined = undefined;
  let duration: number | undefined = undefined;

  try {
    // Read tags from the File object
    const metadata = await parseBlob(file);
    
    if (metadata.common.title) title = metadata.common.title;
    if (metadata.common.artist) artist = metadata.common.artist;
    if (metadata.common.album) album = metadata.common.album;
    if (metadata.format.duration) duration = metadata.format.duration;

    // Extract picture
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
      artworkUrl = URL.createObjectURL(blob);
    }
  } catch (error) {
    console.warn(`Failed to parse metadata for ${file.name}, using fallback.`, error);
    // Basic parsing assuming "Artist - Title" format
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  }

  return { title, artist, album, artworkUrl, duration };
};

export const scanDirectory = async (dirHandle: FileSystemDirectoryHandle): Promise<File[]> => {
  const files: File[] = [];
  const supportedExtensions = ['.mp3', '.flac', '.wav', '.m4a', '.ogg'];

  try {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const extension = file.name.slice((Math.max(0, file.name.lastIndexOf('.')) || Infinity)).toLowerCase();
        
        if (supportedExtensions.includes(extension)) {
          files.push(file);
        }
      } else if (entry.kind === 'directory') {
        // Recursively scan subdirectories
        const subFiles = await scanDirectory(entry);
        files.push(...subFiles);
      }
    }
  } catch (err) {
    console.error("Error scanning directory:", err);
  }
  
  return files;
};
