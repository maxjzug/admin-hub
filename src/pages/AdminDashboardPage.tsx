import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  FaUsers, FaUserShield, FaClipboardList, FaExclamationTriangle,
  FaCheckCircle, FaChartBar, FaMapMarkerAlt, FaBell, FaCog,
  FaTachometerAlt, FaUserPlus, FaShieldAlt, FaToggleOn, FaToggleOff,
  FaCrown, FaSync, FaTimes,
} from "react-icons/fa";

function formatNumber(val: number) {
  try { return val.toLocaleString(); } catch { return String(val); }
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0, activeUsers: 0, pendingRequests: 0, resolvedRequests: 0,
    totalAdmins: 0, totalReports: 0, rejectedRequests: 0, missingPersons: 0,
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastType, setBroadcastType] = useState("info");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");
  const [addingUser, setAddingUser] = useState(false);

  const safeCount = async (query: any) => {
    try {
      const res = await query;
      return typeof res?.count === "number" ? res.count : 0;
    } catch { return 0; }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const counts = await Promise.all([
        safeCount(supabase.from("profiles").select("*", { count: "exact", head: true })),
        safeCount(supabase.from("crime_reports").select("*", { count: "exact", head: true }).eq("status", "pending")),
        safeCount(supabase.from("crime_reports").select("*", { count: "exact", head: true }).eq("status", "resolved")),
        safeCount(supabase.from("crime_reports").select("*", { count: "exact", head: true }).eq("status", "rejected")),
        safeCount(supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin")),
        safeCount(supabase.from("crime_reports").select("*", { count: "exact", head: true })),
        safeCount(supabase.from("missing_persons").select("*", { count: "exact", head: true }).eq("status", "missing")),
      ]);
      setStats({
        totalUsers: counts[0], activeUsers: counts[0], pendingRequests: counts[1],
        resolvedRequests: counts[2], rejectedRequests: counts[3], totalAdmins: counts[4],
        totalReports: counts[5], missingPersons: counts[6],
      });

      const { data: repData } = await supabase.from("crime_reports")
        .select("id, category, location, status, created_at, user_id")
        .order("created_at", { ascending: false }).limit(5);
      setRecentReports(repData || []);

      const { data: userData } = await supabase.from("profiles")
        .select("user_id, display_name, created_at")
        .order("created_at", { ascending: false }).limit(5);
      setRecentUsers(userData || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    try {
      const { data: users } = await supabase.from("profiles").select("user_id");
      if (!users?.length) { toast({ title: "No users found", variant: "destructive" }); return; }
      const rows = users.map((u: any) => ({ user_id: u.user_id, title: broadcastTitle, message: broadcastMsg, type: broadcastType }));
      await supabase.from("notifications").insert(rows);
      toast({ title: `Notification sent to ${rows.length} user(s)!` });
      setShowBroadcast(false);
      setBroadcastTitle(""); setBroadcastMsg("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword) return;
    setAddingUser(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUserEmail, password: newUserPassword,
      });
      if (error) throw error;
      if (newUserRole === "admin" && data.user) {
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
      }
      toast({ title: "User created", description: `${newUserEmail} added as ${newUserRole}` });
      setShowAddUser(false);
      setNewUserEmail(""); setNewUserPassword("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setAddingUser(false);
  };

  const handleQuickApprove = async (reportId: string) => {
    try {
      await supabase.from("crime_reports").update({
        status: "resolved", reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
      }).eq("id", reportId);
      toast({ title: "Report approved" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const resolveRate = stats.totalReports > 0 ? Math.round((stats.resolvedRequests / stats.totalReports) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const STAT_CARDS = [
    { icon: FaUsers, label: "Total Users", value: stats.totalUsers, gradient: "hsl(234, 85%, 58%)" },
    { icon: FaClipboardList, label: "Pending", value: stats.pendingRequests, gradient: "hsl(38, 92%, 50%)" },
    { icon: FaCheckCircle, label: "Resolved", value: stats.resolvedRequests, gradient: "hsl(142, 71%, 45%)" },
    { icon: FaChartBar, label: "Total Reports", value: stats.totalReports, gradient: "hsl(263, 70%, 50%)" },
    { icon: FaUserShield, label: "Admins", value: stats.totalAdmins, gradient: "hsl(192, 91%, 36%)" },
    { icon: FaExclamationTriangle, label: "Missing Persons", value: stats.missingPersons, gradient: "hsl(0, 84%, 60%)" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">Broadcast Notification</h2>
              <button onClick={() => setShowBroadcast(false)}><FaTimes /></button>
            </div>
            <input value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="Title"
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm" />
            <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Message" rows={3}
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm" />
            <select value={broadcastType} onChange={(e) => setBroadcastType(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm">
              <option value="info">Info</option><option value="success">Success</option>
              <option value="warning">Warning</option><option value="alert">Alert</option>
            </select>
            <button onClick={handleBroadcast} className="w-full py-3 rounded-xl font-bold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}>Send to All Users</button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">Add User / Admin</h2>
              <button onClick={() => setShowAddUser(false)}><FaTimes /></button>
            </div>
            <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="Email"
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm" />
            <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Password"
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm" />
            <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as any)}
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm">
              <option value="user">Regular User</option><option value="admin">Admin</option>
            </select>
            <button onClick={handleAddUser} disabled={addingUser}
              className="w-full py-3 rounded-xl font-bold text-primary-foreground disabled:opacity-50"
              style={{ background: "var(--gradient-primary)" }}>
              {addingUser ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FaTachometerAlt className="text-primary" /> Admin Dashboard
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Super Admin</span>
          </h1>
          <p className="text-sm text-muted-foreground">Full control over users, reports, and system operations.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh}
            className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all flex items-center gap-1">
            <FaSync className={refreshing ? "animate-spin" : ""} /> {refreshing ? "..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {STAT_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: card.gradient + "20", color: card.gradient }}><Icon /></div>
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatNumber(card.value)}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Resolution Rate */}
      <div className="p-4 rounded-2xl bg-card border border-border/50 mb-6">
        <p className="text-sm font-semibold text-foreground mb-2">📊 Report Resolution Rate</p>
        <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all" style={{ width: `${resolveRate}%`, background: "var(--gradient-success)" }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Pending: {stats.pendingRequests}</span>
          <span className="font-bold text-foreground">{resolveRate}%</span>
          <span>Resolved: {stats.resolvedRequests}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: FaUserPlus, label: "Add User/Admin", color: "hsl(142, 71%, 45%)", action: () => setShowAddUser(true) },
            { icon: FaBell, label: "Broadcast", color: "hsl(330, 81%, 60%)", action: () => setShowBroadcast(true) },
            { icon: FaMapMarkerAlt, label: "Search Stations", color: "hsl(263, 70%, 50%)", action: () => navigate("/search-stations") },
            { icon: FaCog, label: "Settings", color: "hsl(192, 91%, 36%)", action: () => navigate("/settings") },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={i} onClick={item.action}
                className="p-3 rounded-xl bg-card border border-border/50 hover:shadow-md transition-all text-left">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: item.color + "20", color: item.color }}><Icon /></div>
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Reports & Users */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border/50 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">📋 Recent Reports</h3>
          {recentReports.length === 0 ? (
            <p className="text-xs text-muted-foreground">No reports yet.</p>
          ) : (
            <div className="space-y-2">
              {recentReports.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-xs font-medium text-foreground">{r.category || "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground">📍 {r.location || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      r.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      r.status === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{r.status}</span>
                    {r.status === "pending" && (
                      <button onClick={() => handleQuickApprove(r.id)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold hover:bg-green-200">
                        ✓ Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">👤 Recent Users</h3>
          {recentUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {recentUsers.map((u: any) => (
                <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/50">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold"
                    style={{ background: "var(--gradient-primary)" }}>
                    {u.display_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{u.display_name || "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
