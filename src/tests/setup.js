import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Crear un store en memoria para simular localStorage
let memoryStore = {};

const localStorageMock = {
  getItem: vi.fn((key) => memoryStore[key] ?? null),
  setItem: vi.fn((key, value) => { memoryStore[key] = value; }),
  removeItem: vi.fn((key) => { delete memoryStore[key]; }),
  clear: vi.fn(() => { memoryStore = {}; }),
  get length() { return Object.keys(memoryStore).length; },
  key: vi.fn((index) => Object.keys(memoryStore)[index] || null),
};
global.localStorage = localStorageMock;

// Mock crypto usando Object.defineProperty
const cryptoMock = {
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  randomUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};
Object.defineProperty(global, 'crypto', {
  value: cryptoMock,
  writable: true,
  configurable: true
});

// Reset store before each test
beforeEach(() => {
  memoryStore = {};
  vi.clearAllMocks();
});