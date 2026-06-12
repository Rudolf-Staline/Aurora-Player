import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const googleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        await login(tokenResponse);
      } catch {
        setError('Connexion échouée. Réessaie.');
        setLoading(false);
      }
    },
    onError: () => {
        setError('Connexion échouée. Réessaie.');
        setLoading(false);
    }
  });

  return (
    <div className="fixed inset-0 bg-bg-primary text-text-primary flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Background Aurora effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-cyan/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-violet/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-glass p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-violet text-white shadow-lg glow-cyan mb-6 overflow-hidden p-0">
                <img src="/app-logo.png" alt="Omed Logo" className="w-full h-full object-cover" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary tracking-tight mb-4">
                Omed
              </h1>
            <p className="text-lg font-medium text-accent-cyan mb-6">
                Your music, your podcasts, everywhere.
            </p>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
                Connect with Google to sync your library, playlists and favorites across all your devices securely in your Google Drive.
            </p>

            <button 
                onClick={() => googleLogin()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-white/90 px-6 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
                {loading ? (
                    <Loader2 size={24} className="animate-spin text-black" />
                ) : (
                    <>
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                            <path fill="none" d="M1 1h22v22H1z" />
                        </svg>
                        Se connecter avec Google
                    </>
                )}
            </button>

            {error && (
                <div className="mt-4 p-3 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm rounded-lg w-full">
                    {error}
                </div>
            )}
        </div>
    </div>
  );
};
