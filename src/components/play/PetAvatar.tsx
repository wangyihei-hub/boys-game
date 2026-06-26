export interface PetAvatarProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  badge?: string;
}

const sizeClasses: Record<NonNullable<PetAvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-lg',
  md: 'h-12 w-12 text-2xl',
  lg: 'h-20 w-20 text-4xl'
};

export function PetAvatar({ icon, size = 'md', badge }: PetAvatarProps) {
  return (
    <div className="relative inline-flex">
      <div
        className={[
          'flex items-center justify-center rounded-full border-2 border-indigo-100 bg-indigo-50',
          sizeClasses[size]
        ].join(' ')}
      >
        {icon}
      </div>
      {badge && (
        <span className="absolute -right-1 -top-1 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </div>
  );
}
