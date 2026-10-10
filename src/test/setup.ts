/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';

// jsdom lacks several browser APIs the app touches — provide minimal, silent stubs.

// speech synthesis
if (!('speechSynthesis' in window)) {
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: () => {},
      cancel: () => {},
      getVoices: () => [],
      onvoiceschanged: null,
    },
    configurable: true,
  });
}
if (!('SpeechSynthesisUtterance' in window)) {
  (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = class {
    text: string;
    lang = '';
    rate = 1;
    pitch = 1;
    volume = 1;
    voice: unknown = null;
    constructor(text: string) {
      this.text = text;
    }
  };
}

// matchMedia
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// ResizeObserver
if (!('ResizeObserver' in window)) {
  (window as unknown as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// canvas 2d — return null so components guard naturally
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
