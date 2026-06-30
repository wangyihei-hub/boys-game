interface AvatarBadgeProps {
  emoji: string;
  level: number;
  onClick?: () => void;
  className?: string;
}

export function AvatarBadge({ emoji, level, onClick, className }: AvatarBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-md ring-2 ring-white/60 active:scale-95',
        className ?? ''
      ].join(' ')}
    >
      {emoji}
      <span className="absolute -bottom-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
        {level}
      </span>
    </button>
  );
}
