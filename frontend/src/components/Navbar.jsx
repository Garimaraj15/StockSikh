import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, API } from "../context/AuthContext";
import axios from "axios";
import NotificationCenter from "./NotificationCenter";
import {
  LayoutDashboard,
  LogOut,
  Sparkles,
  Wallet,
  Users,
  Trophy,
  Layers
} from "lucide-react";

export default function Navbar() {
  const { user, logout, authConfig } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [indices, setIndices] = useState([]);
  const [walletCash, setWalletCash] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const refreshWalletCash = () => {
      if (user?.id) {
        axios
          .get(`${API}/wallet/balance`, authConfig())
          .then((res) => {
            if (isMounted) setWalletCash(res.data?.virtual_cash);
          })
          .catch(() => {});
      }
    };

    axios
      .get(`${API}/stocks/indices`)
      .then((res) => {
        if (isMounted && res.data?.indices) {
          setIndices(res.data.indices);
        }
      })
      .catch(() => {});

    refreshWalletCash();
    window.addEventListener("stocksikh:wallet-updated", refreshWalletCash);

    return () => {
      isMounted = false;
      window.removeEventListener("stocksikh:wallet-updated", refreshWalletCash);
    };
  }, [user, location.pathname, authConfig]);

  return (
    <nav className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl">
      {/* Top Indices Strip (Groww-style Dark Market Ribbon) */}
      {indices.length > 0 && (() => {
        const liveIndices = indices.filter((idx) => idx.available !== false && idx.price !== null);
        const anyLive = liveIndices.length > 0;
        return (
          <div className="bg-[#07090E]/90 border-b border-white/[0.06] px-4 py-1.5 overflow-x-auto no-scrollbar">
            <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs whitespace-nowrap">
              <span className="text-[#94A3B8] font-bold flex items-center gap-1.5">
                {anyLive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D09C] animate-pulse shadow-[0_0_8px_#00D09C]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
                )}
                {anyLive ? "LIVE NSE MARKETS" : "NSE MARKETS"}
              </span>
              {indices.map((idx) => {
                const isAvailable = idx.available !== false && idx.price !== null;
                if (!isAvailable) {
                  return (
                    <div key={idx.symbol} className="flex items-center gap-2">
                      <span className="font-semibold text-white/90">{idx.display || idx.name}</span>
                      <span className="text-[11px] font-semibold text-[#64748B]">Data unavailable</span>
                    </div>
                  );
                }
                const isPositive = (idx.change ?? 0) >= 0;
                return (
                  <div key={idx.symbol} className="flex items-center gap-2">
                    <span className="font-semibold text-white/90">{idx.display || idx.name}</span>
                    <span className="font-bold text-white">
                      {idx.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    {idx.change !== null && idx.change_percent !== null ? (
                      <span
                        className={`flex items-center text-[11px] font-semibold ${
                          isPositive ? "text-[#00D09C]" : "text-[#EF4444]"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {idx.change.toFixed(2)} ({isPositive ? "+" : ""}
                        {idx.change_percent.toFixed(2)}%)
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#00D09C] to-[#00FFB2] text-[#07090E] flex items-center justify-center font-extrabold shadow-[0_0_20px_rgba(0,208,156,0.35)] transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-white leading-none">
                Stock<span className="text-[#00D09C]">Sikh</span>
              </span>
              <span className="text-[9px] font-extrabold text-[#94A3B8] tracking-widest uppercase">
                AI Trading Lab
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1.5">
            <Link
              to="/dashboard"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname === "/" || location.pathname === "/dashboard"
                  ? "text-[#00D09C] bg-[#00D09C]/10 border border-[#00D09C]/30 shadow-[0_0_15px_rgba(0,208,156,0.15)]"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Markets
            </Link>

            <Link
              to="/portfolio"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname === "/portfolio"
                  ? "text-[#00D09C] bg-[#00D09C]/10 border border-[#00D09C]/30 shadow-[0_0_15px_rgba(0,208,156,0.15)]"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Wallet className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Portfolio
            </Link>

            <Link
              to="/quests"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname === "/quests"
                  ? "text-[#00D09C] bg-[#00D09C]/10 border border-[#00D09C]/30 shadow-[0_0_15px_rgba(0,208,156,0.15)]"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Quests &amp; XP
            </Link>

            <Link
              to="/community"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname === "/community"
                  ? "text-[#00D09C] bg-[#00D09C]/10 border border-[#00D09C]/30 shadow-[0_0_15px_rgba(0,208,156,0.15)]"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Community
            </Link>

            <Link
              to="/asset-matrix"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname === "/asset-matrix"
                  ? "text-[#00D09C] bg-[#00D09C]/10 border border-[#00D09C]/30 shadow-[0_0_15px_rgba(0,208,156,0.15)]"
                  : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Asset Matrix
            </Link>
          </div>
        </div>

        {/* User Profile, Notifications & Virtual Wallet Balance Pill */}
        <div className="flex items-center gap-3">
          {/* Notification Center */}
          <NotificationCenter />

          {user ? (
            <div className="flex items-center gap-2.5">
              {/* Virtual Cash Pill */}
              <Link
                to="/portfolio"
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D09C]/10 border border-[#00D09C]/30 text-xs font-extrabold text-[#00D09C] hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,208,156,0.15)]"
                title="Virtual cash available for your next paper trade."
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Cash: ₹{(walletCash ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </Link>

              {/* User Avatar */}
              <div className="flex items-center gap-2 bg-[#111827] px-3 py-1.5 rounded-full border border-white/[0.08]">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00D09C] to-[#7C3AED] text-white flex items-center justify-center text-xs font-black shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white">
                    {user.name?.split(" ")[0]}
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-white/[0.08] text-[#00D09C] uppercase border border-white/[0.06]">
                  {user.role === "pro" ? "PRO" : "LEARNER"}
                </span>
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="p-2 rounded-full text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#CBD5E1] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-5 py-2 rounded-full text-xs font-extrabold text-[#07090E] bg-[#00D09C] hover:bg-[#00B386] shadow-[0_0_20px_rgba(0,208,156,0.3)] hover:scale-105 transition-all cursor-pointer"
              >
                Join &amp; Get ₹10,000
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
