// CSS imports
import "../styles/styles.css";

import App from "./pages/app";
import { registerSW } from "virtual:pwa-register";

// Register Service Worker
if ("serviceWorker" in navigator) {
  registerSW({
    immediate: true,
    onRegistered(registration) {
      console.log("Service Worker registered:", registration);
    },
    onRegisterError(error) {
      console.error("Service Worker registration failed:", error);
    },
  });
}

// Install Prompt Handler
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installPrompt = document.getElementById("install-prompt");
  if (installPrompt) {
    installPrompt.style.display = "block";
  }
});

// Install Button
document.addEventListener("DOMContentLoaded", () => {
  const installButton = document.getElementById("install-button");
  const dismissButton = document.getElementById("dismiss-install");
  const installPrompt = document.getElementById("install-prompt");

  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (!deferredPrompt) {
        return;
      }

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;

      if (installPrompt) {
        installPrompt.style.display = "none";
      }
    });
  }

  if (dismissButton) {
    dismissButton.addEventListener("click", () => {
      if (installPrompt) {
        installPrompt.style.display = "none";
      }
    });
  }
});

// Online/Offline Indicator
window.addEventListener("online", () => {
  const indicator = document.getElementById("offline-indicator");
  if (indicator) {
    indicator.style.display = "none";
  }
  console.log("App is online");
});

window.addEventListener("offline", () => {
  const indicator = document.getElementById("offline-indicator");
  if (indicator) {
    indicator.style.display = "flex";
  }
  console.log("App is offline");
});

// Initialize App
document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });
  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });
});
