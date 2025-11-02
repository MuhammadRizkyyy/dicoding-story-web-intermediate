import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import authService from "../utils/auth";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
    this.#updateAuthUI();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      const isOpen = this.#navigationDrawer.classList.toggle("open");
      this.#drawerButton.setAttribute("aria-expanded", isOpen);
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
        this.#drawerButton.setAttribute("aria-expanded", "false");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
          this.#drawerButton.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  #updateAuthUI() {
    const authLink = document.getElementById("auth-link");
    const addStoryLink = document.getElementById("add-story-link");

    if (authService.isAuthenticated()) {
      const user = authService.getUser();
      authLink.textContent = user ? `Logout (${user.name})` : "Logout";
      authLink.href = "#/logout";
      authLink.onclick = (e) => {
        e.preventDefault();
        authService.logout();
        window.location.hash = "/login";
      };

      if (addStoryLink) {
        addStoryLink.style.display = "block";
      }
    } else {
      authLink.textContent = "Login";
      authLink.href = "#/login";
      authLink.onclick = null;

      if (addStoryLink) {
        addStoryLink.style.display = "none";
      }
    }
  }

  #checkAuth(url) {
    const protectedRoutes = ["/add-story"];
    const authRoutes = ["/login", "/register"];

    if (protectedRoutes.includes(url) && !authService.isAuthenticated()) {
      window.location.hash = "/login";
      return false;
    }

    if (authRoutes.includes(url) && authService.isAuthenticated()) {
      window.location.hash = "/";
      return false;
    }

    return true;
  }

  async renderPage() {
    const url = getActiveRoute();

    if (!this.#checkAuth(url)) {
      return;
    }

    const page = routes[url] || routes["/"];

    // View Transition API
    if (document.startViewTransition) {
      await document.startViewTransition(async () => {
        this.#content.innerHTML = await page.render();
      }).finished;
    } else {
      this.#content.innerHTML = await page.render();
    }

    await page.afterRender();
    this.#updateAuthUI();

    // Scroll to top after page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export default App;
