import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useProfileStore } from '../../stores/profileStore';

export function PlayLayout() {
  const loadProfile = useProfileStore(state => state.loadProfile);
  const loaded = useProfileStore(state => state.loaded);
  const error = useProfileStore(state => state.error);
  const clearError = useProfileStore(state => state.clearError);

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
