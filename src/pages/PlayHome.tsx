import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, Star, Trophy, Zap, BookOpen, Ticket, ShoppingBag, Clock, GraduationCap, Gamepad2 } from 'lucide-react';
import { getTodayCurriculumDay } from '../services/curriculumData';
import { useProfileStore } from '../stores/profileStore';
import { useParentStore } from '../stores/parentStore';
import { useGameStore, computeRegionProgress } from '../stores/gameStore';
import { useEconomyStore } from '../stores/economyStore';
import { useHealthGuard } from '../hooks/useHealthGuard';
import { nextLevelExp } from '../services/battleLogic';
import { getEquipmentDef } from '../services/equipmentLogic';
import { getPetInstance } from '../services/petLogic';
import type { EquipmentSlot } from '../types';

function limitBarColor(percent: number) {
  if (percent >= 100) return 'bg-red-500';
  if (percent >= 80) return 'bg-amber-500';
  return 'bg-green-500';
}

const ENTRIES = [
  { to: '/play/map', label: '世界地图', desc: '闯关冒险', icon: Map, color: 'bg-green-100 text-green-600' },
  { to: '/play/arcade', label: '副本乐园', desc: '趣味挑战', icon: Gamepad2, color: 'bg-purple-100 text-purple-600' },
  { to: '/play/achievements', label: '成就图鉴', desc: '里程碑', icon: Trophy, color: 'bg-amber-100 text-amber-600' },
  { to: '/play/tasks', label: '每日任务', desc: '今日挑战', icon: Zap, color: 'bg-blue-100 text-blue-600' },
  { to: '/play/rewards', label: '奖励兑换', desc: '星星换礼', icon: Star, color: 'bg-pink-100 text-pink-600' },
  { to: '/play/wrong', label: '错题本', desc: '复习巩固', icon: BookOpen, color: 'bg-red-100 text-red-600' },
  { to: '/play/lottery', label: '周末抽奖', desc: '试试手气', icon: Ticket, color: 'bg-indigo-100 text-indigo-600' },
  { to: '/play/shop', label: '虚拟商城', desc: '装扮基地', icon: ShoppingBag, color: 'bg-cyan-100 text-cyan-600' },
  { to: '/play/equipment', label: '我的装备', desc: '强化战力', icon: () => '🛡️', color: 'bg-slate-100 text-slate-600', emoji: true },
  { to: '/play/pet', label: '我的宠物', desc: '培养伙伴', icon: () => '🐱', color: 'bg-orange-100 text-orange-600', emoji: true }
];

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

  useEffect(() => {
    loadProgress();
    loadInventory();
    if (!parentLoaded) {
      loadParentData();
    }
  }, [loadProgress, loadInventory, loadParentData, parentLoaded]);

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

  const todayDay = getTodayCurriculumDay(settings?.curriculum);

  return (
    <div className="scene-camp -mx-2 -mt-2 min-h-full rounded-t-3xl p-3 sm:-mx-4 sm:-mt-4 sm:p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="glass-card flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-4xl shadow-sm">
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
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {(
                [
                  ['weapon', '⚔️'],
                  ['shield', '🛡️'],
                  ['staff', '🪄'],
                  ['shoes', '👟']
                ] as [EquipmentSlot, string][]
              ).map(([slot, placeholder]) => {
                const equippedId = profile.equippedItems[slot];
                const def = equippedId ? getEquipmentDef(equippedId) : undefined;
                return (
                  <span
                    key={slot}
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-lg text-sm',
                      def ? 'bg-indigo-100' : 'bg-slate-100 text-slate-300'
                    ].join(' ')}
                    title={def?.name ?? '空'}
                  >
                    {def?.icon ?? placeholder}
                  </span>
                );
              })}
              {(() => {
                const activePet = getPetInstance(inventory, profile.activePet);
                return (
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-sm"
                    title={activePet ? '出战宠物' : '无宠物'}
                  >
                    {activePet?.def.icon ?? '🐾'}
                  </span>
                );
              })()}
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
          <div className="glass-card flex items-center gap-3 bg-indigo-50/80 text-indigo-700">
            <span className="text-2xl">🌙</span>
            <p className="font-bold">现在是休息时间，明天见 👋</p>
          </div>
        )}

        <div className="glass-card space-y-3">
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

        {todayDay && (
          <div className="glass-card">
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-700">今日课程（第 {todayDay.dayIndex + 1} 天）</h3>
            </div>
            <div className="space-y-2">
              {todayDay.lessons.map((lesson, idx) => {
                const subjectLabels = { chinese: '语文', math: '数学', english: '英语' };
                const colors = { chinese: 'bg-green-100 text-green-700', math: 'bg-blue-100 text-blue-700', english: 'bg-amber-100 text-amber-700' };
                return (
                  <div key={idx} className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2">
                    <span className={['rounded-md px-2 py-0.5 text-xs font-semibold', colors[lesson.subject]].join(' ')}>
                      {subjectLabels[lesson.subject]}
                    </span>
                    <span className="text-sm text-slate-700">{lesson.topic}</span>
                    <span className="text-xs text-slate-400">{lesson.questionCount} 题</span>
                  </div>
                );
              })}
            </div>
            <Link
              to="/play/map"
              className="btn-primary mt-3 block w-full text-center text-sm"
            >
              去世界地图闯关
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ENTRIES.map(entry => {
            const Icon = entry.icon;
            return (
              <Link
                key={entry.to}
                to={entry.to}
                className="glass-card flex flex-col items-center gap-2 text-center transition hover:scale-[1.02] hover:bg-white/80 active:scale-95"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${entry.color}`}>
                  {entry.emoji ? <span className="text-2xl"><Icon /></span> : <Icon className="h-6 w-6" />}
                </div>
                <span className="font-bold text-slate-700">{entry.label}</span>
                <span className="text-xs text-slate-500">{entry.desc}</span>
                {entry.to === '/play/map' && (
                  <span className="text-xs font-semibold text-green-600">{totalPassed}/{totalStages}</span>
                )}
              </Link>
            );
          })}
        </div>

        {loaded && (
          <div className="glass-card">
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
    </div>
  );
}
