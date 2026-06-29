import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Clock, GraduationCap, Mail } from 'lucide-react';
import { getTodayCurriculumDay } from '../services/curriculumData';
import { useProfileStore } from '../stores/profileStore';
import { useParentStore } from '../stores/parentStore';
import { useGameStore, computeRegionProgress } from '../stores/gameStore';
import { useEconomyStore } from '../stores/economyStore';
import { useHealthGuard } from '../hooks/useHealthGuard';
import { nextLevelExp } from '../services/battleLogic';

const LEFT_ENTRIES = [
  { to: '/play/shop', label: '商城', icon: '🛍️', gradient: 'from-pink-400 to-rose-500' },
  { to: '/play/rewards', label: '奖励', icon: '⭐', gradient: 'from-amber-300 to-orange-400' },
  { to: '/play/tasks', label: '任务', icon: '⚡', gradient: 'from-sky-400 to-blue-500' },
  { to: '/play/achievements', label: '成就', icon: '🏆', gradient: 'from-yellow-300 to-amber-500' },
  { to: '/play/arcade', label: '副本', icon: '🎮', gradient: 'from-violet-400 to-fuchsia-500' }
];

const RIGHT_ENTRIES = [
  { to: '/play/tasks', label: '任务', icon: '📋', gradient: 'from-red-400 to-rose-500', badge: 3 },
  { to: '/play/wrong', label: '错题', icon: '📖', gradient: 'from-amber-300 to-orange-400' },
  { to: '/play/achievements', label: '排行', icon: '🏅', gradient: 'from-purple-400 to-indigo-500' },
  { to: '/play/shop', label: '背包', icon: '🎒', gradient: 'from-emerald-400 to-teal-500' },
  { to: '/play/equipment', label: '装备', icon: '⚙️', gradient: 'from-blue-400 to-cyan-500' }
];

const SUBJECT_META = {
  chinese: { label: '语文', color: 'from-emerald-400 to-green-500' },
  math: { label: '数学', color: 'from-blue-400 to-indigo-500' },
  english: { label: '英语', color: 'from-amber-300 to-yellow-500' }
};

export function PlayHome() {
  const profile = useProfileStore(state => state.profile);
  const dailyStats = useProfileStore(state => state.dailyStats);
  const progress = useGameStore(state => state.progress);
  const loaded = useGameStore(state => state.loaded);
  const loadProgress = useGameStore(state => state.loadProgress);

  const settings = useParentStore(state => state.settings);
  const parentLoaded = useParentStore(state => state.loaded);
  const loadParentData = useParentStore(state => state.loadParentData);

  const inventory = useEconomyStore(state => state.inventory);
  const loadInventory = useEconomyStore(state => state.loadInventory);

  const { isRestModeActive } = useHealthGuard();
  const navigate = useNavigate();

  useEffect(() => {
    loadProgress();
    loadInventory();
    if (!parentLoaded) {
      loadParentData();
    }
  }, [loadProgress, loadInventory, loadParentData, parentLoaded]);

  if (!profile) return null;

  const totalPassed = progress.filter(p => p.status === 'passed').length;
  const expPercent = Math.round((profile.exp / nextLevelExp(profile.level)) * 100);

  const starLimit = settings?.dailyStarLimit ?? 100;
  const minuteLimit = settings?.dailyMinuteLimit ?? 45;
  const starsEarned = dailyStats?.starsEarned ?? 0;
  const minutesPlayed = dailyStats?.minutesPlayed ?? 0;

  const todayDay = getTodayCurriculumDay(settings?.curriculum);
  const nextStage = progress.find(p => p.status !== 'passed');

  return (
    <div className="scene-planet-home relative -mx-2 -mt-2 min-h-full overflow-hidden rounded-t-3xl p-3 text-white sm:-mx-4 sm:-mt-4 sm:p-4">
      <div className="planet-stars pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative flex min-h-full flex-col">
        {/* 顶部栏 */}
        <div className="flex items-center gap-3 pt-2">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 text-2xl shadow-lg shadow-orange-400/40 ring-2 ring-white/30">
            👩‍🚀
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-1.5 py-0.5 text-[8px] font-bold text-white ring-1 ring-white/30">
              星球学员
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex gap-1.5">
              <div className="flex flex-1 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px]">🪙</span>
                {profile.stars}
              </div>
              <div className="flex flex-1 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[10px]">💎</span>
                {inventory.reduce((sum: number, it) => sum + (it.count ?? 0), 0)}
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="flex flex-1 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                {starsEarned}/{starLimit}
              </div>
              <div className="flex flex-1 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <Clock className="h-3 w-3 text-sky-300" />
                {minutesPlayed}/{minuteLimit}分
              </div>
            </div>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 ring-1 ring-white/20 backdrop-blur-sm">
            <Mail className="h-5 w-5" />
          </button>
        </div>

        {/* 关卡横幅 */}
        <div className="mt-3 rounded-2xl border border-white/20 bg-gradient-to-r from-violet-500/90 to-pink-500/90 p-3 shadow-lg shadow-violet-500/30 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white drop-shadow">
                {todayDay ? `第 ${todayDay.dayIndex + 1} 天 · 知识星云` : '知识星云'}
              </h2>
              <p className="text-xs text-white/80">
                {nextStage ? `下一关：${SUBJECT_META[nextStage.subject].label} ${nextStage.stageId}` : '全部通关！'}
              </p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <span
                  key={i}
                  className={['h-2.5 w-2.5 rounded-full border border-white/40', i < totalPassed ? 'bg-amber-300 shadow shadow-amber-300/60' : 'bg-white/20'].join(' ')}
                />
              ))}
            </div>
          </div>
        </div>

        {isRestModeActive && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-indigo-300/30 bg-indigo-900/50 p-3 text-indigo-100 backdrop-blur-md">
            <span className="text-2xl">🌙</span>
            <p className="font-bold">现在是休息时间，明天见 👋</p>
          </div>
        )}

        {/* 中央舞台 */}
        <div className="relative mt-3 flex min-h-[260px] flex-1 items-stretch gap-2">
          {/* 左侧入口 */}
          <div className="flex w-14 flex-col justify-center gap-2.5">
            {LEFT_ENTRIES.map(entry => (
              <Link
                key={entry.label + 'L'}
                to={entry.to}
                className="group flex flex-col items-center gap-1"
              >
                <div className={['flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-xl shadow-lg ring-1 ring-white/30 transition group-hover:scale-110', entry.gradient].join(' ')}>
                  {entry.icon}
                </div>
                <span className="text-[10px] font-bold text-white/90 drop-shadow">{entry.label}</span>
              </Link>
            ))}
          </div>

          {/* 中央视觉 */}
          <div className="relative flex flex-1 flex-col items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-48 w-48 rounded-full bg-gradient-to-br from-violet-400 via-purple-600 to-indigo-800 shadow-[0_0_60px_rgba(124,58,237,0.5)]">
                <div
                  className="absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px] border-amber-300/60 shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                  style={{ transform: 'translate(-50%, -50%) rotate(-20deg) scaleY(0.35)' }}
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl drop-shadow-2xl">🪐</div>
              </div>
            </div>
            <div className="absolute left-4 top-4 animate-bounce text-2xl">👾</div>
            <div className="absolute right-4 top-8 animate-bounce text-2xl" style={{ animationDelay: '0.5s' }}>🤖</div>
            <div className="absolute bottom-20 left-6 animate-bounce text-2xl" style={{ animationDelay: '1s' }}>👻</div>

            <div className="absolute bottom-14 rounded-2xl border border-white/15 bg-black/40 px-4 py-2 text-center backdrop-blur-md">
              <p className="text-xs font-bold text-amber-300">Lv.{profile.level} 小学霸</p>
              <p className="text-[10px] text-white/70">{profile.exp}/{nextLevelExp(profile.level)} EXP</p>
              <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${expPercent}%` }} />
              </div>
            </div>

            <button
              onClick={() => navigate('/play/map')}
              className="absolute bottom-0 rounded-full border-4 border-amber-100 bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 px-10 py-3 text-lg font-black text-amber-900 shadow-[0_10px_30px_rgba(245,158,11,0.5)] transition active:scale-95"
            >
              🚀 去闯关
            </button>
          </div>

          {/* 右侧入口 */}
          <div className="flex w-14 flex-col justify-center gap-2.5">
            {RIGHT_ENTRIES.map(entry => (
              <Link
                key={entry.label + 'R'}
                to={entry.to}
                className="group flex flex-col items-center gap-1"
              >
                <div className={['relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-xl shadow-lg ring-1 ring-white/30 transition group-hover:scale-110', entry.gradient].join(' ')}>
                  {entry.icon}
                  {entry.badge && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-1 ring-white">
                      {entry.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/90 drop-shadow">{entry.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 今日课程 */}
        {todayDay && (
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/10 p-3 shadow-lg backdrop-blur-md">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-400/30">
                <GraduationCap className="h-4 w-4 text-teal-200" />
              </div>
              <h3 className="text-sm font-bold text-white">今日课程</h3>
            </div>
            <div className="space-y-1.5">
              {todayDay.lessons.slice(0, 3).map((lesson, idx) => {
                const meta = SUBJECT_META[lesson.subject];
                return (
                  <div key={idx} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-1.5">
                    <span className={['rounded-md bg-gradient-to-r px-2 py-0.5 text-[10px] font-bold text-white', meta.color].join(' ')}>
                      {meta.label}
                    </span>
                    <span className="mx-2 flex-1 truncate text-xs text-white/90">{lesson.topic}</span>
                    <span className="text-[10px] text-indigo-200">{lesson.questionCount} 题</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 学科进度 */}
        {loaded && (
          <div className="mt-3 rounded-3xl border border-white/10 bg-white/10 p-3 backdrop-blur-md">
            <h3 className="mb-2 text-sm font-bold text-white">学科进度</h3>
            <div className="space-y-2">
              {(['chinese', 'math', 'english'] as const).map(subject => {
                const { passed, total } = computeRegionProgress(progress, subject);
                const meta = SUBJECT_META[subject];
                const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
                return (
                  <div key={subject}>
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <span className="text-white/90">{meta.label}</span>
                      <span className="text-indigo-200">{passed}/{total}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                      <div className={['h-full rounded-full bg-gradient-to-r', meta.color].join(' ')} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 底部导航占位 */}
        <div className="h-16" />
      </div>
    </div>
  );
}
