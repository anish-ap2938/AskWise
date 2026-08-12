import { humanizeOnDeviceError, isReceivingEndError } from "./ondeviceProgress";

export const KEEPALIVE_PORT = "askwise-keepalive";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * sendMessage that waits for the service worker to wake and retries the
 * classic MV3 "Receiving end does not exist" failure.
 */
export function sendToBackground<T = unknown>(
  message: unknown,
  options?: { retries?: number; retryDelayMs?: number }
): Promise<T> {
  const retries = options?.retries ?? 5;
  const retryDelayMs = options?.retryDelayMs ?? 250;

  return new Promise<T>((resolve, reject) => {
    const attempt = (left: number) => {
      if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
        reject(new Error("AskWise isn't running in this page."));
        return;
      }

      try {
        chrome.runtime.sendMessage(message, (response: T) => {
          const err = chrome.runtime.lastError?.message;
          if (!err) {
            resolve(response);
            return;
          }
          if (left > 0 && isReceivingEndError(err)) {
            void delay(retryDelayMs * (retries - left + 1)).then(() =>
              attempt(left - 1)
            );
            return;
          }
          reject(new Error(humanizeOnDeviceError(err)));
        });
      } catch (err) {
        const messageText = err instanceof Error ? err.message : String(err);
        if (left > 0 && isReceivingEndError(messageText)) {
          void delay(retryDelayMs * (retries - left + 1)).then(() =>
            attempt(left - 1)
          );
          return;
        }
        reject(new Error(humanizeOnDeviceError(messageText)));
      }
    };

    attempt(retries);
  });
}

/** Hold an open port so Chrome does not kill the service worker. */
export function connectKeepAlivePort(): () => void {
  if (typeof chrome === "undefined" || !chrome.runtime?.connect) {
    return () => {};
  }

  let port: chrome.runtime.Port | null = null;
  let stopped = false;

  const connect = () => {
    if (stopped) return;
    try {
      port = chrome.runtime.connect({ name: KEEPALIVE_PORT });
      port.onDisconnect.addListener(() => {
        port = null;
        if (!stopped) {
          window.setTimeout(connect, 400);
        }
      });
    } catch {
      if (!stopped) {
        window.setTimeout(connect, 800);
      }
    }
  };

  connect();

  return () => {
    stopped = true;
    try {
      port?.disconnect();
    } catch {
      // Port may already be gone with the service worker.
    }
    port = null;
  };
}
