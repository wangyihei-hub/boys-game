import type { Profile } from '../../types';

interface HeroAvatarProps {
  profile: Profile;
  bounce?: boolean;
  attacking?: boolean;
  hurt?: boolean;
}

export function HeroAvatar({ profile, bounce, attacking, hurt }: HeroAvatarProps) {
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
        {profile.avatar ?? '🧒'}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800 sm:text-base">{profile.nickname}</p>
        <p className="text-xs font-semibold text-slate-500">Lv.{profile.level}</p>
      </div>
    </div>
  );
}
