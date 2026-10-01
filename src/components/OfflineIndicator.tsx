import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-3 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-xl border border-amber-400">
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-slate-950" />
      <div>
        <p className="font-bold">Offline Mode Active</p>
        <p className="text-[11px] font-normal text-slate-900 opacity-90">
          Showing cached business data. Operations will sync when connection returns.
        </p>
      </div>
    </div>
  );
};
