import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Lock, Mail, User, Eye, EyeOff, ArrowLeft, Phone, Award, GraduationCap } from "lucide-react";

export default function AuthPage() {
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("learner"); // "learner" or "pro"
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password, role, phone, dob);
      }
      navigate("/portfolio");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Authentication failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-8 space-y-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#00D09C] text-white flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
            {isLogin ? "Welcome Back" : "Join StockSikh AI"}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#64748B]">
            {isLogin
              ? "Access your virtual wallet & live paper trading portfolio."
              : "Get instant ₹10,000 virtual cash to start trading risk-free!"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-[#FDF2F0] border border-[#FADCD8] text-[#EB5B3C] text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Role Selector (on Signup) */}
        {!isLogin && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Choose Your Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("learner")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  role === "learner"
                    ? "bg-[#E8FAF4] text-[#00D09C] border-[#00D09C] shadow-xs"
                    : "bg-white text-[#64748B] border-[#E2E8F0]"
                }`}
              >
                <GraduationCap className="w-4 h-4" /> 🎓 Learner
              </button>

              <button
                type="button"
                onClick={() => setRole("pro")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  role === "pro"
                    ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                    : "bg-white text-[#64748B] border-[#E2E8F0]"
                }`}
              >
                <Award className="w-4 h-4" /> 🏆 Pro Mentor
              </button>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D09C] outline-none text-sm text-[#0F172A] font-medium"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D09C] outline-none text-sm text-[#0F172A] font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D09C] outline-none text-sm text-[#0F172A] font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#94A3B8] hover:text-[#0F172A]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] uppercase">Mobile (+₹500 Bonus)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:border-[#00D09C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#64748B] uppercase">DOB (+₹500 Bonus)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:border-[#00D09C]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#00D09C] hover:bg-[#00B386] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "Processing..." : isLogin ? "Sign In to Dashboard" : "Claim ₹10,000 & Register"}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="pt-3 border-t border-[#F1F5F9] text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-xs font-bold text-[#00D09C] hover:text-[#00B386] transition-colors"
          >
            {isLogin
              ? "New trader? Create account & claim ₹10,000"
              : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}