// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — AutoMemoryEngine Tests
// ─────────────────────────────────────────────────────────────────────────────

import { jest } from '@jest/globals';
import { AutoMemoryEngine } from '../AutoMemoryEngine.js';

function makeConversation(userMsg, assistantMsg) {
  return {
    conversationId: 'conv1',
    messages: [
      { role: 'user', content: userMsg },
      { role: 'assistant', content: assistantMsg },
    ],
  };
}

function makeMemoryService() {
  const created = [];
  return {
    create: jest.fn(async input => { created.push(input); return { id: 'new_id', ...input }; }),
    _created: created,
  };
}

describe('AutoMemoryEngine._scoreImportance', () => {
  let engine;
  beforeEach(() => {
    engine = new AutoMemoryEngine({ memoryService: makeMemoryService(), events: null });
  });

  test('very short text scores 0', () => {
    const score = engine._scoreImportance('Hi');
    expect(score).toBe(0);
  });

  test('mission source gets bonus', () => {
    const text = 'We decided to redesign the architecture for the new project launch strategy and implementation of services'.repeat(3);
    const withMission = engine._scoreImportance(text, { source: 'mission' });
    const withoutMission = engine._scoreImportance(text, {});
    expect(withMission).toBeGreaterThan(withoutMission);
  });

  test('code content gets bonus', () => {
    const baseText = 'Reviewing the system for changes and updates to consider'.repeat(3);
    const withCode = engine._scoreImportance(`${baseText}\n\`\`\`javascript\nconst x = 1;\n\`\`\``);
    const withoutCode = engine._scoreImportance(baseText);
    expect(withCode).toBeGreaterThan(withoutCode);
  });

  test('decision words get bonus', () => {
    const base = 'User preferences and system behavior requirements are defined and configured'.repeat(2);
    const withDecision = engine._scoreImportance(`${base} We decided on the new approach and agreed on the plan`);
    const withoutDecision = engine._scoreImportance(base);
    expect(withDecision).toBeGreaterThan(withoutDecision);
  });
});

describe('AutoMemoryEngine.evaluate', () => {
  test('does NOT create memory for short conversation (below threshold)', async () => {
    const ms = makeMemoryService();
    const engine = new AutoMemoryEngine({ memoryService: ms, events: null, threshold: 0.45 });
    await engine.evaluate(makeConversation('Hi', 'Hello!'), { text: '' }, {});
    expect(ms.create).not.toHaveBeenCalled();
  });

  test('creates memory for important conversation', async () => {
    const ms = makeMemoryService();
    const engine = new AutoMemoryEngine({ memoryService: ms, events: null, threshold: 0.05 }); // low threshold for test
    const longUser = 'We decided to implement the new React TypeScript architecture for the JARVIS frontend system. The plan involves creating modular components, state management with Zustand, and API integration with the backend services for better performance.';
    const longAssistant = 'Great decision! The React TypeScript architecture will significantly improve code quality and maintainability. I recommend starting with the component library, then implementing the Zustand store, followed by the API layer for connecting to backend services.';
    await engine.evaluate(makeConversation(longUser, longAssistant), { text: longAssistant }, { conversationId: 'c1' });
    expect(ms.create).toHaveBeenCalledTimes(1);
    const created = ms._created[0];
    expect(created.source).toBe('auto');
    expect(created.tags).toBeDefined();
  });

  test('deduplicates identical content', async () => {
    const ms = makeMemoryService();
    const engine = new AutoMemoryEngine({ memoryService: ms, events: null, threshold: 0.05 });
    const longMsg = 'We decided to implement the new React TypeScript architecture for the JARVIS frontend components and services. The new system uses Zustand for state management and features a modular approach to building components.';
    const conv = makeConversation(longMsg, longMsg);
    await engine.evaluate(conv, { text: longMsg }, {});
    await engine.evaluate(conv, { text: longMsg }, {});
    expect(ms.create).toHaveBeenCalledTimes(1); // Not twice
  });

  test('returns early when conversation has < 2 messages', async () => {
    const ms = makeMemoryService();
    const engine = new AutoMemoryEngine({ memoryService: ms, events: null });
    await engine.evaluate({ messages: [{ role: 'user', content: 'hello' }] }, { text: '' }, {});
    expect(ms.create).not.toHaveBeenCalled();
  });
});
