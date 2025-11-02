import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

// Precache assets
precacheAndRoute(self.__WB_MANIFEST);

const CACHE_NAME = "dicoding-story-v2";
const API_CACHE = "api-cache-v2";
const IMAGE_CACHE = "image-cache-v2";

// Cache API requests with NetworkFirst strategy
registerRoute(
  ({ url }) => url.origin === "https://story-api.dicoding.dev",
  new NetworkFirst({
    cacheName: API_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// Cache images with CacheFirst strategy
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: IMAGE_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Cache map tiles
registerRoute(
  ({ url }) =>
    url.origin === "https://tile.openstreetmap.org" ||
    url.hostname.includes("tile.openstreetmap.org"),
  new CacheFirst({
    cacheName: "map-tiles",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

// Push Notification Handler
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  let notificationData = {
    title: "Dicoding Story",
    options: {
      body: "Ada notifikasi baru untuk Anda",
      icon: "/images/icon-192x192.png",
      badge: "/images/icon-72x72.png",
      tag: "dicoding-story-notification",
      data: {
        url: "/",
      },
    },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || "Dicoding Story",
        options: {
          body: payload.options?.body || payload.body || "Ada notifikasi baru",
          icon: payload.options?.icon || "/images/icon-192x192.png",
          badge: payload.options?.badge || "/images/icon-72x72.png",
          image: payload.options?.image,
          tag: payload.options?.tag || "dicoding-story",
          data: payload.options?.data || payload.data || { url: "/" },
          actions: payload.options?.actions || [
            {
              action: "open",
              title: "Lihat Story",
            },
            {
              action: "close",
              title: "Tutup",
            },
          ],
        },
      };
    } catch (error) {
      console.error("Error parsing push notification:", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData.options
    )
  );
});

// Notification Click Handler
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window open
          for (const client of clientList) {
            if (
              client.url.includes(self.location.origin) &&
              "focus" in client
            ) {
              client.navigate(urlToOpen);
              return client.focus();
            }
          }
          // Open a new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Background Sync for offline data
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag);

  if (event.tag === "sync-stories") {
    event.waitUntil(syncOfflineStories());
  }
});

async function syncOfflineStories() {
  console.log("Syncing offline stories...");

  try {
    // Open IndexedDB
    const db = await openDB();
    const tx = db.transaction("offline-stories", "readonly");
    const store = tx.objectStore("offline-stories");
    const offlineStories = await store.getAll();

    console.log("Found offline stories:", offlineStories.length);

    // Send each offline story to API
    for (const story of offlineStories) {
      try {
        const formData = new FormData();
        formData.append("description", story.description);
        formData.append("photo", story.photo);
        if (story.lat) formData.append("lat", story.lat);
        if (story.lon) formData.append("lon", story.lon);

        const response = await fetch(
          "https://story-api.dicoding.dev/v1/stories",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${story.token}`,
            },
            body: formData,
          }
        );

        if (response.ok) {
          // Delete from IndexedDB after successful upload
          const deleteTx = db.transaction("offline-stories", "readwrite");
          await deleteTx.objectStore("offline-stories").delete(story.id);
          console.log("Story synced and deleted:", story.id);
        }
      } catch (error) {
        console.error("Error syncing story:", error);
      }
    }
  } catch (error) {
    console.error("Error in syncOfflineStories:", error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dicoding-story-db", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(clients.claim());
});
