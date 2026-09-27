import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("duvier_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("duvier_token");
      if (!location.pathname.startsWith("/login") && !location.pathname.startsWith("/registro")) {
        location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
