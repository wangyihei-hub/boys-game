import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateQuestions,
  buildOpenAIRequest,
  buildAnthropicRequest,
  buildCustomRequest,
  type AISettings,
} from '../src/services/aiQuestion';
import type { QuestionGenerationConfig } from '../src/types';

const baseConfig: QuestionGenerationConfig = {
  subject: 'math',
  topic: 'fraction-addition',
  difficulty: 2,
  count: 2,
  grade: 4,
};

const baseSettings: AISettings = {
  apiProvider: 'openai',
  apiKey: 'test-api-key',
  apiEndpoint: undefined,
  apiModel: undefined,
};

const validQuestions = [
  {
    type: 'choice',
    question: '1/2 + 1/4 = ?',
    options: ['1/6', '2/6', '3/4', '1'],
    answer: 2,
    explanation: '通分后相加',
  },
  {
    type: 'fillblank',
    question: '3 x 4 = ____',
    answer: '12',
    explanation: '乘法口诀',
  },
];

function createOpenAIResponse(content: string): object {
  return {
    id: 'chatcmpl-test',
    object: 'chat.completion',
    created: Date.now(),
    model: 'gpt-4o-mini',
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content },
        finish_reason: 'stop',
      },
    ],
  };
}

function createAnthropicResponse(content: string): object {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-3-haiku-20240307',
    content: [{ type: 'text', text: content }],
  };
}

function mockFetch(response: object, status = 200): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  });
}

describe('provider request builders', () => {
  it('builds an OpenAI request with default model', () => {
    const payload = buildOpenAIRequest(baseConfig, baseSettings);
    expect(payload.url).toBe('https://api.openai.com/v1/chat/completions');
    expect(payload.headers.Authorization).toBe('Bearer test-api-key');
    const body = payload.body as Record<string, unknown>;
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.messages).toHaveLength(2);
  });

  it('builds an Anthropic request with default model and version header', () => {
    const payload = buildAnthropicRequest(baseConfig, {
      ...baseSettings,
      apiProvider: 'anthropic',
    });
    expect(payload.url).toBe('https://api.anthropic.com/v1/messages');
    expect(payload.headers['x-api-key']).toBe('test-api-key');
    expect(payload.headers['anthropic-version']).toBe('2023-06-01');
    const body = payload.body as Record<string, unknown>;
    expect(body.model).toBe('claude-3-haiku-20240307');
    expect(body.system).toContain('数学');
  });

  it('builds a custom request using the provided endpoint', () => {
    const payload = buildCustomRequest(baseConfig, {
      ...baseSettings,
      apiProvider: 'custom',
      apiEndpoint: 'https://custom.example.com/v1/chat',
      apiModel: 'custom-model',
    });
    expect(payload.url).toBe('https://custom.example.com/v1/chat');
    const body = payload.body as Record<string, unknown>;
    expect(body.model).toBe('custom-model');
  });

  it('throws when custom provider is missing an endpoint', () => {
    expect(() =>
      buildCustomRequest(baseConfig, {
        ...baseSettings,
        apiProvider: 'custom',
        apiEndpoint: undefined,
      })
    ).toThrow('Custom provider requires an API endpoint');
  });
});

describe('generateQuestions', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns validated questions for OpenAI', async () => {
    globalThis.fetch = mockFetch(createOpenAIResponse(JSON.stringify(validQuestions)));

    const result = await generateQuestions(baseConfig, baseSettings);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].subject).toBe('math');
    expect(result.questions[0].topic).toBe('fraction-addition');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.rawResponse).toContain('1/2 + 1/4');
  });

  it('returns validated questions for Anthropic', async () => {
    globalThis.fetch = mockFetch(
      createAnthropicResponse(JSON.stringify(validQuestions))
    );

    const result = await generateQuestions(baseConfig, {
      ...baseSettings,
      apiProvider: 'anthropic',
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.questions).toHaveLength(2);
  });

  it('returns validated questions for a custom endpoint', async () => {
    globalThis.fetch = mockFetch(createOpenAIResponse(JSON.stringify(validQuestions)));

    const result = await generateQuestions(baseConfig, {
      ...baseSettings,
      apiProvider: 'custom',
      apiEndpoint: 'https://custom.example.com/v1/chat',
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://custom.example.com/v1/chat',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.success).toBe(2);
    expect(result.questions).toHaveLength(2);
  });

  it('throws when API key is missing', async () => {
    await expect(
      generateQuestions(baseConfig, { ...baseSettings, apiKey: undefined })
    ).rejects.toThrow('API key is required');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('throws on network errors from fetch', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    await expect(generateQuestions(baseConfig, baseSettings)).rejects.toThrow(
      'Network failure'
    );
  });

  it('throws when response contains invalid JSON', async () => {
    globalThis.fetch = mockFetch(createOpenAIResponse('not valid json'));

    await expect(generateQuestions(baseConfig, baseSettings)).rejects.toThrow();
  });

  it('throws when API returns a non-2xx status', async () => {
    globalThis.fetch = mockFetch(
      { error: { message: 'Invalid API key' } },
      401
    );

    await expect(generateQuestions(baseConfig, baseSettings)).rejects.toThrow(
      'Invalid API key'
    );
  });
});
