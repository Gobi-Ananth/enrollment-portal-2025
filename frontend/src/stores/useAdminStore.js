import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";
import { auth, provider, signInWithPopup } from "../config/firebase.js";

const useAdminStore = create((set) => ({
  admin: null,
  loading: false,
  checkingAdminAuth: true,

  login: async () => {
    set({ loading: true });
    try {
      const result = await signInWithPopup(auth, provider);
      const admin = result.admin;
      if (!admin.email.endsWith(import.meta.env.VITE_EMAIL_DOMAIN)) {
        await auth.signOut();
        toast.error("Use VIT email");
        set({ loading: false });
        return;
      }
      const token = await admin.getIdToken();
      const response = await axios.post(
        "/admin",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200 || response.status === 201) {
        set({ admin: response.data.data });
        toast.success("Login successful");
      }
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data?.message || "An error occurred");
      } else if (err.request) {
        toast.error("No response from server");
      } else {
        toast.error("Login failed");
      }
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await axios.post("/admin/logout");
      set({ admin: null });
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
    }
  },

  checkAdminAuth: async () => {
    set({ checkingAdminAuth: true });
    try {
      const response = await axios.get("/admin/");
      set({ admin: response.data.data, checkingAdminAuth: false });
    } catch (err) {
      set({ checkingAdminAuth: false, admin: null });
    }
  },

  refreshToken: async () => {
    set({ checkingAdminAuth: true });
    try {
      const response = await axios.post("/admin/refresh-token");
      set({ checkingAdminAuth: false });
      return response.data;
    } catch (error) {
      set({ admin: null, checkingAdminAuth: false });
      throw error;
    }
  },
}));

let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }
        refreshPromise = useAdminStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;
        return axios(originalRequest);
      } catch (refreshErr) {
        useAdminStore.getState().logout();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default useAdminStore;
