import { useOfflineStore } from '../offline/offlineStore';

export function OfflineBanner() {
  const isOffline = useOfflineStore(s => s.isOffline);
  if (!isOffline) return null;
  return (
    <div className="w-full bg-amber-100 border-b border-amber-300 text-amber-800 px-4 py-2 text-sm text-center sticky top-[64px] z-40">
      📡 You're offline — showing downloaded content only
    </div>
  );
}
