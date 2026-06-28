import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, GraduationCap, BookOpen, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useParentStore } from '../stores/parentStore';
import { getTodayCurriculumDay, generateCurriculumPlan, CURRICULUM_DAYS } from '../services/curriculumData';
import type { CurriculumConfig, Subject } from '../types';

const SUBJECTS: { value: Subject; label: string; color: string }[] = [
  { value: 'chinese', label: '语文', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'math', label: '数学', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'english', label: '英语', color: 'bg-amber-100 text-amber-700 border-amber-300' },
];

function getDefaultStartDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ParentCurriculum() {
  const settings = useParentStore(state => state.settings);
  const generating = useParentStore(state => state.generating);
  const error = useParentStore(state => state.error);
  const lastResult = useParentStore(state => state.lastResult);
  const updateCurriculum = useParentStore(state => state.updateCurriculum);
  const generateCurriculumQuestions = useParentStore(state => state.generateCurriculumQuestions);
  const clearError = useParentStore(state => state.clearError);
  const clearGenerationResult = useParentStore(state => state.clearGenerationResult);

  const initial = useMemo<CurriculumConfig>(() => settings?.curriculum ?? {
    enabled: false,
    grade: 4,
    startDate: getDefaultStartDate(),
    subjects: ['chinese', 'math', 'english'],
    questionsPerLesson: 6,
  }, [settings?.curriculum]);

  const [config, setConfig] = useState<CurriculumConfig>(initial);

  useEffect(() => {
    if (settings?.curriculum) {
      setConfig(settings.curriculum);
    }
  }, [settings?.curriculum]);

  const previewDay = useMemo(() => getTodayCurriculumDay(config), [config]);
  const weekPreview = useMemo(() => {
    if (!config.enabled || !config.startDate) return [];
    const plan = generateCurriculumPlan(config);
    return plan.slice(0, 7);
  }, [config]);

  const toggleEnabled = () => {
    clearError();
    clearGenerationResult();
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const setGrade = (grade: 4 | 5) => {
    clearGenerationResult();
    setConfig(prev => ({ ...prev, grade }));
  };

  const setStartDate = (startDate: string) => {
    clearGenerationResult();
    setConfig(prev => ({ ...prev, startDate }));
  };

  const toggleSubject = (subject: Subject) => {
    clearGenerationResult();
    setConfig(prev => {
      const has = prev.subjects.includes(subject);
      const subjects = has
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects };
    });
  };

  const setQuestionsPerLesson = (questionsPerLesson: number) => {
    clearGenerationResult();
    setConfig(prev => ({ ...prev, questionsPerLesson }));
  };

  const handleSave = async () => {
    clearError();
    clearGenerationResult();
    await updateCurriculum(config);
  };

  const handleGenerateToday = async () => {
    if (!config.enabled) return;
    clearError();
    const today = new Date().setHours(0, 0, 0, 0);
    const start = new Date(config.startDate).setHours(0, 0, 0, 0);
    const dayIndex = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    await generateCurriculumQuestions(dayIndex, dayIndex);
  };

  const handleGenerateWeek = async () => {
    if (!config.enabled) return;
    clearError();
    const today = new Date().setHours(0, 0, 0, 0);
    const start = new Date(config.startDate).setHours(0, 0, 0, 0);
    const dayIndex = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    await generateCurriculumQuestions(dayIndex, dayIndex + 6);
  };

  const handleGenerateAll = async () => {
    if (!config.enabled) return;
    clearError();
    await generateCurriculumQuestions(0, CURRICULUM_DAYS - 1);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="card">
        <div className="mb-4 flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-bold">60 天学习计划</h2>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          开启后，系统会按年级自动生成 60 天学习路线，每天包含语文、数学、英语各一个主题。每天约 1 小时完成主线与副本任务，家长可一键生成对应题目。
        </p>

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
          <span className="font-semibold">启用 60 天课程</span>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={toggleEnabled}
            className="h-5 w-5 accent-indigo-600"
          />
        </label>
      </div>

      {config.enabled && (
        <>
          <div className="card grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">年级</h3>
              <div className="grid grid-cols-2 gap-2">
                {[4, 5].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g as 4 | 5)}
                    className={[
                      'rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors',
                      config.grade === g
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                    ].join(' ')}
                  >
                    {g} 年级
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">开始日期</h3>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={config.startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">包含学科</h3>
            <div className="grid grid-cols-3 gap-3">
              {SUBJECTS.map(s => {
                const selected = config.subjects.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleSubject(s.value)}
                    className={[
                      'rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors',
                      selected ? s.color : 'border-slate-200 bg-white text-slate-500'
                    ].join(' ')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      {selected && <CheckCircle2 className="h-4 w-4" />}
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              每科每天题目数：{config.questionsPerLesson}
            </h3>
            <input
              type="range"
              min={1}
              max={10}
              value={config.questionsPerLesson}
              onChange={e => setQuestionsPerLesson(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={generating}
            className="btn-primary w-full disabled:opacity-60"
          >
            保存课程配置
          </button>

          {previewDay && (
            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <BookOpen className="h-4 w-4" />
                今日课程（第 {previewDay.dayIndex + 1} 天）
              </h3>
              <div className="space-y-2">
                {previewDay.lessons.map((lesson, idx) => {
                  const meta = SUBJECTS.find(s => s.value === lesson.subject)!;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <span className={['rounded-md px-2 py-0.5 text-xs font-semibold', meta.color].join(' ')}>
                        {meta.label}
                      </span>
                      <span className="text-sm text-slate-700">{lesson.topic}</span>
                      <span className="text-xs text-slate-400">难度 {lesson.difficulty}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Sparkles className="h-4 w-4" />
              自动生成题目
            </h3>
            <p className="mb-3 text-xs text-slate-500">
              题目使用本地生成器离线生成，不消耗 API 额度。
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleGenerateToday}
                disabled={generating}
                className="btn-secondary text-xs disabled:opacity-60"
              >
                生成今天
              </button>
              <button
                type="button"
                onClick={handleGenerateWeek}
                disabled={generating}
                className="btn-secondary text-xs disabled:opacity-60"
              >
                生成未来 7 天
              </button>
              <button
                type="button"
                onClick={handleGenerateAll}
                disabled={generating}
                className="btn-secondary text-xs disabled:opacity-60"
              >
                生成全部 60 天
              </button>
            </div>
            {generating && (
              <p className="mt-3 text-sm text-indigo-600">正在离线生成题目…</p>
            )}
            {lastResult && !generating && (
              <p className="mt-3 text-sm text-slate-600">
                生成完成：{lastResult.success} 题，耗时 {lastResult.durationMs}ms
              </p>
            )}
          </div>

          {weekPreview.length > 0 && (
            <div className="card">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">前 7 天路线预览</h3>
              <div className="space-y-2">
                {weekPreview.map(day => (
                  <div key={day.dayIndex} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="mb-1 text-xs font-semibold text-slate-500">第 {day.dayIndex + 1} 天 · {day.dateKey}</p>
                    <div className="flex flex-wrap gap-2">
                      {day.lessons.map((lesson, idx) => {
                        const meta = SUBJECTS.find(s => s.value === lesson.subject)!;
                        return (
                          <span key={idx} className={['rounded-md px-2 py-0.5 text-xs', meta.color].join(' ')}>
                            {meta.label} {lesson.topic}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-100 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
