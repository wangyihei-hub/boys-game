import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Gift, Heart, Plus, RotateCcw, Shield } from 'lucide-react';
import { useParentStore } from '../../stores/parentStore';
import { DailyTaskForm } from '../../components/parent/DailyTaskForm';
import { LotteryPrizeForm } from '../../components/parent/LotteryPrizeForm';
import { PinSettingsCard } from '../../components/parent/PinSettingsCard';
import { DataExportImportCard } from '../../components/parent/DataExportImportCard';
import { HealthSettingsCard } from '../../components/parent/HealthSettingsCard';
import { getTodayKey } from '../../services/dailyTaskLogic';
import { createDefaultLotteryPool } from '../../services/lotteryLogic';
import type { DailyTask, LotteryPrize } from '../../types';

type Tab = 'tasks' | 'lottery' | 'health' | 'security';

export function ParentSettings() {
  const dailyTasks = useParentStore(state => state.dailyTasks);
  const lotteryPool = useParentStore(state => state.lotteryPool);
  const settings = useParentStore(state => state.settings);
  const loadParentData = useParentStore(state => state.loadParentData);
  const updateSettings = useParentStore(state => state.updateSettings);
  const addDailyTask = useParentStore(state => state.addDailyTask);
  const updateDailyTask = useParentStore(state => state.updateDailyTask);
  const deleteDailyTask = useParentStore(state => state.deleteDailyTask);
  const resetDailyTasks = useParentStore(state => state.resetDailyTasks);
  const addLotteryPrize = useParentStore(state => state.addLotteryPrize);
  const updateLotteryPrize = useParentStore(state => state.updateLotteryPrize);
  const deleteLotteryPrize = useParentStore(state => state.deleteLotteryPrize);

  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [editingTask, setEditingTask] = useState<DailyTask | undefined>(undefined);
  const [editingPrize, setEditingPrize] = useState<LotteryPrize | undefined>(undefined);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showPrizeForm, setShowPrizeForm] = useState(false);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  const handleSaveTask = async (task: DailyTask) => {
    if (editingTask) {
      await updateDailyTask(task);
    } else {
      await addDailyTask(task);
    }
  };

  const handleSavePrize = async (prize: LotteryPrize) => {
    if (editingPrize) {
      await updateLotteryPrize(prize);
    } else {
      await addLotteryPrize(prize);
    }
  };

  const handleEditTask = (task: DailyTask) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleAddTask = () => {
    setEditingTask(undefined);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(undefined);
  };

  const handleEditPrize = (prize: LotteryPrize) => {
    setEditingPrize(prize);
    setShowPrizeForm(true);
  };

  const handleAddPrize = () => {
    setEditingPrize(undefined);
    setShowPrizeForm(true);
  };

  const handleClosePrizeForm = () => {
    setShowPrizeForm(false);
    setEditingPrize(undefined);
  };

  const handleDeleteTask = (id: string) => {
    const task = dailyTasks.find(t => t.id === id);
    if (!task) return;
    if (!window.confirm(`确定要删除任务「${task.title}」吗？`)) return;
    deleteDailyTask(id);
  };

  const handleDeletePrize = (id: string) => {
    const prize = lotteryPool.find(p => p.id === id);
    if (!prize) return;
    if (!window.confirm(`确定要删除奖品「${prize.name}」吗？`)) return;
    deleteLotteryPrize(id);
  };

  const handleResetTasks = () => {
    if (!window.confirm('确定要重置今日任务为默认模板吗？')) return;
    resetDailyTasks();
  };

  const handleResetLotteryPool = () => {
    if (!window.confirm('确定要恢复默认奖池吗？这会保留现有奖品并追加默认奖品。')) return;
    const existingNames = new Set(lotteryPool.map(p => p.name));
    const defaults = createDefaultLotteryPool().filter(p => !existingNames.has(p.name));
    for (const prize of defaults) {
      addLotteryPrize(prize);
    }
  };

  const todayKey = getTodayKey();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/parent"
          className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold">游戏配置</h2>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={[
            'flex-1 rounded-xl px-4 py-2 text-sm font-bold transition',
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          ].join(' ')}
        >
          <span className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" /> 每日任务
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lottery')}
          className={[
            'flex-1 rounded-xl px-4 py-2 text-sm font-bold transition',
            activeTab === 'lottery'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          ].join(' ')}
        >
          <span className="flex items-center justify-center gap-2">
            <Gift className="h-4 w-4" /> 抽奖奖池
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={[
            'flex-1 rounded-xl px-4 py-2 text-sm font-bold transition',
            activeTab === 'health'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          ].join(' ')}
        >
          <span className="flex items-center justify-center gap-2">
            <Heart className="h-4 w-4" /> 健康使用
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={[
            'flex-1 rounded-xl px-4 py-2 text-sm font-bold transition',
            activeTab === 'security'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          ].join(' ')}
        >
          <span className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" /> 数据安全
          </span>
        </button>
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">今日任务</p>
              <p className="text-2xl font-bold">{dailyTasks.length}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetTasks}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-200 active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                重置默认
              </button>
              <button
                type="button"
                onClick={handleAddTask}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                新增任务
              </button>
            </div>
          </div>

          {showTaskForm && (
            <div className="card border-2 border-indigo-200 bg-indigo-50/50">
              <h3 className="mb-4 text-lg font-bold">
                {editingTask ? '编辑任务' : '新增任务'}
              </h3>
              <DailyTaskForm
                task={editingTask}
                dateKey={todayKey}
                onSave={handleSaveTask}
                onCancel={handleCloseTaskForm}
              />
            </div>
          )}

          {dailyTasks.length === 0 ? (
            <div className="card py-12 text-center">
              <div className="mb-3 text-4xl">📝</div>
              <p className="text-slate-500">今日还没有任务</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {dailyTasks.map(task => (
                <div key={task.id} className="card flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{task.title}</h3>
                    <p className="text-xs text-slate-500">
                      目标 {task.target} · 奖励 {task.rewardStars} 星星 · 进度 {task.progress}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditTask(task)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-200"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'lottery' && (
        <div className="space-y-4">
          <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">当前奖品</p>
              <p className="text-2xl font-bold">{lotteryPool.length}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetLotteryPool}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-200 active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                恢复默认
              </button>
              <button
                type="button"
                onClick={handleAddPrize}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                新增奖品
              </button>
            </div>
          </div>

          {showPrizeForm && (
            <div className="card border-2 border-indigo-200 bg-indigo-50/50">
              <h3 className="mb-4 text-lg font-bold">
                {editingPrize ? '编辑奖品' : '新增奖品'}
              </h3>
              <LotteryPrizeForm
                prize={editingPrize}
                onSave={handleSavePrize}
                onCancel={handleClosePrizeForm}
              />
            </div>
          )}

          {lotteryPool.length === 0 ? (
            <div className="card py-12 text-center">
              <div className="mb-3 text-4xl">🎁</div>
              <p className="text-slate-500">奖池还是空的</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {lotteryPool.map(prize => (
                <div key={prize.id} className="card flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                      {prize.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{prize.name}</h3>
                      <p className="text-xs text-slate-500">
                        概率 {(prize.probability * 100).toFixed(0)}% · 库存 {prize.stock === 0 ? '不限' : prize.stock}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditPrize(prize)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePrize(prize.id)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-200"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'health' && settings && (
        <div className="space-y-4">
          <HealthSettingsCard settings={settings} onSave={updateSettings} />
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          <PinSettingsCard />
          <DataExportImportCard />
        </div>
      )}
    </div>
  );
}
