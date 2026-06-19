import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const { signup, login } = useAuth();

  const navigate = useNavigate();

  const [isLogin, setIsLogin] =
    useState(true);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(
          name,
          email,
          password
        );
      }

      navigate("/dashboard");
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Something went wrong"
      );
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] px-4">
    <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-[#E5E3DB] p-8">

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1A3626]">
          Stockसीख
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Learn • Don't Risk
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-6 text-center">
        {isLogin ? "Login" : "Create Account"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="w-full border rounded-xl px-4 py-3"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full border rounded-xl px-4 py-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border rounded-xl px-4 py-3"
        />

        <button
          type="submit"
          className="w-full bg-[#1A3626] text-white py-3 rounded-xl hover:bg-[#264F38]"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          onClick={() =>
            setIsLogin(!isLogin)
          }
          className="text-[#1A3626] font-medium"
        >
          {isLogin
            ? "New user? Create account"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  </div>
);
}