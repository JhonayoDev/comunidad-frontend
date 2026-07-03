import axios from "axios";

// Instancia dedicada solo para /auth/*
// withCredentials: true → necesario para que el browser
// envíe y reciba la cookie httpOnly del refreshToken
const authHttp = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 10000,
});

export const authService = {
  login(email, password) {
    return authHttp.post("/auth/login", { email, password });
  },

  refresh() {
    // No envía body — el browser adjunta la cookie automáticamente
    return authHttp.post("/auth/refresh");
  },

  logout(token) {
    return authHttp.post(
      "/auth/logout",
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
  },

  forgotPassword(email) {
    return authHttp.post("/auth/forgot-password", { email });
  },

  resetPassword({ token, newPassword, confirmPassword }) {
    return authHttp.post("/auth/reset-password", {
      token,
      newPassword,
      confirmPassword,
    });
  },

  setupPassword({ token, newPassword, confirmPassword }) {
    return authHttp.post("/auth/setup-password", {
      token,
      newPassword,
      confirmPassword,
    });
  },
};
