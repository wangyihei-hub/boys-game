import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { useHealthGuard } from '../../hooks/useHealthGuard';
import { RestModeOverlay } from '../play/RestModeOverlay';
import { EyeCareModal } from '../play/EyeCareModal';
import { BottomTabBar } from '../play/BottomTabBar';

const TAB_ROUTES = ['/play', '/play/shop', '/play/arcade', '/play/wrong'];

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

  const showTab = TAB_ROUTES.includes(location.pathname);

  return (
    <div className="scene-camp-home relative flex min-h-screen flex-col">
      <RestModeOverlay isActive={isRestModeActive} />
      <EyeCareModal show={showEyeCare} onDismiss={dismissEyeCare} />
      <main className={['flex-1', showTab ? 'pb-24' : 'pb-[env(safe-area-inset-bottom)]'].join(' ')}>
        <Outlet />
      </main>
      {showTab && <BottomTabBar />}
    </div>
  );
}
