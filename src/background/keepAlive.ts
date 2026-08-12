import { KEEPALIVE_PORT } from "../shared/runtimeMessage";

export const ONDEVICE_KEEPALIVE_ALARM = "askwise-ondevice-keepalive";

export function setupKeepAlivePorts(): void {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== KEEPALIVE_PORT) return;
    // An open port from the offscreen document or options/onboarding page
    // keeps this service worker alive for the duration of a model download.
    port.onMessage.addListener(() => {});
  });
}

export async function startDownloadKeepAlive(): Promise<void> {
  if (!chrome.alarms?.create) return;
  await chrome.alarms.create(ONDEVICE_KEEPALIVE_ALARM, {
    delayInMinutes: 0.4,
    periodInMinutes: 0.5,
  });
}

export async function stopDownloadKeepAlive(): Promise<void> {
  if (!chrome.alarms?.clear) return;
  await chrome.alarms.clear(ONDEVICE_KEEPALIVE_ALARM);
}
