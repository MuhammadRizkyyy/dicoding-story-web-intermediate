export default class AboutPage {
  async render() {
    return `
      <div class="container page">
        <section class="page-header">
          <h1>Tentang Dicoding Story</h1>
          <p>Platform berbagi cerita untuk komunitas Dicoding</p>
        </section>

        <section style="max-width: 800px; margin: 0 auto; background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px var(--shadow);">
          <h2 style="color: var(--primary-color); margin-bottom: 1rem;">Apa itu Dicoding Story?</h2>
          <p style="margin-bottom: 1.5rem; line-height: 1.8; color: var(--text-color);">
            Dicoding Story adalah platform berbagi cerita yang dirancang khusus untuk komunitas Dicoding. 
            Di sini, Anda dapat berbagi pengalaman belajar, pencapaian, dan cerita inspiratif Anda dengan 
            anggota komunitas lainnya di seluruh Indonesia.
          </p>

          <h2 style="color: var(--primary-color); margin-bottom: 1rem;">Fitur Utama</h2>
          <ul style="margin-bottom: 1.5rem; line-height: 2; color: var(--text-color); padding-left: 1.5rem;">
            <li><strong>Berbagi Story:</strong> Posting cerita dengan foto dan deskripsi</li>
            <li><strong>Peta Interaktif:</strong> Lihat story dari berbagai lokasi di Indonesia</li>
            <li><strong>Multiple Tile Layer:</strong> Pilih tampilan peta sesuai preferensi</li>
            <li><strong>Highlight Marker:</strong> Sinkronisasi antara list story dan peta</li>
            <li><strong>Camera Access:</strong> Ambil foto langsung dari kamera</li>
            <li><strong>Responsive Design:</strong> Akses dari berbagai perangkat</li>
          </ul>

          <h2 style="color: var(--primary-color); margin-bottom: 1rem;">Cara Menggunakan</h2>
          <ol style="margin-bottom: 1.5rem; line-height: 2; color: var(--text-color); padding-left: 1.5rem;">
            <li>Daftar akun baru atau login jika sudah memiliki akun</li>
            <li>Klik menu "Tambah Story" untuk membuat story baru</li>
            <li>Isi deskripsi dan upload foto (atau ambil dari kamera)</li>
            <li>Klik pada peta untuk menandai lokasi story (opsional)</li>
            <li>Klik "Posting Story" untuk membagikan cerita Anda</li>
            <li>Lihat dan jelajahi story dari pengguna lain di halaman beranda</li>
          </ol>

          <h2 style="color: var(--primary-color); margin-bottom: 1rem;">Teknologi yang Digunakan</h2>
          <ul style="margin-bottom: 1.5rem; line-height: 2; color: var(--text-color); padding-left: 1.5rem;">
            <li><strong>Vite:</strong> Build tool untuk development yang cepat</li>
            <li><strong>Leaflet:</strong> Library untuk peta interaktif</li>
            <li><strong>Fetch API:</strong> Komunikasi dengan backend API</li>
            <li><strong>MediaDevices API:</strong> Akses kamera perangkat</li>
            <li><strong>LocalStorage API:</strong> Menyimpan data autentikasi</li>
            <li><strong>View Transition API:</strong> Transisi halaman yang mulus</li>
          </ul>

          <div style="text-align: center; margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border);">
            <p style="color: var(--text-light); margin-bottom: 1rem;">
              Dibuat dengan ❤️ untuk submission Dicoding
            </p>
            <a href="#/" class="btn btn-primary">Kembali ke Beranda</a>
          </div>
        </section>
      </div>
    `;
  }

  async afterRender() {}
}
