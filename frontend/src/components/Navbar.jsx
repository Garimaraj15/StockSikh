import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, API } from "../context/AuthContext";
import axios from "axios";
import {
  LayoutDashboard,
  LogOut,
  Sparkles,
  Wallet,
  Users,
  Globe2
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [indices, setIndices] = useState([]);
  const [walletCash, setWalletCash] = useState(null);

  useEffect(() => {
    let isMounted = true;
    axios
      .get(`${API}/stocks/indices`)
      .then((res) => {
        if (isMounted && res.data?.indices) {
          setIndices(res.data.indices);
        }
      })
      .catch(() => {});

    if (user?.id) {
      axios
        .get(`${API}/wallet/balance?user_id=${user.id}`)
        .then((res) => {
          if (isMounted) setWalletCash(res.data?.virtual_cash);
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [user, location.pathname]);

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-sm">
      {/* Top Indices Strip (Groww-style Market Ribbon) */}
      {indices.length > 0 && (
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-1.5 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs whitespace-nowrap">
            <span className="text-[#64748B] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D09C] animate-pulse"></span>
              LIVE NSE MARKETS
            </span>
            {indices.map((idx) => {
              const isPositive = (idx.change ?? 0) >= 0;
              return (
                <div key={idx.symbol} className="flex items-center gap-2">
                  <span className="font-semibold text-[#0F172A]">{idx.display || idx.name}</span>
                  <span className="font-bold text-[#0F172A]">
                    {idx.price?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`flex items-center text-[11px] font-semibold ${
                      isPositive ? "text-[#00D09C]" : "text-[#EB5B3C]"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {idx.change?.toFixed(2)} ({isPositive ? "+" : ""}
                    {idx.change_percent?.toFixed(2)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-[#00D09C] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-xl tracking-tight text-[#0F172A] flex items-center gap-1">
                Stock<span className="text-[#00D09C]">Sikh</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#0F172A] text-white uppercase ml-1">AI</span>
              </div>
              <div className="text-[10px] font-bold text-[#64748B] tracking-wider uppercase">
                Data Science Trading Lab
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                location.pathname === "/dashboard"
                  ? "text-[#00D09C] bg-[#E8FAF4]"
                  : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Markets
            </Link>

            <Link
              to="/portfolio"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                location.pathname === "/portfolio"
                  ? "text-[#00D09C] bg-[#E8FAF4]"
                  : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              }`}
            >
              <Wallet className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Virtual Portfolio
            </Link>

            <Link
              to="/pro-helpers"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                location.pathname === "/pro-helpers"
                  ? "text-[#00D09C] bg-[#E8FAF4]"
                  : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              }`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Pro Helpers
            </Link>

            <Link
              to="/creators"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                location.pathname === "/creators"
                  ? "text-[#00D09C] bg-[#E8FAF4]"
                  : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Global Creators
            </Link>
          </div>
        </div>

        {/* User Profile & Virtual Wallet Balance Pill */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              {/* Virtual Cash Pill */}
              <Link
                to="/portfolio"
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8FAF4] border border-[#B3F2DF] text-xs font-extrabold text-[#00D09C] hover:scale-105 transition-transform"
                title="Your Virtual Trading Balance"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>₹{(walletCash ?? 10000).toLocaleString("en-IN")}</span>
              </Link>

              {/* User Avatar */}
              <div className="flex items-center gap-2 bg-[#F1F5F9] px-3 py-1.5 rounded-full border border-[#E2E8F0]">
                <div className="w-6 h-6 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-[#0F172A]">
                    {user.name?.split(" ")[0]}
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-white text-[#387ED1] uppercase">
                  {user.role === "pro" ? "PRO" : "LEARNER"}
                </span>
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="p-2 rounded-full text-[#64748B] hover:text-[#EB5B3C] hover:bg-[#FDF2F0] transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-5 py-2 rounded-full text-xs font-extrabold text-white bg-[#00D09C] hover:bg-[#00B386] shadow-sm hover:shadow transition-all"
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