import { create } from 'zustand';

interface TokenResponse {
  access_token: string;
  scope?: string;
  expires_in?: number;
  [key: string]: unknown;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
}

interface AuthState {
  isConnected: boolean;
  accessToken: string | null;
  user: User | null;

  login: (tokenResponse: TokenResponse) => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isConnected: false,
  accessToken: null,
  user: null,

  login: async (tokenResponse: TokenResponse) => {
    try {
      const { access_token } = tokenResponse;
      
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      
      if (!res.ok) throw new Error('Failed to fetch user info');
      
      const data = await res.json();
      
      const user: User = {
        name: data.name,
        email: data.email,
        avatar: data.picture,
      };

      localStorage.setItem('aurora_auth_token', access_token);
      localStorage.setItem('aurora_auth_user', JSON.stringify(user));
      if (tokenResponse.scope) {
        localStorage.setItem('aurora_auth_scope', tokenResponse.scope);
      }
      localStorage.removeItem('aurora_cloud_sync_disabled');

      set({ isConnected: true, accessToken: access_token, user });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('aurora_auth_token');
    localStorage.removeItem('aurora_auth_user');
    localStorage.removeItem('aurora_auth_scope');
    localStorage.removeItem('aurora_cloud_sync_disabled');
    set({ isConnected: false, accessToken: null, user: null });
  },

  restoreSession: () => {
    const token = localStorage.getItem('aurora_auth_token');
    const userJson = localStorage.getItem('aurora_auth_user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ isConnected: true, accessToken: token, user });
      } catch {
        console.error('Failed to parse user from local storage');
      }
    }
  },
}));
