import axios from "axios";
import { getAccessToken, clearTokens } from "../utils/tokenStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const isAuthEndpoint = error.config?.url?.startsWith("/auth/");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      clearTokens();

      localStorage.removeItem("user");
      localStorage.removeItem("condominios");
      localStorage.removeItem("condominioActual");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
