// Google Drive appDataFolder Sync Architecture

import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

const handleApiError = (res: Response) => {
    if (res.status === 401) {
        useAuthStore.getState().logout();
        toast.error('Session expired. Please log in again.');
        throw new Error('Session expirée. Reconnecte-toi.');
    }
};

export const saveToCloud = async (filename: string, data: unknown): Promise<void> => {
    const token = localStorage.getItem('aurora_auth_token');
    if (!token) return;

    try {
        // 1. Check if file exists in appDataFolder
        const searchRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${filename}'&fields=files(id)`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        handleApiError(searchRes);
        const searchData = await searchRes.json();
        const fileExists = searchData.files && searchData.files.length > 0;
        
        const metadata = {
            name: filename,
            parents: ['appDataFolder'],
            mimeType: 'application/json'
        };

        const fileContent = new Blob([JSON.stringify(data)], { type: 'application/json' });
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', fileContent);

        if (fileExists) {
            const fileId = searchData.files[0].id;
            const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
                body: form
            });
            handleApiError(uploadRes);
        } else {
            const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form
            });
            handleApiError(uploadRes);
        }
    } catch (e) {
        console.error(`Sync failed for ${filename}`, e);
    }
};

export const loadFromCloud = async <T = unknown>(filename: string): Promise<T | null> => {
    const token = localStorage.getItem('aurora_auth_token');
    if (!token) return null;

    try {
        const searchRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${filename}'&fields=files(id)`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        handleApiError(searchRes);
        const searchData = await searchRes.json();
        
        if (searchData.files && searchData.files.length > 0) {
            const fileId = searchData.files[0].id;
            const contentRes = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            handleApiError(contentRes);
            return await contentRes.json() as T;
        }
    } catch (e) {
        console.error(`Load failed for ${filename}`, e);
    }
    return null;
};
