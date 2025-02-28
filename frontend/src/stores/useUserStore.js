import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";
import { auth, provider, signInWithPopup } from "../config/firebase.js";

const useUserStore = create((set) => ({
  user: null,
  loading: false,
  checkingAuth: true,

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
        set({ user: response.data });
        toast.success("Login successful");
      }
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data?.message || "Error occurred");
      } else if (err.request) {
        toast.error("No response from server");
      } else {
        toast.error("Login failed");
      }
    } finally {
      set({ loading: false });
    }
  },

  checkUserAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/user");

      set({ user: response.data });
    } catch (err) {
      set({ checkingAuth: false, user: null });
    }
  },
}));

export default useUserStore;
