"use client";

import axios from "axios";

/**
 * API 请求工具
 * 自动：带 JWT Token、401 静默刷新、刷新失败跳转登录
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
  timeout: 30000,
});

// ===== Token 静默刷新逻辑 =====

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/** 处理刷新完成后的队列：成功则重试，失败则拒绝 */
function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

// 请求拦截器：自动加 Authorization 头
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：401 时尝试静默刷新 Token
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // 只对 401 且不是刷新接口本身的请求尝试刷新
    if (err.response?.status !== 401 || originalRequest.url === "/user/refresh") {
      // 非 401 错误直接 reject
      if (err.response?.status !== 401) return Promise.reject(err);
      // /user/refresh 本身 401 → 刷新失败，回登录页
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("nickname");
      window.location.href = "/login";
      return Promise.reject(err);
    }

    // 防止重试循环：已重试过的请求不再刷新
    if (originalRequest._retry) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("nickname");
      window.location.href = "/login";
      return Promise.reject(err);
    }

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      // 无 refreshToken，直接跳登录
      localStorage.removeItem("accessToken");
      localStorage.removeItem("nickname");
      window.location.href = "/login";
      return Promise.reject(err);
    }

    // 如果正在刷新中，将请求加入队列等待
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch(() => Promise.reject(err));
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/user/refresh`,
        { refreshToken }
      );

      if (res.data.code === 200) {
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // 处理队列中的请求
        processQueue(null, accessToken);

        // 重试原始请求
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } else {
        // 刷新接口返回非 200
        processQueue(new Error("refresh failed"), null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("nickname");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("nickname");
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
