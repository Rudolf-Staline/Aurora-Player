const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.appdata';

export const initGoogleDriveAuth = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const token = localStorage.getItem('aurora_auth_token');
    if (token) {
        resolve(token);
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google?.accounts?.oauth2) {
        resolve(null);
        return;
      }
      
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        scope: SCOPES,
        callback: (response) => {
          if (response.error !== undefined) {
            console.error('Google Auth Error:', response);
            resolve(null);
          } else if (response.access_token) {
            localStorage.setItem('aurora_auth_token', response.access_token);
            resolve(response.access_token);
          } else {
            resolve(null);
          }
        },
      });
      client.requestAccessToken({ prompt: '' });
    };
    document.head.appendChild(script);
  });
};

export const requireDriveAuth = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const token = localStorage.getItem('aurora_auth_token');
    if (token) return resolve(token);

    if (!window.google?.accounts?.oauth2) return resolve(null);

    const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        scope: SCOPES,
        callback: (response) => {
          if (response.error !== undefined) {
            resolve(null);
          } else if (response.access_token) {
            localStorage.setItem('aurora_auth_token', response.access_token);
            resolve(response.access_token);
          } else {
            resolve(null);
          }
        },
    });
    client.requestAccessToken({ prompt: 'consent' });
  });
};

import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
  parents?: string[];
}

const handleApiError = (res: Response) => {
    if (res.status === 401) {
        useAuthStore.getState().logout();
        toast.error('Session expired. Please log in again.');
        throw new Error('Session expirée. Reconnecte-toi.');
    }
};

export const fetchDriveAudioFiles = async (token: string): Promise<DriveFile[]> => {
    const query = encodeURIComponent("mimeType contains 'audio'");
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
            `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id`,
            { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
        );
        return res.ok;
    } catch {
        return false;
    }
};

export const getStreamUrl = (fileId: string, token: string): string => {
    return `/drive-stream/${fileId}?token=${encodeURIComponent(token)}`;
};
