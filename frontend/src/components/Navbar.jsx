import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sprout, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#F9F8F6]/80 border-b border-[#E5E3DB]">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1A3626] flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="font-semibold text-lg text-[#1A3626]">
              Stockसीख
            </div>
            <div className="text-[10px] text-[#A1A1AA]">
              Learn · Don't Risk
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">

          {user ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 rounded-full border"
              >
                <LayoutDashboard className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>

              <span className="hidden sm:block text-sm">
                Hi, {user.name}
              </span>

              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="px-4 py-2 rounded-full bg-red-500 text-white"
              >
                <LogOut className="w-4 h-4 inline mr-2" />
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-full border"
              >
                Sign In
              </button>

              <button
                onClick={() => navigate("/signup")}
                className="px-4 py-2 rounded-full bg-[#1A3626] text-white"
              >
                Get Started
              </button>
            </>
          )}

        </div>
      </div>
    </nav>
  );
}