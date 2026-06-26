import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';
import { AchievementBadge } from '../components/play/AchievementBadge';

export function Achievements() {
  const achievements = useProfileStore(state => state.achievements);
  const loadProfile = useProfileStore(state => state.loadProfile);
  const loaded = useProfileStore(state => state.loaded);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const unlockedCount = achievements.filter(a => a.unlockedAt !== undefined).length;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/play"
          className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold">成就图鉴</h2>
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
  );
}
