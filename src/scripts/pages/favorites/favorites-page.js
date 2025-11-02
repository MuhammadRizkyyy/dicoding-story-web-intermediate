import idbService from "../../utils/idb";
import pushNotificationService from "../../utils/push-notification";
import authService from "../../utils/auth";
import { showFormattedDate } from "../../utils/index";

export default class FavoritesPage {
  constructor() {
    this.favorites = [];
    this.filteredFavorites = [];
    this.currentSort = "newest";
  }

  async render() {
    return `
      <div class="container page">
        <header class="page-header">
          <h1>Story Favorit</h1>
          <p>Kelola dan akses story favorit Anda secara offline</p>
        </header>

        <!-- Push Notification Toggle -->
        <div class="notification-toggle">
          <div class="notification-info">
            <h3>🔔 Push Notification</h3>
            <p id="notification-status">Aktifkan untuk mendapat update story terbaru</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="notification-toggle" aria-label="Toggle push notification">
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- Sync Status -->
        <div id="sync-status" class="sync-status" style="display: none;">
          <div class="sync-info">
            <span class="sync-icon" id="sync-icon">🔄</span>
            <div>
              <strong id="sync-message">Sinkronisasi data...</strong>
              <p id="sync-detail" style="font-size: 0.9rem; color: var(--text-light);"></p>
            </div>
          </div>
          <button class="btn btn-outline" id="sync-now-btn">Sync Sekarang</button>
        </div>

        <!-- Favorites Controls -->
        <div class="favorites-header">
          <h2>Daftar Favorit (<span id="favorites-count">0</span>)</h2>
          <div class="favorites-controls">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input 
                type="search" 
                id="search-input" 
                placeholder="Cari story..."
                aria-label="Cari story favorit"
              />
            </div>
            <select id="sort-select" class="sort-select" aria-label="Urutkan story">
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="name">Nama A-Z</option>
            </select>
          </div>
        </div>

        <!-- Favorites List -->
        <div id="favorites-list" class="story-list" role="list"></div>

        <!-- Empty State -->
        <div id="empty-state" class="empty-state" style="display: none;">
          <div class="empty-state-icon">💔</div>
          <h3>Belum Ada Favorit</h3>
          <p>Tambahkan story ke favorit dari halaman beranda</p>
          <a href="#/" class="btn btn-primary" style="margin-top: 1rem;">Jelajahi Story</a>
        </div>

        <div id="loading" class="loading" style="display: none;">
          <div class="spinner" role="status" aria-label="Loading"></div>
          <p>Memuat favorit...</p>
        </div>

        <div id="message-container"></div>
      </div>
    `;
  }

  async afterRender() {
    await this.#initializePage();
  }

  async #initializePage() {
    await this.#loadFavorites();
    this.#setupEventListeners();
    await this.#setupNotificationToggle();
    await this.#checkOfflineStories();
  }

  async #loadFavorites() {
    const loadingEl = document.getElementById("loading");
    const listEl = document.getElementById("favorites-list");
    const emptyState = document.getElementById("empty-state");
    const countEl = document.getElementById("favorites-count");

    try {
      loadingEl.style.display = "block";

      this.favorites = await idbService.getAllFavorites();
      this.filteredFavorites = [...this.favorites];

      loadingEl.style.display = "none";
      countEl.textContent = this.favorites.length;

      if (this.favorites.length === 0) {
        listEl.innerHTML = "";
        emptyState.style.display = "block";
      } else {
        emptyState.style.display = "none";
        this.#displayFavorites();
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
      loadingEl.style.display = "none";
      this.#showMessage("error", "Gagal memuat favorit");
    }
  }

  #displayFavorites() {
    const listEl = document.getElementById("favorites-list");

    listEl.innerHTML = this.filteredFavorites
      .map(
        (story) => `
      <article class="story-card" data-id="${
        story.id
      }" role="listitem" tabindex="0">
        <button 
          class="favorite-badge active" 
          data-id="${story.id}"
          aria-label="Hapus dari favorit"
          title="Hapus dari favorit"
        >
          ❤️
        </button>
        <img 
          src="${story.photoUrl}" 
          alt="Foto story dari ${story.name}"
          class="story-image"
        />
        <div class="story-content">
          <h3>${story.name}</h3>
          <p class="story-description">${story.description}</p>
          <div class="story-meta">
            <span class="story-date">📅 ${showFormattedDate(
              story.createdAt,
              "id-ID"
            )}</span>
            <span class="story-date">💾 ${showFormattedDate(
              story.savedAt,
              "id-ID"
            )}</span>
          </div>
        </div>
      </article>
    `
      )
      .join("");

    this.#setupFavoriteButtons();
  }

  #setupFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll(".favorite-badge");

    favoriteButtons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const storyId = btn.dataset.id;
        await this.#removeFavorite(storyId);
      });
    });
  }

  async #removeFavorite(storyId) {
    try {
      await idbService.removeFavorite(storyId);
      this.#showMessage("success", "Story dihapus dari favorit");
      await this.#loadFavorites();
    } catch (error) {
      console.error("Error removing favorite:", error);
      this.#showMessage("error", "Gagal menghapus favorit");
    }
  }

  #setupEventListeners() {
    // Search
    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", (e) => {
      this.#filterFavorites(e.target.value);
    });

    // Sort
    const sortSelect = document.getElementById("sort-select");
    sortSelect.addEventListener("change", async (e) => {
      this.currentSort = e.target.value;
      await this.#sortFavorites();
    });

    // Sync button
    const syncBtn = document.getElementById("sync-now-btn");
    if (syncBtn) {
      syncBtn.addEventListener("click", async () => {
        await this.#syncOfflineStories();
      });
    }
  }

  async #filterFavorites(query) {
    if (!query.trim()) {
      this.filteredFavorites = [...this.favorites];
    } else {
      const lowerQuery = query.toLowerCase();
      this.filteredFavorites = this.favorites.filter(
        (story) =>
          story.name?.toLowerCase().includes(lowerQuery) ||
          story.description?.toLowerCase().includes(lowerQuery)
      );
    }

    this.#displayFavorites();
    document.getElementById("favorites-count").textContent =
      this.filteredFavorites.length;
  }

  async #sortFavorites() {
    this.filteredFavorites = await idbService.sortFavorites(this.currentSort);
    this.#displayFavorites();
  }

  async #setupNotificationToggle() {
    const toggle = document.getElementById("notification-toggle");
    const statusText = document.getElementById("notification-status");

    if (!toggle) return;

    // Check current subscription status
    const isSubscribed = await pushNotificationService.isSubscribed();
    toggle.checked = isSubscribed;

    if (isSubscribed) {
      statusText.textContent =
        "Notifikasi aktif - Anda akan menerima update story";
    }

    toggle.addEventListener("change", async (e) => {
      const messageContainer = document.getElementById("message-container");

      try {
        const token = authService.getToken();
        if (!token) {
          this.#showMessage("error", "Silakan login terlebih dahulu");
          e.target.checked = false;
          return;
        }

        if (e.target.checked) {
          // Subscribe
          statusText.textContent = "Mengaktifkan notifikasi...";
          const result = await pushNotificationService.subscribe(token);

          if (result.success) {
            statusText.textContent =
              "Notifikasi aktif - Anda akan menerima update story";
            this.#showMessage(
              "success",
              "✅ Push notification berhasil diaktifkan!"
            );

            // Test notification
            await pushNotificationService.testNotification();
          }
        } else {
          // Unsubscribe
          statusText.textContent = "Menonaktifkan notifikasi...";
          await pushNotificationService.unsubscribe(token);
          statusText.textContent =
            "Aktifkan untuk mendapat update story terbaru";
          this.#showMessage("info", "Push notification dinonaktifkan");
        }
      } catch (error) {
        console.error("Error toggling notification:", error);
        this.#showMessage(
          "error",
          `Gagal mengubah status notifikasi: ${error.message}`
        );
        e.target.checked = !e.target.checked;
        statusText.textContent = "Aktifkan untuk mendapat update story terbaru";
      }
    });
  }

  async #checkOfflineStories() {
    const offlineStories = await idbService.getOfflineStories();
    const syncStatus = document.getElementById("sync-status");
    const syncMessage = document.getElementById("sync-message");
    const syncDetail = document.getElementById("sync-detail");

    if (offlineStories.length > 0) {
      syncStatus.style.display = "flex";
      syncMessage.textContent = `${offlineStories.length} story menunggu sinkronisasi`;
      syncDetail.textContent = "Story akan otomatis tersinkron saat online";

      // Auto sync if online
      if (navigator.onLine) {
        await this.#syncOfflineStories();
      }
    } else {
      syncStatus.style.display = "none";
    }
  }

  async #syncOfflineStories() {
    const syncIcon = document.getElementById("sync-icon");
    const syncMessage = document.getElementById("sync-message");
    const syncDetail = document.getElementById("sync-detail");

    try {
      syncIcon.classList.add("syncing");
      syncMessage.textContent = "Menyinkronkan...";

      const offlineStories = await idbService.getOfflineStories();

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
            await idbService.deleteOfflineStory(story.id);
            console.log("Story synced:", story.id);
          }
        } catch (error) {
          console.error("Error syncing story:", error);
        }
      }

      syncIcon.classList.remove("syncing");

      const remaining = await idbService.getOfflineStories();
      if (remaining.length === 0) {
        document.getElementById("sync-status").style.display = "none";
        this.#showMessage("success", "✅ Semua story berhasil disinkronkan!");
      } else {
        syncMessage.textContent = `${remaining.length} story menunggu sinkronisasi`;
        syncDetail.textContent = "Beberapa story gagal disinkronkan";
      }
    } catch (error) {
      console.error("Error in sync process:", error);
      syncIcon.classList.remove("syncing");
      this.#showMessage("error", "Gagal menyinkronkan story");
    }
  }

  #showMessage(type, message) {
    const container = document.getElementById("message-container");
    container.innerHTML = `<div class="message ${type}">${message}</div>`;

    setTimeout(() => {
      container.innerHTML = "";
    }, 5000);
  }
}
