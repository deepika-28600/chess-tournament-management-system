import { api } from "./apiClient";
import type { ApiEnvelope, AuthUser, LoginResponse } from "../types";

export const authApi = {
  async login(email: string, password: string, rememberMe = false) {
    const { data } = await api.post<ApiEnvelope<LoginResponse>>("/auth/login", {
      email,
      password,
      rememberMe,
    });
    return data.data as LoginResponse;
  },

  async register(name: string, email: string, password: string) {
    const { data } = await api.post<ApiEnvelope<AuthUser>>("/auth/register", {
      name,
      email,
      password,
    });
    return data.data as AuthUser;
  },

  async forgotPassword(email: string) {
    const { data } = await api.post<ApiEnvelope<unknown>>("/auth/forgot-password", { email });
    return data;
  },

  async logout() {
    await api.post("/auth/logout");
  },

  async getProfile() {
    const { data } = await api.get<ApiEnvelope<AuthUser>>("/auth/profile");
    return data.data as AuthUser;
  },
};
