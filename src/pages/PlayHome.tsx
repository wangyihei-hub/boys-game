import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, Star, Trophy, Zap } from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';
import { useGameStore, computeRegionProgress } from '../stores/gameStore';
import { nextLevelExp } from '../services/battleLogic';

export function PlayHome() {
  const profile = useProfileStore(state => state.profile);
  const progress = useGameStore(state => state.progress);
  const loaded = useGameStore(state => state.loaded);
  const loadProgress = useGameStore(state => state.loadProgress);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  if (!profile) return null;

  const totalPassed = progress.filter(p => p.status === 'passed').length;
  const totalStages = progress.length;
  const expPercent = Math.round((profile.exp / nextLevelExp(profile.level)) * 100);

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-4xl">
          🧒
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{profile.nickname}</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
              Lv.{profile.level}
            </span>
            <span className="text-sm text-slate-500">{profile.exp}/{nextLevelExp(profile.level)} EXP</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-5 w-5 fill-current" />
            <span className="text-xl font-bold">{profile.stars}</span>
          </div>
          <p className="text-xs text-slate-500">星星</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/play/map"
          className="card flex flex-col items-center gap-2 text-center transition hover:bg-indigo-50 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
            <Map className="h-6 w-6" />
          </div>
          <span className="font-bold text-slate-700">世界地图</span>
          <span className="text-xs text-slate-500">已通关 {totalPassed}/{totalStages}</span>
        </Link>

        <div className="card flex flex-col items-center gap-2 text-center opacity-60">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Trophy className="h-6 w-6" />
          </div>
          <span className="font-bold text-slate-700">成就图鉴</span>
          <span className="text-xs text-slate-500">即将开放</span>
        </div>

        <div className="card flex flex-col items-center gap-2 text-center opacity-60">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <Zap className="h-6 w-6" />
          </div>
          <span className="font-bold text-slate-700">每日任务</span>
          <span className="text-xs text-slate-500">即将开放</span>
        </div>

        <div className="card flex flex-col items-center gap-2 text-center opacity-60">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
            🎁
          </div>
          <span className="font-bold text-slate-700">奖励兑换</span>
          <span className="text-xs text-slate-500">即将开放</span>
        </div>
      </div>

      {loaded && (
        <div className="card">
          <h3 className="mb-3 text-sm font-bold text-slate-700">学科进度</h3>
          <div className="space-y-2">
            {(['chinese', 'math', 'english'] as const).map(subject => {
              const { passed, total } = computeRegionProgress(progress, subject);
              const labels = { chinese: '语文', math: '数学', english: '英语' };
              const colors = { chinese: 'bg-green-500', math: 'bg-blue-500', english: 'bg-yellow-500' };
              const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
              return (
                <div key={subject}>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
                    <span>{labels[subject]}</span>
                    <span>{passed}/{total}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={['h-full rounded-full', colors[subject]].join(' ')}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
