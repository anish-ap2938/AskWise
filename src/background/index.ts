import { setupRouter } from "./router";

console.log("[AskWise] service worker started");

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[AskWise] extension installed");
  if (details.reason === "install") {
    void chrome.tabs.create({
      url: chrome.runtime.getURL("src/onboarding/index.html"),
    });
  }
});

setupRouter();
