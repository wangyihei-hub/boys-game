import { useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';
import { AchievementBadge } from '../components/play/AchievementBadge';
import { PageHeader } from '../components/play/PageHeader';

export function Achievements() {
  const achievements = useProfileStore(state => state.achievements);
  const loadProfile = useProfileStore(state => state.loadProfile);
  const loaded = useProfileStore(state => state.loaded);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const unlockedCount = achievements.filter(a => a.unlockedAt !== undefined).length;

  return (
    <div className="pb-4">
      <PageHeader title="成就图鉴" />
      <div className="space-y-4 p-4">
        <div className="card flex items-center gap-3 bg-amber-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">成就图鉴</h2>
            <p className="text-xs text-slate-500">
              已解锁 {unlockedCount}/{achievements.length}
            </p>
          </div>
        </div>

        {!loaded ? (
          <div className="card py-12 text-center text-slate-500">加载成就中…</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {achievements.map(achievement => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
