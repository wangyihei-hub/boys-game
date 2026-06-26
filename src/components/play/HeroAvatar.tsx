import type { Profile } from '../../types';

interface HeroAvatarProps {
  profile: Profile;
  hp: number;
  maxHp: number;
  bounce?: boolean;
}

export function HeroAvatar({ profile, hp, maxHp, bounce }: HeroAvatarProps) {
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={[
          'flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-5xl shadow-lg',
          bounce ? 'animate-bounceShort' : ''
        ].join(' ')}
      >
        🧒
      </div>
      <div className="w-32">
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <p className="mt-1 text-center text-xs font-semibold text-slate-600">
          {hp}/{maxHp}
        </p>
      </div>
      <p className="text-sm font-bold text-slate-700">{profile.nickname}</p>
      <p className="text-xs text-slate-500">Lv.{profile.level}</p>
    </div>
  );
}
