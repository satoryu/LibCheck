import type { Environment } from "vitest/environments";
import { builtinEnvironments } from "vitest/environments";

// Capture Node's native AbortController/AbortSignal at module-load time, i.e.
// before jsdom's setup() runs and replaces these globals with its own classes.
const NativeAbortController = globalThis.AbortController;
const NativeAbortSignal = globalThis.AbortSignal;

/**
 * Custom Vitest environment: jsdom with the native AbortController restored.
 *
 * Problem: Vitest's jsdom environment copies `dom.window.AbortController` onto
 * the worker's global. Afterwards `new AbortController()` yields a jsdom
 * AbortSignal. Node 25's undici (the native `fetch`/`Request`) validates
 * `init.signal instanceof AbortSignal` against the native class it captured at
 * load time. A jsdom AbortSignal fails that cross-realm check, so react-router's
 * internal `createClientSideRequest -> new Request(url, { signal })` throws
 * "RequestInit: Expected signal to be an instance of AbortSignal" and any
 * navigate() rejects, breaking every navigation-based test.
 *
 * Fix: after jsdom installs its globals, restore the native AbortController/
 * AbortSignal so router-created signals satisfy undici's instanceof check.
 */
export default {
  name: "custom-jsdom",
  transformMode: "web",
  async setup(global, options) {
    const env = await builtinEnvironments.jsdom.setup(global, options);

    global.AbortController = NativeAbortController;
    global.AbortSignal = NativeAbortSignal;

    return {
      teardown(g) {
        return env.teardown(g);
      },
    };
  },
} satisfies Environment;
