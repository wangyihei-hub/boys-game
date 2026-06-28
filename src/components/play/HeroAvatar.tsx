import type { Profile } from '../../types';

interface HeroAvatarProps {
  profile: Profile;
  hp: number;
  maxHp: number;
  bounce?: boolean;
  attacking?: boolean;
  hurt?: boolean;
}

export function HeroAvatar({ profile, hp, maxHp, bounce, attacking, hurt }: HeroAvatarProps) {
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div
        className={[
          'flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-5xl shadow-xl transition sm:h-32 sm:w-32 sm:text-6xl',
          bounce ? 'animate-bounceShort' : '',
          attacking ? 'animate-attackLunge' : '',
          hurt ? 'animate-hurtFlash' : ''
        ].join(' ')}
      >
        🧒
      </div>
      <div className="w-28 sm:w-40">
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900/10 shadow-inner sm:h-4">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <p className="mt-1 text-center text-xs font-bold text-slate-700 sm:text-sm">
          {hp}/{maxHp}
        </p>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800 sm:text-base">{profile.nickname}</p>
        <p className="text-xs font-semibold text-slate-500">Lv.{profile.level}</p>
      </div>
    </div>
  );
}
