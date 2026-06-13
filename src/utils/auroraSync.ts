// Google Drive appDataFolder Sync Architecture

import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

const CLOUD_SYNC_DISABLED_KEY = 'aurora_cloud_sync_disabled';
const APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

interface DriveSearchResponse {
  files?: Array<{ id: string }>;
}

const escapeDriveQueryValue = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const getStoredToken = (): string | null => localStorage.getItem('aurora_auth_token');

const hasKnownAppDataScope = (): boolean => {
  const scope = localStorage.getItem('aurora_auth_scope');
  return !scope || scope.split(/\s+/).includes(APPDATA_SCOPE);
};

const disableCloudSync = () => {
  localStorage.setItem(CLOUD_SYNC_DISABLED_KEY, 'true');
};

const isCloudSyncDisabled = (): boolean => localStorage.getItem(CLOUD_SYNC_DISABLED_KEY) === 'true';

const readErrorBody = async (res: Response): Promise<string> => {
  try {
    return await res.text();
  } catch {
    return '';
  }
};

const handleApiError = async (res: Response) => {
  if (res.status === 401) {
    useAuthStore.getState().logout();
    toast.error('Session expired. Please log in again.');
    throw new Error('Session expirée. Reconnecte-toi.');
  }

  if (res.status === 403) {
    disableCloudSync();
    toast.error('Synchronisation Drive bloquée : reconnecte-toi pour accorder les bons droits.');
    throw new Error(`Google Drive permission denied: ${await readErrorBody(res)}`);
  }

  if (!res.ok) {
    throw new Error(`Google Drive request failed with ${res.status}: ${await readErrorBody(res)}`);
  }
};

const findAppDataFile = async (filename: string, token: string): Promise<string | null> => {
  const query = encodeURIComponent(`name='${escapeDriveQueryValue(filename)}' and trashed=false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id)&pageSize=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  await handleApiError(searchRes);
  const searchData = (await searchRes.json()) as DriveSearchResponse;
  return searchData.files?.[0]?.id ?? null;
};

const createMultipartBody = (metadata: Record<string, unknown>, data: unknown): FormData => {
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  return form;
};

export const saveToCloud = async (filename: string, data: unknown): Promise<void> => {
  const token = getStoredToken();
  if (!token || isCloudSyncDisabled() || !hasKnownAppDataScope()) return;

  try {
    const fileId = await findAppDataFile(filename, token);

    if (fileId) {
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=multipart`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: createMultipartBody({ name: filename, mimeType: 'application/json' }, data),
      });
      await handleApiError(uploadRes);
      return;
    }

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: createMultipartBody({
        name: filename,
        parents: ['appDataFolder'],
        mimeType: 'application/json',
      }, data),
    });
    await handleApiError(uploadRes);
  } catch (e) {
    console.error(`Sync failed for ${filename}`, e);
  }
};

export const loadFromCloud = async <T = unknown>(filename: string): Promise<T | null> => {
  const token = getStoredToken();
  if (!token || isCloudSyncDisabled()) return null;

  try {
    const fileId = await findAppDataFile(filename, token);
    if (!fileId) return null;

    const contentRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await handleApiError(contentRes);
    return await contentRes.json() as T;
  } catch (e) {
    console.error(`Load failed for ${filename}`, e);
  }

  return null;
};
