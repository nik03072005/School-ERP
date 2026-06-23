import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { notificationService } from "../api/notificationService";

const TYPE_PILL = {
  attendance: "bg-blue-100 text-blue-700",
  fee: "bg-amber-100 text-amber-700",
  event: "bg-purple-100 text-purple-700",
  birthday: "bg-pink-100 text-pink-700",
  notice: "bg-cyan-100 text-cyan-700",
  leave: "bg-orange-100 text-orange-700",
  result: "bg-green-100 text-green-700",
  general: "bg-slate-100 text-slate-600",
};

const relativeTime = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const refreshCount = useCallback(async () => {
    try {
      const { count } = await notificationService.getUnreadCount();
      setUnread(count);
    } catch {
      // silent — bell still renders
    }
  }, []);

  const loadPanel = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications } = await notificationService.getNotifications(1, 15);
      setItems(notifications);
      setUnread(notifications.filter((n) => !n.read).length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, 30_000);
    return () => clearInterval(id);
  }, [refreshCount]);

  // Load full list whenever panel opens
  useEffect(() => {
    if (open) loadPanel();
  }, [open, loadPanel]);

  // Close on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const handleMarkOne = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnread((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      // silent
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      {/* Bell trigger */}
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin text-slate-300" />
              </div>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No notifications yet</p>
            ) : (
              items.map((n) => (
                <div
                  key={n._id}
                  className={[
                    "flex gap-3 px-4 py-3",
                    !n.read ? "bg-cyan-50/40" : "",
                  ].join(" ")}
                >
                  {/* Type pill */}
                  <span
                    className={[
                      "mt-0.5 h-fit shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                      TYPE_PILL[n.type] ?? TYPE_PILL.general,
                    ].join(" ")}
                  >
                    {n.type}
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-800">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{relativeTime(n.createdAt)}</p>
                  </div>

                  {/* Mark read */}
                  {!n.read && (
                    <button
                      type="button"
                      title="Mark as read"
                      onClick={() => handleMarkOne(n._id)}
                      className="mt-0.5 shrink-0 text-slate-300 hover:text-cyan-500"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="rounded-b-2xl border-t border-slate-100 px-4 py-2 text-center">
            <p className="text-[11px] text-slate-400">Showing last 15 notifications</p>
          </div>
        </div>
      )}
    </div>
  );
}
