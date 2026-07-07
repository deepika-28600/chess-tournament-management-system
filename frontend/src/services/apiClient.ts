import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

function getStoredTokens() {
  const raw = localStorage.getItem("chess_auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { accessToken: string; refreshToken: string };
  } catch {
    return null;
  }
}

function storeTokens(accessToken: string, refreshToken: string) {
  const raw = localStorage.getItem("chess_auth");
  const existing = raw ? JSON.parse(raw) : {};
  localStorage.setItem("chess_auth", JSON.stringify({ ...existing, accessToken, refreshToken }));
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = getStoredTokens();
  if (tokens?.accessToken) {
    config.headers.set?.("Authorization", `Bearer ${tokens.accessToken}`);
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const tokens = getStoredTokens();
      if (!tokens?.refreshToken) {
        localStorage.removeItem("chess_auth");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve(api(originalRequest)));
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        });
        storeTokens(data.data.accessToken, data.data.refreshToken);
        pendingQueue.forEach((cb) => cb());
        pendingQueue = [];
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("chess_auth");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
