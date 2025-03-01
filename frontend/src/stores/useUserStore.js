import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";
import { auth, provider, signInWithPopup } from "../config/firebase.js";

const useUserStore = create((set) => ({
  user: null,
  loading: false,
  checkingUserAuth: true,

  login: async () => {
    set({ loading: true });
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user.email.endsWith(import.meta.env.VITE_EMAIL_DOMAIN)) {
        await auth.signOut();
        toast.error("Use VIT email");
        set({ loading: false });
        return;
      }
      const token = await user.getIdToken();
      const response = await axios.post(
        "/user",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200 || response.status === 201) {
        set({ user: response.data.data });
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
      await axios.post("/user/logout");
      set({ user: null });
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
    }
  },

  checkUserAuth: async () => {
    set({ checkingUserAuth: true });
    try {
      const response = await axios.get("/user/");
      set({ user: response.data.data, checkingUserAuth: false });
    } catch (err) {
      set({ checkingUserAuth: false, user: null });
    }
  },

  refreshToken: async () => {
    set({ checkingUserAuth: true });
    try {
      const response = await axios.post("/user/refresh-token");
      set({ checkingUserAuth: false });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
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
        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;
        return axios(originalRequest);
      } catch (refreshErr) {
        useUserStore.getState().logout();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default useUserStore;
