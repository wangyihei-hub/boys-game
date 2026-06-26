import type { Stage } from '../../types';

interface MonsterAvatarProps {
  stage: Stage;
  hp: number;
  maxHp: number;
  shake?: boolean;
}

const MONSTER_EMOJI: Record<Stage['subject'], string> = {
  chinese: '🐉',
  math: '🧮',
  english: '🦑'
};

export function MonsterAvatar({ stage, hp, maxHp, shake }: MonsterAvatarProps) {
  const emoji = stage.isBoss ? '👹' : MONSTER_EMOJI[stage.subject];
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={[
          'flex items-center justify-center rounded-3xl bg-white text-6xl shadow-lg',
          stage.isBoss ? 'h-28 w-28' : 'h-24 w-24',
          shake ? 'animate-shake' : ''
        ].join(' ')}
      >
        {emoji}
      </div>
      <div className="w-32">
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-red-500 transition-all duration-300"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <p className="mt-1 text-center text-xs font-semibold text-slate-600">
          {hp}/{maxHp}
        </p>
      </div>
      <p className="text-sm font-bold text-slate-700">{stage.isBoss ? stage.name : '学科小怪'}</p>
    </div>
  );
}
