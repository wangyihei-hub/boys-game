import type { LucideIcon } from 'lucide-react';

interface StatusCapsuleProps {
  icon: LucideIcon;
  value: string | number;
  iconClass?: string;
  className?: string;
}

export function StatusCapsule({ icon: Icon, value, iconClass, className }: StatusCapsuleProps) {
  return (
    <div className={['flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow-sm', className].join(' ')}>
      <Icon className={['h-4 w-4', iconClass ?? 'text-slate-500'].join(' ')} />
      <span className="text-slate-700">{value}</span>
    </div>
  );
}
