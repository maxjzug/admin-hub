import { useEffect, useState } from "react";
import { FaBell, FaCheck } from "react-icons/fa";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

interface Notification { id: string; title: string; message: string; is_read: boolean; is_global: boolean; created_at: string; }

export function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("notifications").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setNotifications((data as Notification[]) || []); setLoading(false); });
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const displayItems = notifications.length > 0 ? notifications : [
    { id: "1", title: "Welcome to ReportCrime", message: "Sign in to start reporting crimes and getting alerts.", is_read: false, is_global: true, created_at: new Date().toISOString() },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-1">{t("notifications")}</h1>
      <p className="text-sm text-muted-foreground mb-6">Stay updated on your reports and alerts.</p>

      {loading ? (
        <div className="space-y-3">{[0,1,2].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {displayItems.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-2xl bg-card border border-border/50 ${!n.is_read ? "border-l-4 border-l-primary" : ""}`}>
              <div className="flex items-start gap-3">
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{n.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                    {!n.is_read && user && (
                      <button onClick={() => markRead(n.id)}
                        className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all">
                        <FaCheck className="text-[10px]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
