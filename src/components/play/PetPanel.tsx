import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { BattleRecord, DailyTask, InventoryItem } from '../../types';
import { useProfileStore } from '../../stores/profileStore';
import { useEconomyStore } from '../../stores/economyStore';
import {
  checkEvolution,
  computePetSkillEffect,
  getPetDef,
  getPetInstance
} from '../../services/petLogic';
import { getAllBattleRecords, getAllDailyTasks } from '../../db';
import { PetAvatar } from './PetAvatar';

export function PetPanel() {
  const profile = useProfileStore(state => state.profile);
  const setActivePet = useProfileStore(state => state.setActivePet);
  const feedPet = useProfileStore(state => state.feedPet);
  const evolvePet = useProfileStore(state => state.evolvePet);

  const inventory = useEconomyStore(state => state.inventory);
  const loadInventory = useEconomyStore(state => state.loadInventory);

  const [battleRecords, setBattleRecords] = useState<BattleRecord[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    async function loadData() {
      const [records, tasks] = await Promise.all([
        getAllBattleRecords(),
        getAllDailyTasks()
      ]);
      setBattleRecords(records);
      setDailyTasks(tasks);
    }
    loadData();
  }, []);

  if (!profile) return null;

  const activePetInstance = getPetInstance(inventory, profile.activePet);
  const ownedPets = inventory.filter(item => item.type === 'pet' && item.count > 0);
  const foodCount = inventory
    .filter(item => item.type === 'pet_food')
    .reduce((sum, item) => sum + item.count, 0);

  async function handleSetActive(petItem: InventoryItem) {
    await setActivePet(petItem.id);
  }

  async function handleFeed() {
    if (!activePetInstance) return;
    const result = await feedPet(activePetInstance.item.id);
    if (result.success) {
      await loadInventory();
    }
  }

  async function handleEvolve() {
    if (!activePetInstance) return;
    const result = await evolvePet(activePetInstance.item.id);
    if (result.success) {
      await loadInventory();
      const [records, tasks] = await Promise.all([
        getAllBattleRecords(),
        getAllDailyTasks()
      ]);
      setBattleRecords(records);
      setDailyTasks(tasks);
    }
  }

  function petIconAndName(petItem: InventoryItem): { icon: string; name: string; stage: number } {
    const def = getPetDef(petItem.petDefId ?? '');
    const stage = petItem.evolutionStage ?? 0;
    const evolution = def?.evolutions.find(e => e.stage === stage);
    return {
      icon: evolution?.icon ?? def?.icon ?? '❓',
      name: evolution?.name ?? def?.name ?? '未知宠物',
      stage
    };
  }

  return (
    <div className="scene-pet -mx-2 -mt-2 min-h-full rounded-t-3xl p-3 sm:-mx-4 sm:-mt-4 sm:p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="glass-card flex items-center gap-3">
          <Link
            to="/play"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">我的宠物</h1>
        </div>

        <div className="glass-card space-y-3">
          <h2 className="font-bold text-slate-700">出战宠物</h2>
          {activePetInstance ? (
            <ActivePetCard
              instance={activePetInstance}
              foodCount={foodCount}
              battleRecords={battleRecords}
              dailyTasks={dailyTasks}
              onFeed={handleFeed}
              onEvolve={handleEvolve}
            />
          ) : (
            <p className="text-center text-sm text-slate-500">还没有选择出战宠物，从下方选择一只吧！</p>
          )}
        </div>

        <div className="glass-card space-y-3">
          <h2 className="font-bold text-slate-700">已拥有宠物</h2>
          {ownedPets.length === 0 ? (
            <p className="text-center text-sm text-slate-500">还没有宠物，去虚拟商城看看吧！</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ownedPets.map(petItem => {
                const { icon, name, stage } = petIconAndName(petItem);
                const def = getPetDef(petItem.petDefId ?? '');
                const isActive = profile.activePet === petItem.id;
                return (
                  <div
                    key={petItem.id}
                    className={[
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center',
                      isActive
                        ? 'border-indigo-300 bg-indigo-50/80'
                        : 'border-slate-200 bg-white/60'
                    ].join(' ')}
                  >
                    <PetAvatar icon={icon} size="md" badge={`Lv.${stage + 1}`} />
                    <div>
                      <p className="font-bold text-slate-700">{name}</p>
                      <p className="text-xs text-slate-500">{def?.skillDescription}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSetActive(petItem)}
                      disabled={isActive}
                      className="btn-primary w-full py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isActive ? '出战中' : '出战'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ActivePetCardProps {
  instance: NonNullable<ReturnType<typeof getPetInstance>>;
  foodCount: number;
  battleRecords: BattleRecord[];
  dailyTasks: DailyTask[];
  onFeed: () => void | Promise<void>;
  onEvolve: () => void | Promise<void>;
}

function ActivePetCard({
  instance,
  foodCount,
  battleRecords,
  dailyTasks,
  onFeed,
  onEvolve
}: ActivePetCardProps) {
  const { item, def } = instance;
  const stage = item.evolutionStage ?? 0;
  const evolution = def.evolutions.find(e => e.stage === stage);
  const nextEvolution = def.evolutions.find(e => e.stage === stage + 1);

  const currentIcon = evolution?.icon ?? def.icon;
  const currentName = evolution?.name ?? def.name;
  const bond = item.bond ?? 0;
  const maxBond = nextEvolution?.bondRequired ?? bond;
  const bondPercent = maxBond > 0 ? Math.min(100, Math.round((bond / maxBond) * 100)) : 100;

  const skillEffect = computePetSkillEffect(instance);
  const evolutionStatus = checkEvolution(instance, battleRecords, dailyTasks);

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-indigo-100 bg-indigo-50/80 p-4 text-center sm:flex-row sm:text-left">
      <div className="perspective-1000">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-5xl shadow-lg transition hover:rotate-y-12">
          {currentIcon}
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div>
          <p className="text-lg font-bold text-slate-800">{currentName}</p>
          <p className="text-sm text-slate-600">{def.skillDescription}</p>
          {skillEffect.healAmount !== undefined && (
            <p className="text-xs text-slate-500">恢复生命 +{skillEffect.healAmount}</p>
          )}
          {skillEffect.doubleStarsChance !== undefined && (
            <p className="text-xs text-slate-500">
              星星翻倍概率 {Math.round(skillEffect.doubleStarsChance * 100)}%
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>亲密度</span>
            <span>
              {bond}/{maxBond}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${bondPercent}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">{evolutionStatus.requirementText}</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onFeed}
            disabled={foodCount <= 0}
            className="btn-secondary flex-1 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            喂食 ({foodCount})
          </button>
          <button
            type="button"
            onClick={onEvolve}
            disabled={!evolutionStatus.canEvolve}
            className="btn-primary flex-1 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            进化
          </button>
        </div>
      </div>
    </div>
  );
}
