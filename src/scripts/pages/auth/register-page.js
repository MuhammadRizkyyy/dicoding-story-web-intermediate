import apiService from "../../data/api";

export default class RegisterPage {
  async render() {
    return `
      <div class="form-page page">
        <div class="form-container">
          <h1>Daftar Akun Baru</h1>
          <p style="text-align: center; color: var(--text-light); margin-bottom: 2rem;">
            Buat akun untuk mulai berbagi cerita
          </p>

          <div id="message-container"></div>

          <form id="register-form" novalidate>
            <div class="form-group">
              <label for="name">Nama Lengkap</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Masukkan nama lengkap Anda"
                required
                minlength="3"
                aria-required="true"
              />
              <span class="form-error" role="alert">Nama minimal 3 karakter</span>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Masukkan email Anda"
                required
                aria-required="true"
              />
              <span class="form-error" role="alert">Email harus valid</span>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Minimal 8 karakter"
                required
                minlength="8"
                aria-required="true"
              />
              <span class="form-error" role="alert">Password minimal 8 karakter</span>
            </div>

            <div class="form-group">
              <label for="confirm-password">Konfirmasi Password</label>
              <input
                type="password"
                id="confirm-password"
                name="confirm-password"
                placeholder="Ulangi password Anda"
                required
                minlength="8"
                aria-required="true"
              />
              <span class="form-error" role="alert">Password tidak cocok</span>
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              Daftar
            </button>
          </form>

          <div class="auth-toggle">
            <p>Sudah punya akun? <a href="#/login">Login di sini</a></p>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    this.#setupForm();
  }

  #setupForm() {
    const form = document.getElementById("register-form");
    const messageContainer = document.getElementById("message-container");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirm-password").value;

      // Validation
      if (!this.#validateForm(name, email, password, confirmPassword)) {
        messageContainer.innerHTML =
          '<div class="message error">Mohon isi semua field dengan benar</div>';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Mendaftar...";
      messageContainer.innerHTML = "";

      try {
        await apiService.register(name, email, password);

        messageContainer.innerHTML =
          '<div class="message success">Registrasi berhasil! Mengalihkan ke halaman login...</div>';

        setTimeout(() => {
          window.location.hash = "/login";
        }, 2000);
      } catch (error) {
        console.error("Registration error:", error);
        messageContainer.innerHTML = `<div class="message error">${error.message}</div>`;
        submitBtn.disabled = false;
        submitBtn.textContent = "Daftar";
      }
    });

    const inputs = form.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        this.#validateInput(input);
      });
    });

    // Password  validation
    const confirmPasswordInput = document.getElementById("confirm-password");
    confirmPasswordInput.addEventListener("input", () => {
      this.#checkPasswordMatch();
    });
  }

  #validateInput(input) {
    if (input.id === "confirm-password") {
      this.#checkPasswordMatch();
    } else {
      input.checkValidity();
    }
  }

  #checkPasswordMatch() {
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password");

    if (confirmPassword.value && password !== confirmPassword.value) {
      confirmPassword.setCustomValidity("Password tidak cocok");
    } else {
      confirmPassword.setCustomValidity("");
    }
  }

  #validateForm(name, email, password, confirmPassword) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      name.length >= 3 &&
      emailRegex.test(email) &&
      password.length >= 8 &&
      password === confirmPassword
    );
  }
}
