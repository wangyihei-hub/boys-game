import type { GenerationResult, ParentSettings, QuestionGenerationConfig } from '../types';
import { getPromptBuilder } from './prompts';
import { extractJson, validateQuestions } from './parser';
import { generateLocalQuestions } from './localQuestionGenerator';

export type AISettings = Pick<ParentSettings, 'apiProvider' | 'apiKey' | 'apiEndpoint' | 'apiModel'>;

export interface RequestPayload {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini';
const OPENAI_DEFAULT_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_DEFAULT_MODEL = 'claude-3-haiku-20240307';
const ANTHROPIC_DEFAULT_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_QUESTION_COUNT = 20;
const MIN_QUESTION_COUNT = 1;

export function buildOpenAIRequest(
  config: QuestionGenerationConfig,
  settings: AISettings
): RequestPayload {
  const { system, user } = getPromptBuilder(config.subject);
  const model = settings.apiModel || OPENAI_DEFAULT_MODEL;

  return {
    url: settings.apiEndpoint || OPENAI_DEFAULT_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user(config) },
      ],
      temperature: 0.7,
    },
  };
}

export function buildAnthropicRequest(
  config: QuestionGenerationConfig,
  settings: AISettings
): RequestPayload {
  const { system, user } = getPromptBuilder(config.subject);
  const model = settings.apiModel || ANTHROPIC_DEFAULT_MODEL;

  return {
    url: settings.apiEndpoint || ANTHROPIC_DEFAULT_URL,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey ?? '',
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: {
      model,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user(config) }],
    },
  };
}

export function buildCustomRequest(
  config: QuestionGenerationConfig,
  settings: AISettings
): RequestPayload {
  if (!settings.apiEndpoint) {
    throw new Error('Custom provider requires an API endpoint');
  }

  const { system, user } = getPromptBuilder(config.subject);
  const model = settings.apiModel || OPENAI_DEFAULT_MODEL;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (settings.apiKey) {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }

  return {
    url: settings.apiEndpoint,
    headers,
    body: {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user(config) },
      ],
      temperature: 0.7,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractOpenAIResponseText(data: unknown): string {
  if (!isRecord(data)) {
    throw new Error('Unexpected response format from OpenAI-compatible API');
  }

  const choices = data.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error('Unexpected response format from OpenAI-compatible API');
  }

  const firstChoice = choices[0];
  if (!isRecord(firstChoice)) {
    throw new Error('Unexpected response format from OpenAI-compatible API');
  }

  const message = firstChoice.message;
  if (!isRecord(message)) {
    throw new Error('Unexpected response format from OpenAI-compatible API');
  }

  return String(message.content);
}

function extractAnthropicResponseText(data: unknown): string {
  if (!isRecord(data)) {
    throw new Error('Unexpected response format from Anthropic API');
  }

  const content = data.content;
  if (!Array.isArray(content) || content.length === 0) {
    throw new Error('Unexpected response format from Anthropic API');
  }

  const firstBlock = content[0];
  if (!isRecord(firstBlock)) {
    throw new Error('Unexpected response format from Anthropic API');
  }

  return String(firstBlock.text);
}

function clampCount(count: number): number {
  return Math.max(MIN_QUESTION_COUNT, Math.min(MAX_QUESTION_COUNT, count));
}

function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

export async function generateQuestions(
  config: QuestionGenerationConfig,
  settings: AISettings
): Promise<GenerationResult> {
  const startTime = performance.now();
  const safeConfig = { ...config, count: clampCount(config.count) };

  if (!settings.apiKey && settings.apiProvider !== 'custom' && settings.apiProvider !== 'local') {
    throw new Error('API key is required');
  }

  if (settings.apiProvider === 'local') {
    const rawQuestions = await generateLocalQuestions(safeConfig);
    const { valid, invalid, error } = validateQuestions(rawQuestions, safeConfig);
    if (error) {
      throw new Error(error);
    }
    return {
      success: valid.length,
      failed: invalid,
      questions: valid,
      rawResponse: JSON.stringify(rawQuestions, null, 2),
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  let payload: RequestPayload;
  let extractText: (data: unknown) => string;

  switch (settings.apiProvider) {
    case 'anthropic':
      payload = buildAnthropicRequest(safeConfig, settings);
      extractText = extractAnthropicResponseText;
      break;
    case 'custom':
      payload = buildCustomRequest(safeConfig, settings);
      extractText = extractOpenAIResponseText;
      break;
    case 'openai':
    default:
      payload = buildOpenAIRequest(safeConfig, settings);
      extractText = extractOpenAIResponseText;
      break;
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(payload.url, {
      method: 'POST',
      headers: payload.headers,
      body: JSON.stringify(payload.body),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络或 API 端点');
    }
    throw err;
  }

  if (!response.ok) {
    const rawText = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
    let errorMessage = `API request failed with status ${response.status}`;
    if (isRecord(parsed) && isRecord(parsed.error)) {
      errorMessage = String(parsed.error.message ?? errorMessage);
    } else if (rawText) {
      errorMessage = `${errorMessage}: ${rawText.slice(0, 200)}`;
    }
    throw new Error(errorMessage);
  }

  const responseData = (await response.json()) as unknown;

  const rawResponseText = extractText(responseData);
  const parsedJson = extractJson(rawResponseText);
  const { valid, invalid, error } = validateQuestions(parsedJson, config);

  if (error) {
    throw new Error(error);
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    success: valid.length,
    failed: invalid,
    questions: valid,
    rawResponse: rawResponseText,
    durationMs,
  };
}
