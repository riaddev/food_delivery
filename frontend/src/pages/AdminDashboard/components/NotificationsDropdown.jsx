import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { adminApi } from "../../../features/api/apiSlice";
import { timeAgo } from "../sections/utils";

const LINK_SECTIONS = {
  restaurant_approved: "restaurants",
  restaurant_rejected: "restaurants",
  restaurant_suspended: "restaurants",
  restaurant_activated: "restaurants",
  rider_approved: "agents",
  rider_rejected: "agents",
  rider_suspended: "agents",
  rider_activated: "agents",
  customer_suspended: "customers",
  customer_activated: "customers",
  category_request_approved: "categories",
  category_request_rejected: "categories",
};

export default function NotificationsDropdown({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await adminApi.getNotifications();
      setItems(res.data.notifications || []);
      setUnread(res.data.unread_count || 0);
    } catch {
      // keep previous state
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(fetchNotifications, 0);
    const interval = window.setInterval(fetchNotifications, 30000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(interval);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAllRead = async () => {
    try {
      await adminApi.markAllNotificationsRead();
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const openItem = async (item) => {
    setOpen(false);
    if (!item.is_read) {
      try {
        await adminApi.markNotificationRead(item.id);
        setUnread((prev) => Math.max(0, prev - 1));
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      } catch {
        // ignore
      }
    }
    const section = LINK_SECTIONS[item.type];
    if (section) onNavigate(section);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative w-[38px] h-[38px] bg-card border border-border rounded-[9px] flex items-center justify-center cursor-pointer text-text-muted hover:text-text-primary transition-colors"
        aria-label="Notifications"
      >
        <Bell size={17} strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-orange-primary text-white text-[9px] font-bold rounded-full w-[15px] h-[15px] flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[44px] z-50 w-[340px] max-w-[calc(100vw-24px)] bg-card border border-border rounded-[13px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-[14px] font-bold text-text-primary">Notifications</div>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-orange-primary hover:underline cursor-pointer border-none bg-none font-outfit"
                >
                  <CheckCheck size={13} strokeWidth={2.5} />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {items.length === 0 && (
                <div className="py-10 text-center text-[13px] text-text-light">No notifications yet.</div>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className="w-full text-left px-4 py-3 border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer border-x-0 bg-none font-outfit"
                >
                  <div className="flex items-start gap-2.5">
                    {!n.is_read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-orange-primary shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-text-primary leading-snug">{n.title}</p>
                      {n.description && (
                        <p className="text-[12.5px] text-text-muted mt-0.5 leading-snug">{n.description}</p>
                      )}
                      <p className="text-[11px] text-text-light mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}