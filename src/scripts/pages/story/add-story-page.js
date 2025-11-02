import apiService from "../../data/api";
import authService from "../../utils/auth";
import idbService from "../../utils/idb";

export default class AddStoryPage {
  constructor() {
    this.map = null;
    this.marker = null;
    this.selectedLocation = null;
    this.selectedFile = null;
    this.mediaStream = null;
    this.videoElement = null;
  }

  async render() {
    return `
      <div class="form-page page">
        <div class="form-container">
          <h1>Tambah Story Baru</h1>
          <p style="text-align: center; color: var(--text-light); margin-bottom: 2rem;">
            Bagikan cerita menarik Anda dengan komunitas
          </p>

          <div id="message-container"></div>

          <form id="add-story-form" novalidate>
            <div class="form-group">
              <label for="description">Deskripsi Story</label>
              <textarea
                id="description"
                name="description"
                placeholder="Ceritakan pengalaman Anda..."
                required
                minlength="10"
                aria-required="true"
              ></textarea>
              <span class="form-error" role="alert">Deskripsi minimal 10 karakter</span>
            </div>

            <div class="form-group">
              <label>Foto Story</label>
              <div class="file-input-group">
                <div class="file-input-wrapper">
                  <input
                    type="file"
                    id="photo"
                    name="photo"
                    accept="image/*"
                    aria-label="Pilih foto dari perangkat"
                  />
                  <label for="photo" class="file-label">
                    📁 Pilih Foto dari Perangkat
                  </label>
                </div>
                <button type="button" class="btn btn-outline" id="camera-btn">
                  📷 Ambil Foto dengan Kamera
                </button>
              </div>
              <span class="form-error" id="photo-error" role="alert" style="display: none;">Foto wajib dipilih (maksimal 1MB)</span>
            </div>

            <div class="camera-section" id="camera-section" style="display: none;">
              <div class="camera-preview">
                <video id="camera-video" autoplay playsinline aria-label="Camera preview"></video>
                <div class="camera-controls">
                  <button type="button" class="btn btn-primary" id="capture-btn">
                    📸 Ambil Foto
                  </button>
                  <button type="button" class="btn btn-secondary" id="close-camera-btn">
                    ❌ Tutup Kamera
                  </button>
                </div>
              </div>
            </div>

            <div class="image-preview" id="image-preview" style="display: none;">
              <label>Preview Foto:</label>
              <img id="preview-image" class="preview-image" alt="Preview foto yang dipilih" />
              <button type="button" class="btn btn-outline" id="remove-image" style="margin-top: 0.5rem;">
                🗑️ Hapus Foto
              </button>
            </div>

            <div class="map-selector">
              <h3>Pilih Lokasi Story (Opsional)</h3>
              <p>Klik pada peta untuk menandai lokasi story Anda</p>
              <div id="location-map" role="region" aria-label="Peta untuk memilih lokasi story"></div>
              <div id="coordinates-display" class="coordinates-display" style="display: none;">
                <strong>Lokasi terpilih:</strong><br>
                <span id="lat-display"></span>, <span id="lon-display"></span>
              </div>
            </div>

            <div class="btn-group">
              <button type="submit" class="btn btn-primary btn-block">
                📤 Posting Story
              </button>
              <a href="#/" class="btn btn-outline btn-block">
                ❌ Batal
              </a>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async afterRender() {
    this.#initMap();
    this.#setupForm();
    this.#setupFileInput();
    this.#setupCamera();
  }

  #initMap() {
    this.map = L.map("location-map").setView([-2.5489, 118.0149], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(this.map);

    // Click event to add marker
    this.map.on("click", (e) => {
      this.#addMarker(e.latlng);
    });
  }

  #addMarker(latlng) {
    // Remove previous marker
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    // Add new marker
    this.marker = L.marker(latlng).addTo(this.map);
    this.selectedLocation = {
      lat: latlng.lat,
      lon: latlng.lng,
    };

    // Display coordinates
    const coordDisplay = document.getElementById("coordinates-display");
    const latDisplay = document.getElementById("lat-display");
    const lonDisplay = document.getElementById("lon-display");

    latDisplay.textContent = `Lat: ${latlng.lat.toFixed(6)}`;
    lonDisplay.textContent = `Lon: ${latlng.lng.toFixed(6)}`;
    coordDisplay.style.display = "block";

    // Center map on marker
    this.map.setView(latlng, 13);
  }

  #setupFileInput() {
    const fileInput = document.getElementById("photo");
    const previewContainer = document.getElementById("image-preview");
    const previewImage = document.getElementById("preview-image");
    const removeBtn = document.getElementById("remove-image");
    const photoError = document.getElementById("photo-error");

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];

      if (file) {
        // Validate file size (max 1MB)
        if (file.size > 1024 * 1024) {
          photoError.textContent = "Ukuran foto maksimal 1MB";
          photoError.style.display = "block";
          fileInput.value = "";
          return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          photoError.textContent = "File harus berupa gambar";
          photoError.style.display = "block";
          fileInput.value = "";
          return;
        }

        photoError.style.display = "none";
        this.selectedFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
          previewImage.src = event.target.result;
          previewContainer.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });

    removeBtn.addEventListener("click", () => {
      fileInput.value = "";
      this.selectedFile = null;
      previewContainer.style.display = "none";
      previewImage.src = "";
    });
  }

  #setupCamera() {
    const cameraBtn = document.getElementById("camera-btn");
    const cameraSection = document.getElementById("camera-section");
    const closeCameraBtn = document.getElementById("close-camera-btn");
    const captureBtn = document.getElementById("capture-btn");
    const videoElement = document.getElementById("camera-video");
    const previewContainer = document.getElementById("image-preview");
    const previewImage = document.getElementById("preview-image");

    this.videoElement = videoElement;

    cameraBtn.addEventListener("click", async () => {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        videoElement.srcObject = this.mediaStream;
        cameraSection.style.display = "block";
        cameraBtn.textContent = "📷 Kamera Aktif";
        cameraBtn.disabled = true;
      } catch (error) {
        console.error("Error accessing camera:", error);
        alert(
          "Tidak dapat mengakses kamera. Pastikan Anda memberikan izin akses kamera."
        );
      }
    });

    closeCameraBtn.addEventListener("click", () => {
      this.#stopCamera();
    });

    captureBtn.addEventListener("click", () => {
      this.#capturePhoto(videoElement, previewImage, previewContainer);
    });
  }

  #capturePhoto(videoElement, previewImage, previewContainer) {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(videoElement, 0, 0);

    canvas.toBlob(
      (blob) => {
        // Check file size
        if (blob.size > 1024 * 1024) {
          alert(
            "Ukuran foto terlalu besar. Coba ambil foto lagi dengan resolusi lebih rendah."
          );
          return;
        }

        const file = new File([blob], "camera-photo.jpg", {
          type: "image/jpeg",
        });
        this.selectedFile = file;

        // Show preview
        previewImage.src = canvas.toDataURL("image/jpeg");
        previewContainer.style.display = "block";

        // Close camera
        this.#stopCamera();

        // Hide photo error
        document.getElementById("photo-error").style.display = "none";
      },
      "image/jpeg",
      0.9
    );
  }

  #stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    const cameraSection = document.getElementById("camera-section");
    const cameraBtn = document.getElementById("camera-btn");

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    cameraSection.style.display = "none";
    cameraBtn.textContent = "📷 Ambil Foto dengan Kamera";
    cameraBtn.disabled = false;
  }

  #setupForm() {
    const form = document.getElementById("add-story-form");
    const messageContainer = document.getElementById("message-container");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const description = document.getElementById("description").value.trim();
      const photoError = document.getElementById("photo-error");

      // Validation
      if (description.length < 10) {
        messageContainer.innerHTML =
          '<div class="message error">Deskripsi minimal 10 karakter</div>';
        return;
      }

      if (!this.selectedFile) {
        photoError.textContent = "Foto wajib dipilih";
        photoError.style.display = "block";
        messageContainer.innerHTML =
          '<div class="message error">Mohon pilih foto terlebih dahulu</div>';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Mengirim...";
      messageContainer.innerHTML = "";

      try {
        // Prepare form data
        const formData = new FormData();
        formData.append("description", description);
        formData.append("photo", this.selectedFile);

        // Add location if selected
        if (this.selectedLocation) {
          formData.append("lat", this.selectedLocation.lat);
          formData.append("lon", this.selectedLocation.lon);
        }

        // Send to API
        const token = authService.getToken();
        await apiService.addStory(token, formData);

        messageContainer.innerHTML =
          '<div class="message success">✅ Story berhasil ditambahkan!</div>';

        // Stop camera if still active
        this.#stopCamera();

        // Redirect to home after 1.5 seconds
        setTimeout(() => {
          window.location.hash = "/";
        }, 1500);
      } catch (error) {
        console.error("Error adding story:", error);
        messageContainer.innerHTML = `<div class="message error">❌ ${error.message}</div>`;
        submitBtn.disabled = false;
        submitBtn.textContent = "📤 Posting Story";
      }
    });

    // Real-time validation for textarea
    const textarea = document.getElementById("description");
    textarea.addEventListener("input", () => {
      textarea.checkValidity();
    });
  }
}
