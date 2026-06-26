import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useProfileStore } from '../../stores/profileStore';

export function PlayLayout() {
  const loadProfile = useProfileStore(state => state.loadProfile);
  const loaded = useProfileStore(state => state.loaded);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!loaded) {
    return <div className="flex h-screen items-center justify-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-600 p-4 text-white">
        <h1 className="text-xl font-bold">学科小勇士</h1>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}
