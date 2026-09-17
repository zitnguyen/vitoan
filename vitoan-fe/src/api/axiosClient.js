import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 15000,
});

function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem("vitoan_auth") || "null");
  } catch {
    return null;
  }
}

function setStoredAuth(auth) {
  if (auth) localStorage.setItem("vitoan_auth", JSON.stringify(auth));
  else localStorage.removeItem("vitoan_auth");
}

let refreshPromise = null;

axiosClient.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 401 && !original._retry && !original.url.includes("/auth/")) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axiosClient.post("/auth/refresh").finally(() => {
            refreshPromise = null;
          });
        }
        const refreshed = await refreshPromise;
        const auth = getStoredAuth();
        setStoredAuth({ ...auth, accessToken: refreshed.data.accessToken });
        original.headers.Authorization = `Bearer ${refreshed.data.accessToken}`;
        return axiosClient(original);
      } catch {
        setStoredAuth(null);
      }
    }

    error.apiMessage = message;
    return Promise.reject(error);
  }
);

export { getStoredAuth, setStoredAuth };
export default axiosClient;
