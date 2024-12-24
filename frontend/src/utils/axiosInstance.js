// src/utils/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // Cambiar a tu URL de backend
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Agrega el token en el header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
