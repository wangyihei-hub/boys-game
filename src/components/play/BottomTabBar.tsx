import { Link, useLocation } from 'react-router-dom';
import { Tent, ShoppingBag, Gamepad2, BookOpen } from 'lucide-react';

const TABS = [
  { to: '/play', label: '营地', icon: Tent },
  { to: '/play/shop', label: '商城', icon: ShoppingBag },
  { to: '/play/arcade', label: '副本', icon: Gamepad2 },
  { to: '/play/wrong', label: '错题本', icon: BookOpen }
];

export function BottomTabBar() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]">
      <div className="mx-4 mb-3 flex w-full max-w-md items-center justify-around rounded-2xl bg-white/90 p-2 shadow-lg backdrop-blur-md">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = location.pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={[
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-bold transition',
                active ? '-translate-y-1 bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
              ].join(' ')}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
