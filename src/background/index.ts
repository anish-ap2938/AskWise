import { setupRouter } from "./router";
import { getStorage } from "./storage";
import {
  ensureOnDeviceModel,
  probeOnDeviceCache,
  setOnDeviceProgress,
  setupOnDeviceProgressListener,
} from "./llm/ondevice";
import { supportsOffscreen } from "./llm/offscreen";

console.log("[AskWise] service worker started");

setupOnDeviceProgressListener();

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

// On SW wake, reflect cache state without forcing a GPU reload.
void getStorage().then(async (storage) => {
  if (!storage.providers.ondevice.enabled || !supportsOffscreen()) return;
  const { cached, webgpu } = await probeOnDeviceCache(storage.providers.ondevice.model);
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
});

setupRouter();
