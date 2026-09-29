import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Generated components use `data-ocid` as their stable test hook.
configure({ testIdAttribute: "data-ocid" });

// Default core-infrastructure mock. `AuthProvider` (rendered by
// `renderWithProviders`) reads `useActor` and `useInternetIdentity`, and the
// real `useInternetIdentity` throws when no `InternetIdentityProvider` is
// mounted. This default keeps the provider renderable with no session and no
// actor; a test that needs a specific actor or identity still declares its own
// `vi.mock("@caffeineai/core-infrastructure", …)`, which takes precedence for
// that file.
vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: null, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    login: vi.fn(),
    clear: vi.fn(),
    identity: undefined,
  }),
}));

// jsdom does not implement ResizeObserver, which Radix primitives (Switch,
// Select, …) observe on mount. A no-op stub keeps those components renderable
// without changing any application behavior under test.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver;
}

// jsdom does not implement the pointer-capture API that Radix Select calls
// when its trigger is clicked. Stubbing it lets the select open and expose its
// options without changing any application behavior under test.
if (typeof Element !== "undefined") {
  const proto = Element.prototype as Element & {
    hasPointerCapture?: (pointerId: number) => boolean;
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
    scrollIntoView?: () => void;
  };
  if (typeof proto.hasPointerCapture !== "function") {
    proto.hasPointerCapture = () => false;
  }
  if (typeof proto.setPointerCapture !== "function") {
    proto.setPointerCapture = () => {};
  }
  if (typeof proto.releasePointerCapture !== "function") {
    proto.releasePointerCapture = () => {};
  }
  if (typeof proto.scrollIntoView !== "function") {
    proto.scrollIntoView = () => {};
  }
}

// jsdom does not implement `window.matchMedia`, which the mounted sonner
// Toaster reads on mount to honor reduced-motion preferences. A stub keeps the
// notification region renderable without changing application behavior.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
});
