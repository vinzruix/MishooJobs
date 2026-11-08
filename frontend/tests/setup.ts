import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

// Polyfill localStorage if shadowed by Node experimental localStorage
if (typeof window !== "undefined" && (!window.localStorage || typeof window.localStorage.getItem !== "function")) {
  let store: Record<string, string> = {};
  const mockStorage: Storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    length: 0,
  };
  Object.defineProperty(mockStorage, "length", {
    get: () => Object.keys(store).length,
  });
  Object.defineProperty(window, "localStorage", {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
}
