import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5000/api"
      : "https://enrollment-portal-2025-backend.onrender.com/api",
  withCredentials: true,
});

export default axiosInstance;
