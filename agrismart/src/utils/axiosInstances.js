import axios from "axios";
import { BASE_URL } from "./apiPath";

const axiosInstances = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstances.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");
    const url = typeof config.url === "string" ? config.url : "";

    const AUTH_ROUTES = ["/auth/login", "/auth/signup"];

    const isAuthRoute = AUTH_ROUTES.some((route) => url.includes(route));

    // Important: let browser/Axios set multipart boundary for FormData.
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }

    if (accessToken && !isAuthRoute) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstances.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        console.warn("Unauthorized - please login again");
      } else if (error.response.status === 500) {
        console.error("Server error. Please try again later.");
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    }
    return Promise.reject(error);
  }
);

export default axiosInstances;

