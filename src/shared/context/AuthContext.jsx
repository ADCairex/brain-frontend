import { createContext, useContext, useEffect, useState } from "react";
import { getMe, logout as apiLogout } from "@/modules/auth/api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await apiLogout().catch(() => {});
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
