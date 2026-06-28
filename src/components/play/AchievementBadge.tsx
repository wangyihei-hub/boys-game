import type { Achievement } from '../../types';

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const unlocked = achievement.unlockedAt !== undefined;

  return (
    <div className="perspective-1000 group">
      <div
        className={[
          'badge-3d relative flex h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center shadow-sm',
          unlocked
            ? 'border-amber-200 bg-amber-50'
            : 'border-slate-200 bg-slate-100 opacity-70 grayscale'
        ].join(' ')}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
          {unlocked ? achievement.icon : '🔒'}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">{achievement.title}</h3>
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{achievement.description}</p>
        </div>
        {unlocked && (
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            已解锁
          </span>
        )}
      </div>
    </div>
  );
}
