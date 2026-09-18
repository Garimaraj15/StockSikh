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
    <div className="min-h-screen flex items-center justify-center bg-[#07090E] px-4 py-12 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#00D09C]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0F172A]/80 backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-8 space-y-6 relative z-10">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#00D09C]" /> Back to Home
        </Link>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#00D09C] text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-[#00D09C]/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            {isLogin ? "Welcome Back" : "Join StockSikh AI"}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400">
            {isLogin
              ? "Access your virtual wallet & live paper trading portfolio."
              : "Get instant ₹10,000 virtual cash to start trading risk-free!"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Role Selector (on Signup) */}
        {!isLogin && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Choose Your Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("learner")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  role === "learner"
                    ? "bg-[#00D09C]/15 text-[#00D09C] border-[#00D09C]/50 shadow-xs"
                    : "bg-[#0B0F17]/60 text-slate-400 border-white/[0.08] hover:text-white"
                }`}
              >
                <GraduationCap className="w-4 h-4" /> 🎓 Learner
              </button>

              <button
                type="button"
                onClick={() => setRole("pro")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  role === "pro"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-xs"
                    : "bg-[#0B0F17]/60 text-slate-400 border-white/[0.08] hover:text-white"
                }`}
              >
                <Award className="w-4 h-4" /> 🏆 Pro Learner
              </button>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B0F17]/90 border border-white/[0.08] focus:border-[#00D09C] outline-none text-sm text-white placeholder-slate-500 font-medium transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B0F17]/90 border border-white/[0.08] focus:border-[#00D09C] outline-none text-sm text-white placeholder-slate-500 font-medium transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0B0F17]/90 border border-white/[0.08] focus:border-[#00D09C] outline-none text-sm text-white placeholder-slate-500 font-medium transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Mobile (+₹500 Bonus)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0B0F17]/90 border border-white/[0.08] text-xs text-white placeholder-slate-500 outline-none focus:border-[#00D09C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">DOB (+₹500 Bonus)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0F17]/90 border border-white/[0.08] text-xs text-white outline-none focus:border-[#00D09C]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#00D09C] hover:bg-[#00B386] text-slate-950 font-black text-sm shadow-lg shadow-[#00D09C]/20 hover:shadow-[#00D09C]/30 transition-all disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? "Processing..." : isLogin ? "Sign In to Dashboard" : "Claim ₹10,000 & Register"}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="pt-3 border-t border-white/[0.08] text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-xs font-bold text-[#00D09C] hover:text-[#00B386] transition-colors cursor-pointer"
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
