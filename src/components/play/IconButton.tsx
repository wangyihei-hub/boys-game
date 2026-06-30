import type { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  badge?: number;
  colorClass?: string;
}

export function IconButton({ icon: Icon, label, onClick, badge, colorClass }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-110 active:scale-95"
    >
      <Icon className={['h-6 w-6', colorClass ?? 'text-slate-600'].join(' ')} />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
