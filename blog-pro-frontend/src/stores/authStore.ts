"use client";

import { create } from "zustand";
import api from "@/lib/api";

interface AuthState {
  isLoggedIn: boolean;
  nickname: string;
  role: string;
  login: (username: string, password: string) => Promise<string>;
  register: (username: string, password: string, nickname: string) => Promise<string>;
  logout: () => void;
  checkLogin: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
  nickname: typeof window !== "undefined" ? localStorage.getItem("nickname") || "" : "",
  role: typeof window !== "undefined" ? localStorage.getItem("role") || "" : "",

  login: async (username, password) => {
    const res = await api.post("/user/login", { username, password });
    if (res.data.code === 200) {
      localStorage.setItem("accessToken", res.data.data.accessToken);
      localStorage.setItem("refreshToken", res.data.data.refreshToken);
      localStorage.setItem("nickname", res.data.data.nickname);
      localStorage.setItem("role", res.data.data.role);
      set({ isLoggedIn: true, nickname: res.data.data.nickname, role: res.data.data.role });
      return "";
    }
    return res.data.message || "登录失败";
  },

  register: async (username, password, nickname) => {
    const res = await api.post("/user/register", { username, password, nickname });
    if (res.data.code === 200) return "";
    return res.data.message || "注册失败";
  },

  logout: () => {
    localStorage.clear();
    set({ isLoggedIn: false, nickname: "", role: "" });
  },

  checkLogin: () => {
    set({
      isLoggedIn: !!localStorage.getItem("accessToken"),
      nickname: localStorage.getItem("nickname") || "",
      role: localStorage.getItem("role") || "",
    });
  },
}));
