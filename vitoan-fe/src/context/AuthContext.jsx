import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axiosClient, { getStoredAuth, setStoredAuth } from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredAuth()?.user || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth?.accessToken) {
      setLoading(false);
      return;
    }
    axiosClient
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        setStoredAuth({ ...auth, user: res.data.user });
      })
      .catch(() => {
        setStoredAuth(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await axiosClient.post("/auth/login", { username, password });
    setStoredAuth(res.data);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await axiosClient.post("/auth/register", payload);
    return res.data;
  }, []);

  const verifyRegisterCode = useCallback(async ({ username, code }) => {
    const res = await axiosClient.post("/auth/verify-register", { username, code });
    setStoredAuth(res.data);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const res = await axiosClient.post("/auth/google", { credential });
    setStoredAuth(res.data);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const setGrade = useCallback(async (gradeId) => {
    const res = await axiosClient.post("/auth/grade", { grade: gradeId });
    const auth = getStoredAuth();
    setStoredAuth({ ...auth, user: res.data.user });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const res = await axiosClient.put("/auth/profile", payload);
    const auth = getStoredAuth();
    setStoredAuth({ ...auth, user: res.data.user });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const uploadAvatar = useCallback(async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await axiosClient.post("/auth/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const auth = getStoredAuth();
    setStoredAuth({ ...auth, user: res.data.user });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const changePassword = useCallback(async (payload) => {
    await axiosClient.put("/auth/change-password", payload);
  }, []);

  // Đồng bộ lại user (đặc biệt là `points`) sau khi nhận thưởng nhiệm vụ hoặc đổi quà.
  const refreshUser = useCallback(async () => {
    const res = await axiosClient.get("/auth/me");
    const auth = getStoredAuth();
    setStoredAuth({ ...auth, user: res.data.user });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosClient.post("/auth/logout");
    } catch {
      // ignore
    }
    setStoredAuth(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyRegisterCode,
        loginWithGoogle,
        setGrade,
        updateProfile,
        uploadAvatar,
        changePassword,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng bên trong AuthProvider");
  return ctx;
}
