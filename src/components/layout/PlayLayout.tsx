import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { useHealthGuard } from '../../hooks/useHealthGuard';
import { RestModeOverlay } from '../play/RestModeOverlay';
import { EyeCareModal } from '../play/EyeCareModal';

export function PlayLayout() {
  const loadProfile = useProfileStore(state => state.loadProfile);
  const loaded = useProfileStore(state => state.loaded);
  const error = useProfileStore(state => state.error);
  const clearError = useProfileStore(state => state.clearError);
  const { isRestModeActive, showEyeCare, dismissEyeCare } = useHealthGuard();
  const location = useLocation();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!loaded) {
    return <div className="flex h-screen items-center justify-center">加载中...</div>;
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="rounded-lg bg-red-100 p-4 text-red-700">
          <p className="font-bold">加载失败</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => { clearError(); loadProfile(); }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
        >
          重试
        </button>
      </div>
    );
  }

  const isHome = location.pathname === '/play';

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <RestModeOverlay isActive={isRestModeActive} />
      <EyeCareModal show={showEyeCare} onDismiss={dismissEyeCare} />
      {!isHome && (
        <header className="shrink-0 bg-slate-900 px-4 py-3 text-white sm:py-4">
          <h1 className="text-lg font-bold sm:text-xl">学霸星球</h1>
        </header>
      )}
      <main className={['flex-1', isHome ? '' : 'p-2 pb-[env(safe-area-inset-bottom)] sm:p-4'].join(' ')}>
        <Outlet />
      </main>
    </div>
  );
}
