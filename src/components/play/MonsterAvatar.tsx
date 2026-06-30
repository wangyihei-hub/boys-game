import type { Subject } from '../../types';

interface MonsterAvatarProps {
  subject: Subject;
  title: string;
  levelNumber: number;
  isBoss?: boolean;
  shake?: boolean;
  attacking?: boolean;
  hurt?: boolean;
}

const MONSTER_EMOJI: Record<Subject, string> = {
  chinese: '🐉',
  math: '🧮',
  english: '🦑'
};

export function MonsterAvatar({
  subject,
  title,
  levelNumber,
  isBoss = false,
  shake,
  attacking,
  hurt
}: MonsterAvatarProps) {
  const emoji = isBoss ? '👹' : MONSTER_EMOJI[subject];

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div
        className={[
          'flex items-center justify-center rounded-3xl bg-white text-6xl shadow-xl transition sm:text-7xl',
          isBoss ? 'h-28 w-28 sm:h-36 sm:w-36' : 'h-24 w-24 sm:h-32 sm:w-32',
          shake ? 'animate-shake' : '',
          attacking ? 'animate-attackLungeLeft' : '',
          hurt ? 'animate-hurtFlash' : ''
        ].join(' ')}
      >
        {emoji}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800 sm:text-base">
          {isBoss ? title : '学科小怪'}
        </p>
        <p className="text-xs font-semibold text-slate-500">
          {isBoss ? 'BOSS' : `第 ${levelNumber} 关`}
        </p>
      </div>
    </div>
  );
}
