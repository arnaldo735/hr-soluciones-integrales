import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";

/**
 * Creates the backend actor through the shared core-infrastructure hook and
 * exposes it together with its readiness flag.
 *
 * Call this at the top level of a React hook — never inside a query or
 * mutation callback.
 *
 * The React Query cache is intentionally left untouched here: it is shared
 * across module navigation so revisiting a screen renders instantly, and its
 * freshness window is configured once in `main.tsx`.
 */
export function useBackend() {
  const { actor, isFetching } = useActor(createActor);

  return { actor, isFetching, isReady: !!actor && !isFetching };
}
