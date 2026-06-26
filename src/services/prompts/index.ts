import type { QuestionGenerationConfig, Subject } from '../../types';
import { chineseBuilder } from './chinese';
import { mathBuilder } from './math';
import { englishBuilder } from './english';

export interface PromptBuilder {
  system: string;
  user(config: QuestionGenerationConfig): string;
}

export const promptRegistry: Record<Subject, PromptBuilder> = {
  chinese: chineseBuilder,
  math: mathBuilder,
  english: englishBuilder,
};

export function getPromptBuilder(subject: Subject): PromptBuilder {
  const builder = promptRegistry[subject];
  if (!builder) {
    throw new Error(`No prompt builder registered for subject: ${subject}`);
  }
  return builder;
}
