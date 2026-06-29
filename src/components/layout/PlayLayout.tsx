import { Outlet, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, Map, Shield, Cat, Gamepad2, Trophy } from 'lucide-react';
import { useProfileStore } from '../../stores/profileStore';
import { useHealthGuard } from '../../hooks/useHealthGuard';
import { RestModeOverlay } from '../play/RestModeOverlay';
import { EyeCareModal } from '../play/EyeCareModal';

const TABS = [
  { to: '/play', label: '营地', icon: Home },
  { to: '/play/map', label: '地图', icon: Map },
  { to: '/play/pet', label: '宠物', icon: Cat },
  { to: '/play/equipment', label: '装备', icon: Shield },
  { to: '/play/arcade', label: '副本', icon: Gamepad2 },
  { to: '/play/achievements', label: '成就', icon: Trophy }
];

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
      <main className={['flex-1', isHome ? '' : 'p-2 pb-[calc(3.5rem+env(safe-area-inset-bottom))] sm:p-4'].join(' ')}>
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl justify-around py-2">
          {TABS.map(tab => {
            const active = tab.to === '/play'
              ? location.pathname === '/play'
              : location.pathname.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={['flex flex-col items-center gap-0.5 text-xs font-semibold transition', active ? 'text-amber-300' : 'text-slate-400'].join(' ')}
              >
                <span className={['flex h-10 w-10 items-center justify-center rounded-xl transition', active ? 'bg-gradient-to-br from-amber-300 to-orange-400 text-amber-900 shadow-lg shadow-orange-400/30' : 'bg-white/5'].join(' ')}>
                  <Icon className="h-5 w-5" />
                </span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
