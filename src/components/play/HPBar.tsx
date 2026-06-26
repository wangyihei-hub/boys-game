interface HPBarProps {
  label: string;
  current: number;
  max: number;
  color: 'green' | 'red' | 'blue';
}

const COLOR_CLASS: Record<HPBarProps['color'], string> = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500'
};

export function HPBar({ label, current, max, color }: HPBarProps) {
  const percent = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span>{current}/{max}</span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={['h-full rounded-full transition-all duration-300', COLOR_CLASS[color]].join(' ')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
