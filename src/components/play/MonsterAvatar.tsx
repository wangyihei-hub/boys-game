import type { Stage } from '../../types';

interface MonsterAvatarProps {
  stage: Stage;
  hp: number;
  maxHp: number;
  shake?: boolean;
  attacking?: boolean;
  hurt?: boolean;
}

const MONSTER_EMOJI: Record<Stage['subject'], string> = {
  chinese: '🐉',
  math: '🧮',
  english: '🦑'
};

export function MonsterAvatar({ stage, hp, maxHp, shake, attacking, hurt }: MonsterAvatarProps) {
  const emoji = stage.isBoss ? '👹' : MONSTER_EMOJI[stage.subject];
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div
        className={[
          'flex items-center justify-center rounded-3xl bg-white text-6xl shadow-xl transition sm:text-7xl',
          stage.isBoss ? 'h-28 w-28 sm:h-36 sm:w-36' : 'h-24 w-24 sm:h-32 sm:w-32',
          shake ? 'animate-shake' : '',
          attacking ? 'animate-attackLungeLeft' : '',
          hurt ? 'animate-hurtFlash' : ''
        ].join(' ')}
      >
        {emoji}
      </div>
      <div className="w-28 sm:w-40">
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900/10 shadow-inner sm:h-4">
          <div
            className="h-full rounded-full bg-red-500 transition-all duration-300"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <p className="mt-1 text-center text-xs font-bold text-slate-700 sm:text-sm">
          {hp}/{maxHp}
        </p>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800 sm:text-base">
          {stage.isBoss ? stage.name : '学科小怪'}
        </p>
        <p className="text-xs font-semibold text-slate-500">
          {stage.isBoss ? 'BOSS' : `第 ${stage.stageNumber} 关`}
        </p>
      </div>
    </div>
  );
}
