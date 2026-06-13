import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.appdata';

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
  parents?: string[];
}

const storeToken = (accessToken: string, scope?: string) => {
  localStorage.setItem('aurora_auth_token', accessToken);
  if (scope) localStorage.setItem('aurora_auth_scope', scope);
  localStorage.removeItem('aurora_cloud_sync_disabled');
};

const loadGoogleIdentityScript = (): Promise<void> => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => resolve(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
};

const requestDriveToken = async (prompt: '' | 'consent'): Promise<string | null> => {
  await loadGoogleIdentityScript();
  if (!window.google?.accounts?.oauth2) return null;

  return new Promise((resolve) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      scope: SCOPES,
      callback: (response) => {
        if (response.error !== undefined) {
          console.error('Google Auth Error:', response);
          resolve(null);
        } else if (response.access_token) {
          storeToken(response.access_token, response.scope);
          resolve(response.access_token);
        } else {
          resolve(null);
        }
      },
    });

    client.requestAccessToken({ prompt });
  });
};

export const initGoogleDriveAuth = async (): Promise<string | null> => {
  const token = localStorage.getItem('aurora_auth_token');
  if (token) return token;
  return requestDriveToken('');
};

export const requireDriveAuth = async (): Promise<string | null> => {
  const token = localStorage.getItem('aurora_auth_token');
  if (token) return token;
  return requestDriveToken('consent');
};

export const forceDriveReauth = async (): Promise<string | null> => {
  localStorage.removeItem('aurora_auth_token');
  localStorage.removeItem('aurora_auth_scope');
  localStorage.removeItem('aurora_cloud_sync_disabled');
  return requestDriveToken('consent');
};

const handleApiError = (res: Response) => {
  if (res.status === 401) {
    useAuthStore.getState().logout();
    toast.error('Session expired. Please log in again.');
    throw new Error('Session expirée. Reconnecte-toi.');
  }

  if (res.status === 403) {
    localStorage.setItem('aurora_cloud_sync_disabled', 'true');
    toast.error('Google Drive refuse les droits actuels. Reconnecte-toi pour réactiver la synchronisation.');
    throw new Error('Google Drive permission denied. Reconnect required.');
  }
};

export const fetchDriveAudioFiles = async (token: string): Promise<DriveFile[]> => {
  const query = encodeURIComponent("mimeType contains 'audio/' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,thumbnailLink,modifiedTime)&pageSize=200`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  handleApiError(res);
  if (!res.ok) throw new Error('Failed to fetch from Drive');
  const data = await res.json();
  return data.files || [];
};

export const scanAllAudioFiles = async (
  token: string,
  onPageLoaded: (newFiles: DriveFile[]) => void
): Promise<DriveFile[]> => {
  const allFiles: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const query = encodeURIComponent("mimeType contains 'audio/' and trashed=false");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=nextPageToken,files(id,name,mimeType,size,modifiedTime,parents)&pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    handleApiError(res);
    if (!res.ok) throw new Error('Failed to fetch from Drive');

    const data = await res.json();
    const newFiles = data.files || [];
    allFiles.push(...newFiles);
    onPageLoaded(newFiles);

    pageToken = data.nextPageToken;
  } while (pageToken);

  return allFiles;
};

export const verifyFile = async (fileId: string, token: string): Promise<boolean> => {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
    );
    return res.ok;
  } catch {
    return false;
  }
};

export const getStreamUrl = (fileId: string, token: string): string => {
  if (import.meta.env.DEV) {
    return `/drive-stream/${encodeURIComponent(fileId)}?token=${encodeURIComponent(token)}`;
  }

  const params = new URLSearchParams({ fileId, token });
  return `/api/drive-stream?${params.toString()}`;
};
