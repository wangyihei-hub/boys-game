import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, Star, Trophy, Zap, BookOpen, Ticket, ShoppingBag, Clock } from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';
import { useParentStore } from '../stores/parentStore';
import { useGameStore, computeRegionProgress } from '../stores/gameStore';
import { useHealthGuard } from '../hooks/useHealthGuard';
import { nextLevelExp } from '../services/battleLogic';

function limitBarColor(percent: number) {
  if (percent >= 100) return 'bg-red-500';
  if (percent >= 80) return 'bg-amber-500';
  return 'bg-green-500';
}

export function PlayHome() {
  const profile = useProfileStore(state => state.profile);
  const dailyStats = useProfileStore(state => state.dailyStats);
  const progress = useGameStore(state => state.progress);
  const loaded = useGameStore(state => state.loaded);
  const loadProgress = useGameStore(state => state.loadProgress);

  const settings = useParentStore(state => state.settings);
  const parentLoaded = useParentStore(state => state.loaded);
  const loadParentData = useParentStore(state => state.loadParentData);

  const { isRestModeActive } = useHealthGuard();

  useEffect(() => {
    loadProgress();
    if (!parentLoaded) {
      loadParentData();
    }
  }, [loadProgress, loadParentData, parentLoaded]);

  if (!profile) return null;

  const totalPassed = progress.filter(p => p.status === 'passed').length;
  const totalStages = progress.length;
  const expPercent = Math.round((profile.exp / nextLevelExp(profile.level)) * 100);

  const starLimit = settings?.dailyStarLimit ?? 100;
  const minuteLimit = settings?.dailyMinuteLimit ?? 45;
  const starsEarned = dailyStats?.starsEarned ?? 0;
  const minutesPlayed = dailyStats?.minutesPlayed ?? 0;
  const starPercent = Math.min(100, Math.round((starsEarned / starLimit) * 100));
  const minutePercent = Math.min(100, Math.round((minutesPlayed / minuteLimit) * 100));

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

      {isRestModeActive && (
        <div className="card flex items-center gap-3 bg-indigo-50 text-indigo-700">
          <span className="text-2xl">🌙</span>
          <p className="font-bold">现在是休息时间，明天见 👋</p>
        </div>
      )}

      <div className="card space-y-3">
        <h3 className="text-sm font-bold text-slate-700">今日使用概览</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            <span className="text-xs font-semibold text-slate-600">今日星星</span>
            <span className="ml-auto text-xs font-bold text-slate-700">
              {starsEarned}/{starLimit}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={['h-full rounded-full', limitBarColor(starPercent)].join(' ')}
              style={{ width: `${starPercent}%` }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold text-slate-600">今日时长</span>
            <span className="ml-auto text-xs font-bold text-slate-700">
              {minutesPlayed}/{minuteLimit} 分钟
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={['h-full rounded-full', limitBarColor(minutePercent)].join(' ')}
              style={{ width: `${minutePercent}%` }}
            />
          </div>
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

        <Link
          to="/play/achievements"
          className="card flex flex-col items-center gap-2 text-center transition hover:bg-amber-50 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Trophy className="h-6 w-6" />
          </div>
          <span className="font-bold text-slate-700">成就图鉴</span>
          <span className="text-xs text-slate-500">查看里程碑</span>
        </Link>

        <Link
          to="/play/tasks"
          className="card flex flex-col items-center gap-2 text-center transition hover:bg-purple-50 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <Zap className="h-6 w-6" />
          </div>
          <span className="font-bold text-slate-700">每日任务</span>
          <span className="text-xs text-slate-500">今日挑战</span>
        </Link>

        <Link
          to="/play/rewards"
          className="card flex flex-col items-center gap-2 text-center transition hover:bg-pink-50 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
            🎁
          </div>
          <span className="font-bold text-slate-700">奖励兑换</span>
          <span className="text-xs text-slate-500">{profile.stars} 颗星星</span>
        </Link>

        <Link
          to="/play/wrong"
          className="card flex flex-col items-center gap-2 text-center transition hover:bg-red-50 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <span className="font-bold text-slate-700">错题本</span>
          <span className="text-xs text-slate-500">复习巩固</span>
        </Link>

        <Link
          to="/play/lottery"
          className="card flex flex-col items-center gap-2 text-center transition hover:bg-indigo-50 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Ticket className="h-6 w-6" />
          </div>
          <span className="font-bold text-slate-700">周末抽奖</span>
          <span className="text-xs text-slate-500">试试手气</span>
        </Link>

        <Link
          to="/play/shop"
          className="card flex flex-col items-center gap-2 text-center transition hover:bg-cyan-50 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <span className="font-bold text-slate-700">虚拟商城</span>
          <span className="text-xs text-slate-500">装扮基地</span>
        </Link>
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
