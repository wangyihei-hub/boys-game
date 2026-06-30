import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Zap, Trophy, Gamepad2, BookOpen, ShoppingBag, Gift, ClipboardList, Flame } from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';
import { useParentStore } from '../stores/parentStore';
import { useGameStore, computeSubjectProgress, computeCurrentLevel } from '../stores/gameStore';
import { useEconomyStore } from '../stores/economyStore';
import { useHealthGuard } from '../hooks/useHealthGuard';
import { nextLevelExp } from '../services/battleLogic';
import { refreshStamina, MAX_STAMINA, DAILY_PASS_LIMIT, getStaminaRecoveryText } from '../services/staminaLogic';
import { getV3Level } from '../data/v3';
import type { Subject } from '../types';

const SUBJECT_META: Record<Subject, { label: string; color: string; bg: string; icon: string }> = {
  chinese: { label: '语文', color: 'text-emerald-700', bg: 'from-emerald-400 to-green-500', icon: '📚' },
  math: { label: '数学', color: 'text-blue-700', bg: 'from-blue-400 to-indigo-500', icon: '🔢' },
  english: { label: '英语', color: 'text-amber-700', bg: 'from-amber-300 to-yellow-500', icon: '🔤' }
};

const MODULES = [
  { to: '/play/wrong', label: '错题本', icon: BookOpen, gradient: 'from-rose-400 to-red-500' },
  { to: '/play/shop', label: '商城', icon: ShoppingBag, gradient: 'from-emerald-400 to-teal-500' },
  { to: '/play/lottery', label: '抽奖', icon: Gift, gradient: 'from-violet-400 to-fuchsia-500' },
  { to: '/play/tasks', label: '每日任务', icon: ClipboardList, gradient: 'from-sky-400 to-blue-500' },
  { to: '/play/achievements', label: '成就', icon: Trophy, gradient: 'from-yellow-300 to-amber-500' },
  { to: '/play/arcade', label: '副本', icon: Gamepad2, gradient: 'from-indigo-400 to-purple-500' }
];

export function PlayHome() {
  const profile = useProfileStore(state => state.profile);
  const dailyStats = useProfileStore(state => state.dailyStats);
  const refreshStaminaNow = useProfileStore(state => state.refreshStaminaNow);
  const progress = useGameStore(state => state.progress);
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
    refreshStaminaNow();
    if (!parentLoaded) {
      loadParentData();
    }
  }, [loadProgress, loadInventory, refreshStaminaNow, loadParentData, parentLoaded]);

  const refreshedProfile = useMemo(() => {
    if (!profile) return null;
    return refreshStamina(profile, Date.now());
  }, [profile]);

  if (!refreshedProfile) return null;

  const currentLevel = computeCurrentLevel(progress) || refreshedProfile.currentLevelNumber;
  const expPercent = Math.round((refreshedProfile.exp / nextLevelExp(refreshedProfile.level)) * 100);

  const starLimit = settings?.dailyStarLimit ?? 100;
  const starsEarned = dailyStats?.starsEarned ?? 0;
  const inventoryCount = inventory.reduce((sum: number, it) => sum + (it.count ?? 0), 0);

  const todayPassCount = refreshedProfile.dailyPassCount ?? 0;
  const passDate = refreshedProfile.dailyPassDate;
  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyPassDisplay = passDate === todayKey ? todayPassCount : 0;

  return (
    <div className="scene-planet-home relative -mx-2 -mt-2 min-h-full overflow-hidden rounded-t-3xl p-3 text-white sm:-mx-4 sm:-mt-4 sm:p-4">
      <div className="planet-stars pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative flex min-h-full flex-col">
        {/* 顶部状态条 */}
        <div className="flex items-center gap-3 pt-2">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 text-2xl shadow-lg shadow-orange-400/40 ring-2 ring-white/30">
            👩‍🚀
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-1.5 py-0.5 text-[8px] font-bold text-white ring-1 ring-white/30">
              Lv.{refreshedProfile.level}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex gap-1.5">
              <div className="flex flex-1 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px]">🪙</span>
                {refreshedProfile.stars}
              </div>
              <div className="flex flex-1 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <ShoppingBag className="h-3 w-3 text-emerald-300" />
                {inventoryCount}
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="flex flex-1 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm" title={getStaminaRecoveryText(refreshedProfile.stamina)}>
                <Zap className={['h-3 w-3 fill-yellow-300 text-yellow-300', refreshedProfile.stamina > 0 ? '' : 'text-slate-400 fill-slate-400'].join(' ')} />
                {refreshedProfile.stamina}/{MAX_STAMINA}
              </div>
              <div className="flex flex-1 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <Flame className="h-3 w-3 text-orange-400" />
                今日 {dailyPassDisplay}/{DAILY_PASS_LIMIT}
              </div>
            </div>
          </div>
        </div>

        {isRestModeActive && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-indigo-300/30 bg-indigo-900/50 p-3 text-indigo-100 backdrop-blur-md">
            <span className="text-2xl">🌙</span>
            <p className="font-bold">现在是休息时间，明天见 👋</p>
          </div>
        )}

        {/* 三科关卡卡片 */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(['chinese', 'math', 'english'] as Subject[]).map(subject => {
            const meta = SUBJECT_META[subject];
            const level = getV3Level(subject, currentLevel);
            const subjectProgress = progress.find(p => p.subject === subject && p.levelNumber === currentLevel);
            const passed = subjectProgress?.status === 'passed';
            const locked = subjectProgress?.status === 'locked';
            const { passed: totalPassed } = computeSubjectProgress(progress, subject);

            return (
              <button
                key={subject}
                disabled={locked || passed}
                onClick={() => navigate(`/play/battle/${subject}/${currentLevel}`)}
                className={[
                  'relative flex flex-col items-center rounded-2xl border p-3 text-center shadow-lg transition active:scale-95',
                  passed
                    ? 'border-white/10 bg-slate-700/60 text-slate-300'
                    : locked
                      ? 'border-white/5 bg-slate-800/50 text-slate-500'
                      : 'border-white/20 bg-gradient-to-b from-white/15 to-white/5 text-white hover:scale-[1.02]'
                ].join(' ')}
              >
                <div className={['mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-xl shadow-md', meta.bg].join(' ')}>
                  {meta.icon}
                </div>
                <span className="text-xs font-bold">{meta.label}</span>
                <span className="mt-0.5 text-lg font-black">L{String(currentLevel).padStart(3, '0')}</span>
                {level && (
                  <span className="mt-1 line-clamp-2 text-[10px] leading-tight text-white/70">{level.topic}</span>
                )}
                <div className="mt-2 text-[10px] font-semibold">
                  {passed ? (
                    <span className="rounded-full bg-emerald-500/30 px-1.5 py-0.5 text-emerald-100">已完成</span>
                  ) : locked ? (
                    <span>🔒 未解锁</span>
                  ) : (
                    <span className="rounded-full bg-amber-300/30 px-1.5 py-0.5 text-amber-100">挑战</span>
                  )}
                </div>
                <div className="mt-2 w-full">
                  <div className="flex justify-between text-[9px] text-white/60">
                    <span>进度</span>
                    <span>{totalPassed}/100</span>
                  </div>
                  <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-white/15">
                    <div className={['h-full rounded-full bg-gradient-to-r', meta.bg].join(' ')} style={{ width: `${totalPassed}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 模块入口 */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {MODULES.map(entry => {
            const Icon = entry.icon;
            return (
              <Link
                key={entry.to}
                to={entry.to}
                className="group flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/15 active:scale-95"
              >
                <div className={['flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-lg shadow-md ring-1 ring-white/20 transition group-hover:scale-110', entry.gradient].join(' ')}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-[11px] font-bold text-white/90">{entry.label}</span>
              </Link>
            );
          })}
        </div>

        {/* 今日统计 */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
              <span className="text-xs font-bold">今日星星</span>
            </div>
            <span className="text-xs font-semibold text-indigo-200">{starsEarned}/{starLimit}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-500" style={{ width: `${Math.min(100, (starsEarned / starLimit) * 100)}%` }} />
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-white/70">
            <span>EXP {refreshedProfile.exp}/{nextLevelExp(refreshedProfile.level)}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${expPercent}%` }} />
            </div>
          </div>
        </div>

        {/* 底部占位 */}
        <div className="h-4" />
      </div>
    </div>
  );
}
