import { setupRouter } from "./router";
import { setupHfFetchListener } from "./hfFetch";
import { getStorage } from "./storage";
import {
  ensureOnDeviceModel,
  probeOnDeviceCache,
  resumeOnDeviceIfNeeded,
  setOnDeviceProgress,
  setupOnDeviceProgressListener,
} from "./llm/ondevice";
import { supportsOffscreen } from "./llm/offscreen";
import {
  ONDEVICE_KEEPALIVE_ALARM,
  setupKeepAlivePorts,
} from "./keepAlive";
import { getOnDeviceProgress } from "../shared/ondeviceProgress";

console.log("[AskWise] service worker started");

setupHfFetchListener();
setupOnDeviceProgressListener();
setupKeepAlivePorts();

chrome.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name !== ONDEVICE_KEEPALIVE_ALARM) return;
  void resumeOnDeviceIfNeeded();
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[AskWise] extension installed");
  if (details.reason === "install") {
    void chrome.tabs.create({
      url: chrome.runtime.getURL("src/onboarding/index.html"),
    });
  }
  // Pull weights into Cache Storage on install/update so Advanced works offline.
  void getStorage().then((storage) => {
    if (!storage.providers.ondevice.enabled) return;
    return ensureOnDeviceModel(storage.providers.ondevice.model);
  });
});

// On SW wake, resume an in-flight download or reflect cache state.
void (async () => {
  const progress = await getOnDeviceProgress();
  if (progress.status === "downloading") {
    await resumeOnDeviceIfNeeded();
    return;
  }
  const storage = await getStorage();
  if (!storage.providers.ondevice.enabled || !supportsOffscreen()) return;
  const { cached, webgpu } = await probeOnDeviceCache(
    storage.providers.ondevice.model
  );
  if (!webgpu) return;
  if (cached) {
    await setOnDeviceProgress({
      status: "ready",
      model: storage.providers.ondevice.model,
      progress: 1,
      text: "Model ready (cached)",
      error: undefined,
    });
  }
})();

setupRouter();
