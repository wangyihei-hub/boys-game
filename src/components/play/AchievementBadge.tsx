import type { Achievement } from '../../types';

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const unlocked = achievement.unlockedAt !== undefined;

  return (
    <div
      className={[
        'card flex flex-col items-center gap-2 text-center transition',
        unlocked ? 'border-amber-200 bg-amber-50' : 'opacity-60 grayscale'
      ].join(' ')}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm">
        {achievement.icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-800">{achievement.title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{achievement.description}</p>
      </div>
      {unlocked && (
        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
          已解锁
        </span>
      )}
    </div>
  );
}
