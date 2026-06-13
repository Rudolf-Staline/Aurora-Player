import React, { useEffect, useState } from 'react';
import { Cloud, Loader2, CloudOff, CheckCircle } from 'lucide-react';
import { requireDriveAuth } from '../utils/googleDriveApi';

export const SyncStatus: React.FC = () => {
  const [status, setStatus] = useState<'offline' | 'syncing' | 'synced' | 'connect'>(
    localStorage.getItem('aurora_auth_token') ? 'synced' : 'connect'
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('aurora_auth_token');
      const disabled = localStorage.getItem('aurora_cloud_sync_disabled') === 'true';
      if (disabled && status !== 'offline') {
        setStatus('offline');
      } else if (token && status !== 'synced' && status !== 'syncing') {
        setStatus('synced');
      } else if (!token && status !== 'connect') {
        setStatus('connect');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [status]);

  const handleConnect = async () => {
    setStatus('syncing');
    const token = await requireDriveAuth();
    if (token) setStatus('synced');
    else setStatus('connect');
  };

  const label = {
    synced: 'Drive synchronisé',
    syncing: 'Connexion...',
    offline: 'Sync bloquée',
    connect: 'Connecter Drive',
  }[status];

  return (
    <button 
      className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left transition-all hover:border-accent-cyan/30 hover:bg-white/[0.075]"
      onClick={handleConnect}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors ${status === 'offline' ? 'bg-accent-rose/10 text-accent-rose' : status === 'synced' ? 'bg-accent-cyan/10 text-accent-cyan' : 'bg-white/10 text-text-muted'}`}>
        {status === 'synced' && <CheckCircle size={17} />}
        {status === 'syncing' && <Loader2 size={17} className="animate-spin" />}
        {status === 'offline' && <CloudOff size={17} />}
        {status === 'connect' && <Cloud size={17} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-black text-text-primary">{label}</span>
        <span className="block truncate text-[10px] text-text-muted">Google Drive · appData</span>
      </span>
    </button>
  );
};
