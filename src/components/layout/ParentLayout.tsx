import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useParentStore } from '../../stores/parentStore';

export function ParentLayout() {
  const loadParentData = useParentStore(state => state.loadParentData);
  const loaded = useParentStore(state => state.loaded);
  const error = useParentStore(state => state.error);
  const clearError = useParentStore(state => state.clearError);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

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
          onClick={() => { clearError(); loadParentData(); }}
          className="rounded-lg bg-slate-800 px-4 py-2 text-white"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-800 p-4 text-white">
        <h1 className="text-xl font-bold">家长管理中心</h1>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}
