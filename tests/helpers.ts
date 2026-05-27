import { vi } from 'vitest';

export function createMockStorage(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));

  const storage: Storage = {
    length: data.size,
    clear: () => data.clear(),
    getItem: (key) => (data.has(key) ? data.get(key)! : null),
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };

  return { data, storage };
}

export function installMockWindow(storage: Storage) {
  const mockWindow = {
    localStorage: storage,
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    URL: globalThis.URL,
    confirm: vi.fn(() => true),
    document: {
      createElement: vi.fn(),
      body: {
        appendChild: vi.fn(),
      },
      getElementById: vi.fn(),
    },
  } as unknown as Window & typeof globalThis;

  Object.defineProperty(globalThis, 'window', {
    value: mockWindow,
    writable: true,
    configurable: true,
  });

  return mockWindow;
}
