import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

import axios from "axios";

export const API = "http://127.0.0.1:8000";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
  const savedUser = localStorage.getItem("user");

  if (savedUser) {
    setUser(JSON.parse(savedUser));
  }
}, []);

  const signup = async (
    name,
    email,
    password
  ) => {
    const res = await axios.post(
      `${API}/auth/signup`,
      {
        name,
        email,
        password,
      }
    );

    return res.data;
  };

  const login = async (
    email,
    password
  ) => {
    const res = await axios.post(
      `${API}/auth/login`,
      {
        email,
        password,
      }
    );

    localStorage.setItem(
  "token",
  res.data.token
);

localStorage.setItem(
  "user",
  JSON.stringify(res.data.user)
);

setUser(res.data.user);

    return res.data;
  };

  const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setUser(null);
};

const authHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`
  };
};

return (
  <AuthContext.Provider
    value={{
      user,
      signup,
      login,
      logout,
      authHeaders,
    }}
  >
    {children}
  </AuthContext.Provider>
);
}

export function useAuth() {
  return useContext(AuthContext);
}