import titles from './levelTitles.json';

export const LEVEL_TITLES: readonly string[] = titles;

export function getLevelTitle(level: number): string {
  const index = level - 1;
  return titles[index] ?? `第 ${level} 关`;
}
