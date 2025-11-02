import apiService from "../../data/api";
import authService from "../../utils/auth";
import idbService from "../../utils/idb";
import { showFormattedDate } from "../../utils/index";

export default class HomePage {
  constructor() {
    this.stories = [];
    this.map = null;
    this.markers = [];
    this.activeMarkerId = null;
    this.currentTileIndex = 0;
    this.tileLayers = [
      {
        name: "Street Map",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "© OpenStreetMap contributors",
      },
      {
        name: "Satellite",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "© Esri",
      },
      {
        name: "Dark Mode",
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: "© OpenStreetMap © CARTO",
      },
    ];
  }

  async render() {
    return `
      <div class="container page">
        <header class="page-header">
          <h1>Explore Dicoding Stories</h1>
          <p>Temukan cerita-cerita menarik dari komunitas Dicoding di seluruh dunia</p>
        </header>

        <section class="map-section">
          <div class="map-controls">
            <h2>Kontrol Peta</h2>
            <div class="filter-buttons">
              <button class="filter-btn active" data-filter="all" aria-pressed="true">
                Tampilkan Semua Story
              </button>
              <button class="filter-btn" data-filter="location" aria-pressed="false">
                Story dengan Lokasi Saja
              </button>
              <button class="btn btn-outline" id="toggle-tile" aria-label="Switch map view">
                Ganti Tampilan: Street Map
              </button>
            </div>
          </div>
          <div id="map" role="region" aria-label="Peta interaktif menampilkan lokasi story"></div>
        </section>

        <section class="stories-section">
          <h2 class="sr-only">Daftar Story</h2>
          <div id="story-list" class="story-list" role="list"></div>
        </section>

        <div id="loading" class="loading" style="display: none;">
          <div class="spinner" role="status" aria-label="Loading"></div>
          <p>Memuat story...</p>
        </div>

        <div id="error-message"></div>
      </div>
    `;
  }

  async afterRender() {
    await this.#initializePage();
  }

  async #initializePage() {
    this.#initMap();
    await this.#loadStories();
    this.#setupEventListeners();
  }

  #initMap() {
    this.map = L.map("map").setView([-2.5489, 118.0149], 5);

    this.currentLayer = L.tileLayer(this.tileLayers[0].url, {
      attribution: this.tileLayers[0].attribution,
      maxZoom: 19,
    }).addTo(this.map);
  }

  async #loadStories(location = 1) {
    const loadingEl = document.getElementById("loading");
    const errorEl = document.getElementById("error-message");

    try {
      loadingEl.style.display = "block";
      errorEl.innerHTML = "";

      const token = authService.getToken();
      if (!token) {
        errorEl.innerHTML =
          '<div class="message error container">Silakan login terlebih dahulu untuk melihat story.</div>';
        loadingEl.style.display = "none";
        return;
      }

      const response = await apiService.getAllStories(token, location);
      this.stories = response.listStory || [];

      this.#displayStories();
      this.#addMarkersToMap();

      loadingEl.style.display = "none";
    } catch (error) {
      console.error("Error loading stories:", error);
      errorEl.innerHTML = `<div class="message error container">${error.message}</div>`;
      loadingEl.style.display = "none";
    }
  }

  #displayStories() {
    const storyListEl = document.getElementById("story-list");

    if (this.stories.length === 0) {
      storyListEl.innerHTML =
        '<div class="container"><p class="message info">Belum ada story yang tersedia.</p></div>';
      return;
    }

    storyListEl.innerHTML = this.stories
      .map(
        (story) => `
      <article class="story-card" data-id="${
        story.id
      }" role="listitem" tabindex="0">
        <img 
          src="${story.photoUrl}" 
          alt="Foto story dari ${story.name}"
          class="story-image"
        />
        <div class="story-content">
          <h3>${story.name}</h3>
          <p class="story-description">${story.description}</p>
          <div class="story-meta">
            <span class="story-date">${showFormattedDate(
              story.createdAt,
              "id-ID"
            )}</span>
            ${story.lat && story.lon ? "<span>📍 Lokasi tersedia</span>" : ""}
          </div>
        </div>
      </article>
    `
      )
      .join("");

    this.#setupCardInteractions();
  }

  #setupCardInteractions() {
    const cards = document.querySelectorAll(".story-card");

    cards.forEach((card) => {
      const storyId = card.dataset.id;

      const handleClick = () => {
        this.#highlightStory(storyId);
      };

      card.addEventListener("click", handleClick);
      card.addEventListener("keypress", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      });
    });
  }

  #highlightStory(storyId) {
    // Remove previous highlight
    document.querySelectorAll(".story-card").forEach((card) => {
      card.classList.remove("active");
    });

    // Highlight selected card
    const selectedCard = document.querySelector(`[data-id="${storyId}"]`);
    if (selectedCard) {
      selectedCard.classList.add("active");
      selectedCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // Find and open marker popup
    const story = this.stories.find((s) => s.id === storyId);
    if (story && story.lat && story.lon) {
      this.map.setView([story.lat, story.lon], 13);

      const marker = this.markers.find((m) => m.storyId === storyId);
      if (marker) {
        marker.openPopup();
      }
    }

    this.activeMarkerId = storyId;
  }

  #addMarkersToMap() {
    // Clear existing markers
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];

    this.stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(this.map)
          .bindPopup(`
            <div class="popup-content">
              <img src="${story.photoUrl}" alt="Foto story dari ${
          story.name
        }" />
              <h4>${story.name}</h4>
              <p>${story.description.substring(0, 100)}${
          story.description.length > 100 ? "..." : ""
        }</p>
              <small>${showFormattedDate(story.createdAt, "id-ID")}</small>
            </div>
          `);

        marker.storyId = story.id;

        marker.on("click", () => {
          this.#highlightStory(story.id);
        });

        this.markers.push(marker);
      }
    });

    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  #setupEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        filterButtons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");

        const filter = btn.dataset.filter;
        const location = filter === "location" ? 1 : 0;
        await this.#loadStories(location);
      });
    });

    // Toggle tile layer
    const toggleBtn = document.getElementById("toggle-tile");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.currentTileIndex =
          (this.currentTileIndex + 1) % this.tileLayers.length;
        const newTile = this.tileLayers[this.currentTileIndex];

        this.map.removeLayer(this.currentLayer);
        this.currentLayer = L.tileLayer(newTile.url, {
          attribution: newTile.attribution,
          maxZoom: 19,
        }).addTo(this.map);

        toggleBtn.textContent = `Ganti Tampilan: ${newTile.name}`;
      });
    }
  }
}
