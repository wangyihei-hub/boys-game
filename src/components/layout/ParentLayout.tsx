import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useParentStore } from '../../stores/parentStore';

export function ParentLayout() {
  const loadParentData = useParentStore(state => state.loadParentData);
  const loaded = useParentStore(state => state.loaded);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  if (!loaded) {
    return <div className="flex h-screen items-center justify-center">加载中...</div>;
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
