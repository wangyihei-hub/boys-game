import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  icon?: LucideIcon;
  right?: ReactNode;
}

export function PageHeader({ title, backTo = '/play', icon: Icon, right }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-white/80 px-4 py-3 backdrop-blur-md">
      <Link
        to={backTo}
        className="flex items-center gap-1 text-sm font-bold text-slate-600 active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
        {Icon && <Icon className="h-4 w-4" />}
        <span>{title}</span>
      </Link>
      {right}
    </header>
  );
}
