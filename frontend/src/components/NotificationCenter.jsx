import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "../context/AuthContext";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  TrendingUp,
  Award,
  Newspaper,
  ExternalLink,
  MessageSquare,
  Clock,
  Trash2,
  X
} from "lucide-react";

export default function NotificationCenter() {
  const { user, authConfig } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await axios.get(`${API}/notifications/`, authConfig());
      const notifList = res.data?.notifications || [];
      const unread = res.data?.unread_count ?? notifList.filter((n) => !n.is_read).length;
      setNotifications(notifList);
      setUnreadCount(unread);
    } catch (err) {
      // Graceful handling on auth or network issue
    }
  }, [authConfig]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    const handleSync = () => fetchNotifications();
    window.addEventListener("stocksikh:notifications-updated", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("stocksikh:notifications-updated", handleSync);
    };
  }, [fetchNotifications, user]);

  const toggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markSingleRead = async (notifId) => {
    try {
      await axios.post(`${API}/notifications/${notifId}/read/`, {}, authConfig());
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new Event("stocksikh:notifications-updated"));
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API}/notifications/mark-all-read/`, {}, authConfig());
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("stocksikh:notifications-updated"));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const deleteNotification = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`${API}/notifications/${notifId}/`, authConfig());
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === notifId);
        if (target && !target.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== notifId);
      });
      window.dispatchEvent(new Event("stocksikh:notifications-updated"));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete(`${API}/notifications/clear-all/`, authConfig());
      setNotifications([]);
      setUnreadCount(0);
      window.dispatchEvent(new Event("stocksikh:notifications-updated"));
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) {
      markSingleRead(n.id);
    }
    if (n.action_url) {
      setIsOpen(false);
      try {
        const url = n.action_url.trim();
        if (url.startsWith("http://") || url.startsWith("https://")) {
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          navigate(url);
        }
      } catch {
        // Malformed URL safe no-op
      }
    }
  };

  const formatNotifTime = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now - d;
      if (isNaN(diffMs)) return "";
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "DIRECT_MESSAGE":
      case "MESSAGE":
        return <MessageSquare className="w-4 h-4 text-[#A78BFA]" />;
      case "TRADE_BUY":
      case "TRADE_SELL":
      case "GAIN":
      case "GAIN_ALLOW":
        return <TrendingUp className="w-4 h-4 text-[#00D09C]" />;
      case "PRICE_ALERT":
      case "RISK_SHIELD":
        return <AlertTriangle className="w-4 h-4 text-[#EF4444]" />;
      case "REWARD":
      case "QUEST":
      case "QUEST_UN":
        return <Award className="w-4 h-4 text-[#F59E0B]" />;
      default:
        return <Newspaper className="w-4 h-4 text-[#38BDF8]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2.5 rounded-2xl bg-[#111827] hover:bg-[#1E293B] border border-white/[0.08] hover:border-[#00D09C]/40 text-white transition-all flex items-center justify-center focus:outline-none cursor-pointer"
        title="Live Notifications"
      >
        <Bell className="w-5 h-5 text-[#94A3B8] hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-black flex items-center justify-center animate-pulse border-2 border-[#0B0F17] shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0F172A]/95 rounded-3xl border border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 p-4 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">Live Alerts &amp; Feed</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D09C]/20 text-[#00D09C] border border-[#00D09C]/30">
                  {unreadCount} New
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-bold text-[#94A3B8] hover:text-[#00D09C] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Read all</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-[11px] font-bold text-[#94A3B8] hover:text-[#EF4444] flex items-center gap-1 transition-colors cursor-pointer ml-1"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-[#64748B] text-xs font-semibold">
                No active notifications right now
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${
                    n.is_read
                      ? "bg-white/[0.02] border-transparent hover:bg-white/[0.05]"
                      : "bg-[#1E293B]/60 border-white/[0.08] hover:border-[#00D09C]/40 shadow-xs"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.06] shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-white truncate">
                          {n.title}
                        </span>
                        {n.created_at && (
                          <span className="text-[10px] font-medium text-[#94A3B8] shrink-0 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatNotifTime(n.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#94A3B8] mt-0.5 leading-snug">
                        {n.message}
                      </div>
                      {n.action_url && (() => {
                        const label =
                          n.type === "NEWS_ALERT"
                            ? "Read Article"
                            : n.type === "DIRECT_MESSAGE" || n.type === "MESSAGE"
                            ? "Open Conversation"
                            : "View Details";
                        return (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00D09C] hover:underline mt-1.5">
                            <span>{label}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        );
                      })()}
                    </div>

                    {/* Delete single notification button */}
                    <button
                      onClick={(e) => deleteNotification(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-[#64748B] hover:text-[#EF4444] transition-all absolute top-2.5 right-2.5 cursor-pointer"
                      title="Delete notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
