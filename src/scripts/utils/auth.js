import CONFIG from "../config.js";

class AuthService {
  saveToken(token) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
  }

  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  }

  saveUser(user) {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  }

  getUser() {
    const user = localStorage.getItem(CONFIG.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  }
}

export default new AuthService();
