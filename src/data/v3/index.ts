import type { V3Level, V3Subject } from './types';

export type { V3Level, V3Subject } from './types';
export * from './types';
export * from './levelTitles';

export const SUBJECTS: V3Subject[] = ['chinese', 'math', 'english'];
export const LEVEL_COUNT = 100;
export const MAX_STAMINA = 10;
export const STAMINA_REGEN_MS = 60 * 1000;
export const STAMINA_PER_ATTEMPT = 1;
export const DAILY_PASS_LIMIT = 10;
export const QUESTIONS_PER_BATTLE = 10;
export const BOSS_PARTS_COUNT = 5;

const modules = import.meta.glob('./bank/**/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, V3Level>;

const bank = new Map<V3Subject, Map<number, V3Level>>();
for (const subject of SUBJECTS) {
  bank.set(subject, new Map());
}

for (const [path, level] of Object.entries(modules)) {
  const match = path.match(/bank\/(chinese|math|english)\/L(\d{3})\.json$/);
  if (!match) continue;
  const subject = match[1] as V3Subject;
  const levelNumber = parseInt(match[2], 10);
  bank.get(subject)!.set(levelNumber, level as V3Level);
}

export function getV3Level(subject: V3Subject, levelNumber: number): V3Level | undefined {
  return bank.get(subject)?.get(levelNumber);
}

export function getAllLevels(subject: V3Subject): V3Level[] {
  const levels: V3Level[] = [];
  const map = bank.get(subject);
  if (!map) return levels;
  for (let i = 1; i <= LEVEL_COUNT; i++) {
    const lv = map.get(i);
    if (lv) levels.push(lv);
  }
  return levels;
}

export function assertV3Level(subject: V3Subject, levelNumber: number): V3Level {
  const lv = getV3Level(subject, levelNumber);
  if (!lv) {
    throw new Error(`V3 level not found: ${subject} L${String(levelNumber).padStart(3, '0')}`);
  }
  return lv;
}
