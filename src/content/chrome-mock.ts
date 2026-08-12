// Minimal chrome API mock for fixture pages in Playwright
if (typeof globalThis.chrome === "undefined") {
  const listeners: Array<(msg: unknown) => void> = [];
  (globalThis as { chrome: typeof chrome }).chrome = {
    runtime: {
      sendMessage: (_msg: unknown, cb?: (r: unknown) => void) => {
        cb?.({ kind: "SETTINGS", payload: { enabledSites: { chatgpt: true, claude: true } } });
      },
      onMessage: {
        addListener: (fn: (msg: unknown) => void) => listeners.push(fn),
        removeListener: (fn: (msg: unknown) => void) => {
          const i = listeners.indexOf(fn);
          if (i >= 0) listeners.splice(i, 1);
        },
      },
      connect: () => ({
        postMessage: () => {},
        onMessage: { addListener: () => {} },
        onDisconnect: { addListener: () => {} },
        disconnect: () => {},
      }),
      lastError: null,
    },
    storage: {
      onChanged: { addListener: () => {} },
      local: { get: (_k: string, cb: (r: object) => void) => cb({}) },
    },
  } as unknown as typeof chrome;
}
