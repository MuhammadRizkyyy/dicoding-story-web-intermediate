import { openDB } from "idb";

const DB_NAME = "dicoding-story-db";
const DB_VERSION = 1;

class IDBService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Favorites store
        if (!db.objectStoreNames.contains("favorites")) {
          const favStore = db.createObjectStore("favorites", {
            keyPath: "id",
          });
          favStore.createIndex("createdAt", "createdAt");
        }

        // Offline stories store (for sync)
        if (!db.objectStoreNames.contains("offline-stories")) {
          const offlineStore = db.createObjectStore("offline-stories", {
            keyPath: "id",
            autoIncrement: true,
          });
          offlineStore.createIndex("timestamp", "timestamp");
        }

        // Cache stories for offline viewing
        if (!db.objectStoreNames.contains("cached-stories")) {
          const cacheStore = db.createObjectStore("cached-stories", {
            keyPath: "id",
          });
          cacheStore.createIndex("timestamp", "timestamp");
        }
      },
    });

    return this.db;
  }

  // === FAVORITES ===

  async addFavorite(story) {
    const db = await this.init();
    const favoriteData = {
      ...story,
      savedAt: new Date().toISOString(),
    };
    return await db.add("favorites", favoriteData);
  }

  async removeFavorite(id) {
    const db = await this.init();
    return await db.delete("favorites", id);
  }

  async getFavorite(id) {
    const db = await this.init();
    return await db.get("favorites", id);
  }

  async getAllFavorites() {
    const db = await this.init();
    return await db.getAll("favorites");
  }

  async isFavorite(id) {
    const favorite = await this.getFavorite(id);
    return !!favorite;
  }

  async searchFavorites(query) {
    const favorites = await this.getAllFavorites();
    if (!query) return favorites;

    const lowerQuery = query.toLowerCase();
    return favorites.filter(
      (story) =>
        story.name?.toLowerCase().includes(lowerQuery) ||
        story.description?.toLowerCase().includes(lowerQuery)
    );
  }

  async sortFavorites(sortBy = "newest") {
    const favorites = await this.getAllFavorites();

    return favorites.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.savedAt) - new Date(a.savedAt);
        case "oldest":
          return new Date(a.savedAt) - new Date(b.savedAt);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }

  // === OFFLINE STORIES (for sync) ===

  async addOfflineStory(storyData) {
    const db = await this.init();
    const data = {
      ...storyData,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    return await db.add("offline-stories", data);
  }

  async getOfflineStories() {
    const db = await this.init();
    return await db.getAll("offline-stories");
  }

  async deleteOfflineStory(id) {
    const db = await this.init();
    return await db.delete("offline-stories", id);
  }

  async clearOfflineStories() {
    const db = await this.init();
    const tx = db.transaction("offline-stories", "readwrite");
    await tx.objectStore("offline-stories").clear();
  }

  // === CACHED STORIES (for offline viewing) ===

  async cacheStories(stories) {
    const db = await this.init();
    const tx = db.transaction("cached-stories", "readwrite");
    const store = tx.objectStore("cached-stories");

    for (const story of stories) {
      await store.put({
        ...story,
        cachedAt: new Date().toISOString(),
      });
    }

    return await tx.done;
  }

  async getCachedStories() {
    const db = await this.init();
    return await db.getAll("cached-stories");
  }

  async clearOldCache(maxAge = 7 * 24 * 60 * 60 * 1000) {
    // 7 days
    const db = await this.init();
    const stories = await db.getAll("cached-stories");
    const now = Date.now();

    const tx = db.transaction("cached-stories", "readwrite");
    const store = tx.objectStore("cached-stories");

    for (const story of stories) {
      const age = now - new Date(story.cachedAt).getTime();
      if (age > maxAge) {
        await store.delete(story.id);
      }
    }

    return await tx.done;
  }
}

export default new IDBService();
