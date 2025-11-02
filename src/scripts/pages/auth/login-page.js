import apiService from "../../data/api";
import authService from "../../utils/auth";

export default class LoginPage {
  async render() {
    return `
      <div class="form-page page">
        <div class="form-container">
          <h1>Login</h1>
          <p style="text-align: center; color: var(--text-light); margin-bottom: 2rem;">
            Masuk untuk berbagi cerita Anda
          </p>

          <div id="message-container"></div>

          <form id="login-form" novalidate>
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
                placeholder="Masukkan password Anda"
                required
                minlength="8"
                aria-required="true"
              />
              <span class="form-error" role="alert">Password minimal 8 karakter</span>
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              Login
            </button>
          </form>

          <div class="auth-toggle">
            <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    this.#setupForm();
  }

  #setupForm() {
    const form = document.getElementById("login-form");
    const messageContainer = document.getElementById("message-container");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      // Validation
      if (!this.#validateForm(email, password)) {
        messageContainer.innerHTML =
          '<div class="message error">Mohon isi semua field dengan benar</div>';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Loading...";
      messageContainer.innerHTML = "";

      try {
        const response = await apiService.login(email, password);

        authService.saveToken(response.loginResult.token);
        authService.saveUser({
          userId: response.loginResult.userId,
          name: response.loginResult.name,
        });

        messageContainer.innerHTML =
          '<div class="message success">Login berhasil! Mengalihkan...</div>';

        setTimeout(() => {
          window.location.hash = "/";
        }, 1000);
      } catch (error) {
        console.error("Login error:", error);
        messageContainer.innerHTML = `<div class="message error">${error.message}</div>`;
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
      }
    });

    // Real-time validation
    const inputs = form.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        input.checkValidity();
      });
    });
  }

  #validateForm(email, password) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && password.length >= 8;
  }
}
