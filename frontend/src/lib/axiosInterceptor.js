import axiosInstance from "../lib/axios.js";
import useUserStore from "../stores/useUserStore.js";
import useAdminStore from "../stores/useAdminStore.js";

let refreshPromise = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;
    if (originalRequest.url.includes("/refresh-token")) {
      return Promise.reject(err);
    }
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (refreshPromise) {
          await refreshPromise;
          return axiosInstance(originalRequest);
        }
        refreshPromise = originalRequest.url.includes("/admin")
          ? useAdminStore.getState().refreshToken()
          : useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        if (originalRequest.url.includes("/admin")) {
          useAdminStore.getState().logout();
        } else {
          useUserStore.getState().logout();
        }
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
