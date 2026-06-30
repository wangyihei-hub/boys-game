import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Zap,
  Sword,
  Cat,
  Trophy,
  Backpack,
  ClipboardList,
  Ticket,
  Settings
} from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';
import { useGameStore, computeCurrentLevel } from '../stores/gameStore';
import { useEconomyStore } from '../stores/economyStore';
import { useHealthGuard } from '../hooks/useHealthGuard';
import { refreshStamina, MAX_STAMINA } from '../services/staminaLogic';
import { getLevelTitle } from '../data/v3';
import type { Subject } from '../types';
import { AvatarBadge } from '../components/play/AvatarBadge';
import { StatusCapsule } from '../components/play/StatusCapsule';
import { ChapterNode } from '../components/play/ChapterNode';
import { IconButton } from '../components/play/IconButton';
import { ProfileModal } from '../components/play/ProfileModal';

const SUBJECT_META: Record<Subject, { label: string; bg: string }> = {
  chinese: { label: '语文', bg: 'from-emerald-400 to-green-500' },
  math: { label: '数学', bg: 'from-blue-400 to-indigo-500' },
  english: { label: '英语', bg: 'from-amber-300 to-yellow-500' }
};

export function PlayHome() {
  const profile = useProfileStore(state => state.profile);
  const refreshStaminaNow = useProfileStore(state => state.refreshStaminaNow);

  const progress = useGameStore(state => state.progress);
  const loadProgress = useGameStore(state => state.loadProgress);

  const inventory = useEconomyStore(state => state.inventory);
  const loadInventory = useEconomyStore(state => state.loadInventory);

  const { isRestModeActive } = useHealthGuard();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    loadProgress();
    loadInventory();
    refreshStaminaNow();
  }, [loadProgress, loadInventory, refreshStaminaNow]);

  const refreshedProfile = useMemo(() => {
    if (!profile) return null;
    return refreshStamina(profile, Date.now());
  }, [profile]);

  if (!refreshedProfile) return null;

  const rawCurrentLevel = computeCurrentLevel(progress) || refreshedProfile.currentLevelNumber;
  const currentLevel = Math.min(rawCurrentLevel, 100);
  const chapterTitle = getLevelTitle(currentLevel);

  const currentSubject = useMemo<Subject>(() => {
    const subjects: Subject[] = ['chinese', 'math', 'english'];
    for (const subject of subjects) {
      const sp = progress.find(p => p.subject === subject && p.levelNumber === currentLevel);
      if (sp?.status === 'unlocked') return subject;
    }
    return subjects[0];
  }, [progress, currentLevel]);

  const ctaMeta = SUBJECT_META[currentSubject];
  const inventoryCount = inventory.reduce((sum, it) => sum + (it.count ?? 0), 0);

  return (
    <div className="relative flex min-h-full flex-col p-4">
      {/* 营地装饰 */}
      <div className="camp-tent" />
      <div className="camp-tree" style={{ right: '12%', borderBottomColor: '#15803d' }} />
      <div className="camp-fire" />

      {/* 顶部状态条 */}
      <div className="relative z-10 flex items-center justify-between">
        <AvatarBadge
          emoji={refreshedProfile.avatar ?? '🧒'}
          level={refreshedProfile.level}
          onClick={() => setProfileOpen(true)}
        />
        <div className="flex items-center gap-2">
          <StatusCapsule
            icon={Zap}
            value={`${refreshedProfile.stamina}/${MAX_STAMINA}`}
            iconClass="fill-yellow-400 text-yellow-400"
          />
          <StatusCapsule
            icon={Star}
            value={refreshedProfile.stars}
            iconClass="fill-yellow-400 text-yellow-400"
          />
        </div>
      </div>

      {isRestModeActive && (
        <div className="relative z-10 mt-3 flex items-center gap-3 rounded-2xl border border-indigo-300/30 bg-indigo-50 p-3 text-indigo-800">
          <span className="text-2xl">🌙</span>
          <p className="font-bold">现在是休息时间，明天见 👋</p>
        </div>
      )}

      {/* 中央章节卡 */}
      <div className="relative z-10 mx-auto mt-8 w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="text-center text-xl font-black text-slate-800">
          第 {currentLevel} 关
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">{chapterTitle}</p>
        <div className="relative flex items-center justify-between px-4">
          <div className="absolute left-8 right-8 top-1/2 -z-10 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
          {(['chinese', 'math', 'english'] as Subject[]).map(subject => {
            const sp = progress.find(p => p.subject === subject && p.levelNumber === currentLevel);
            const status =
              sp?.status === 'passed' ? 'passed' : sp?.status === 'locked' ? 'locked' : 'current';
            return <ChapterNode key={subject} subject={subject} status={status} />;
          })}
        </div>
        <button
          onClick={() => navigate(`/play/battle/${currentSubject}/${currentLevel}`)}
          className={[
            'mt-8 w-full rounded-2xl py-4 text-lg font-black text-white shadow-lg transition active:scale-95 bg-gradient-to-r',
            ctaMeta.bg
          ].join(' ')}
        >
          ▶ 开始闯关
        </button>
      </div>

      {/* 两侧快捷入口 */}
      <div className="relative z-10 mt-8 flex flex-1 justify-between">
        <div className="flex flex-col gap-3">
          <IconButton icon={Sword} label="装备" onClick={() => navigate('/play/equipment')} />
          <IconButton icon={Cat} label="宠物" onClick={() => navigate('/play/pet')} />
          <IconButton icon={Trophy} label="成就" onClick={() => navigate('/play/achievements')} />
        </div>
        <div className="flex flex-col gap-3">
          <IconButton
            icon={Backpack}
            label="背包"
            onClick={() => navigate('/play/shop')}
            badge={inventoryCount}
          />
          <IconButton icon={ClipboardList} label="任务" onClick={() => navigate('/play/tasks')} />
          <IconButton icon={Ticket} label="抽奖" onClick={() => navigate('/play/lottery')} />
          <IconButton icon={Settings} label="设置" onClick={() => setProfileOpen(true)} />
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
