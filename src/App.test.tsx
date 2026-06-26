import { describe, it, expect } from 'vitest';
import { App } from './App';
import { router } from './router';

describe('Project foundation', () => {
  it('exports App as a function component', () => {
    expect(typeof App).toBe('function');
  });

  it('creates a browser router', () => {
    expect(router).toBeDefined();
  });
});
