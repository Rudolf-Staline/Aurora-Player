// Type declarations for Google Identity Services

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  [key: string]: unknown;
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
  }) => GoogleTokenClient;
}

interface GoogleAccounts {
  oauth2: GoogleOAuth2;
}

interface GoogleLibrary {
  accounts: GoogleAccounts;
}

interface Window {
  google?: GoogleLibrary;
}

// File System Access API types
interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
  getFile(): Promise<File>;
}

interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
}

interface FileSystemDirectoryHandle {
  kind: 'directory';
  values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
}