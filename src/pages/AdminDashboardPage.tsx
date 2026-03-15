import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  FaUsers, FaUserShield, FaClipboardList, FaExclamationTriangle,
  FaCheckCircle, FaChartBar, FaMapMarkerAlt, FaBell, FaCog,
  FaTachometerAlt, FaUserPlus, FaShieldAlt, FaSync, FaTimes,
  FaDownload, FaEye, FaTrash, FaEnvelope, FaReply, FaCrown,
  FaToggleOn, FaToggleOff, FaArrowLeft,
} from "react-icons/fa";

function formatNumber(val: number) {
  try { return val.toLocaleString(); } catch { return String(val); }
}

interface CrimeReport {
  id: string;
  category: string | null;
  crime_type: string;
  location: string | null;
  status: string;
  created_at: string;
  user_id: string;
  description: string;
  date_time: string | null;
  latitude: number | null;
  longitude: number | null;
  reference_number: string | null;
  audio_url: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0, pendingRequests: 0, resolvedRequests: 0,
    totalAdmins: 0, totalReports: 0, rejectedRequests: 0, missingPersons: 0,
  });
  const [recentReports, setRecentReports] = useState<CrimeReport[]>([]);
  const [allReports, setAllReports] = useState<CrimeReport[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showReportDetail, setShowReportDetail] = useState<CrimeReport | null>(null);
  const [showAllReports, setShowAllReports] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");

  // Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastType, setBroadcastType] = useState("info");

  // Add User
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");
  const [addingUser, setAddingUser] = useState(false);

  // Report filter
  const [reportFilter, setReportFilter] = useState("all");

  const channelRef = useRef<any>(null);

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
        totalUsers: counts[0], pendingRequests: counts[1],
        resolvedRequests: counts[2], rejectedRequests: counts[3], totalAdmins: counts[4],
        totalReports: counts[5], missingPersons: counts[6],
      });

      const { data: repData } = await supabase.from("crime_reports")
        .select("*")
        .order("created_at", { ascending: false });
      const reports = (repData || []) as CrimeReport[];
      setAllReports(reports);
      setRecentReports(reports.slice(0, 5));

      const { data: userData } = await supabase.from("profiles")
        .select("user_id, display_name, avatar_url, phone, created_at")
        .order("created_at", { ascending: false });
      const users = (userData || []) as UserProfile[];
      setAllUsers(users);
      setRecentUsers(users.slice(0, 5));
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    if (channelRef.current) return;
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "crime_reports" }, () => fetchData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "crime_reports" }, () => fetchData())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => fetchData())
      .subscribe();
    channelRef.current = channel;
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleUpdateStatus = async (reportId: string, status: string) => {
    try {
      await supabase.from("crime_reports").update({
        status, reviewed_by: user?.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq("id", reportId);

      // Notify the user
      const report = allReports.find(r => r.id === reportId);
      if (report) {
        await supabase.from("notifications").insert({
          user_id: report.user_id,
          title: `Report ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your crime report (${report.crime_type}) has been ${status} by an administrator.`,
          type: status === "resolved" ? "success" : status === "rejected" ? "warning" : "info",
        });
      }

      toast({ title: `Report ${status}` });
      setShowReportDetail(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReplyToUser = async (report: CrimeReport) => {
    if (!replyMessage.trim()) return;
    try {
      await supabase.from("notifications").insert({
        user_id: report.user_id,
        title: `Response to your report`,
        message: replyMessage,
        type: "info",
      });
      toast({ title: "Reply sent to user" });
      setReplyMessage("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Delete this report permanently?")) return;
    try {
      await supabase.from("crime_reports").delete().eq("id", reportId);
      toast({ title: "Report deleted" });
      setShowReportDetail(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    try {
      const { data: users } = await supabase.from("profiles").select("user_id");
      if (!users?.length) { toast({ title: "No users found", variant: "destructive" }); return; }
      const rows = users.map((u: any) => ({ user_id: u.user_id, title: broadcastTitle, message: broadcastMsg, type: broadcastType, is_global: true }));
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
      const { data, error } = await supabase.auth.signUp({ email: newUserEmail, password: newUserPassword });
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

  const handleDownloadReports = () => {
    const csvHeaders = "ID,Type,Category,Location,Status,Date,Description,User ID\n";
    const csvRows = allReports.map(r =>
      `"${r.id}","${r.crime_type}","${r.category || ''}","${r.location || ''}","${r.status}","${r.created_at}","${r.description.replace(/"/g, '""')}","${r.user_id}"`
    ).join("\n");
    const blob = new Blob([csvHeaders + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crime_reports_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Reports downloaded as CSV" });
  };

  const resolveRate = stats.totalReports > 0 ? Math.round((stats.resolvedRequests / stats.totalReports) * 100) : 0;

  const filteredReports = reportFilter === "all" ? allReports : allReports.filter(r => r.status === reportFilter);

  const getUserName = (userId: string) => {
    const u = allUsers.find(u => u.user_id === userId);
    return u?.display_name || userId.slice(0, 8) + "...";
  };

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
      {/* Report Detail Modal */}
      {showReportDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl p-6 w-full max-w-lg space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground flex items-center gap-2"><FaEye className="text-primary" /> Report Details</h2>
              <button onClick={() => setShowReportDetail(null)} className="text-muted-foreground hover:text-foreground"><FaTimes /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Type:</span> <span className="font-medium text-foreground">{showReportDetail.crime_type}</span></div>
                <div><span className="text-muted-foreground">Status:</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    showReportDetail.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    showReportDetail.status === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>{showReportDetail.status}</span>
                </div>
                <div><span className="text-muted-foreground">Location:</span> <span className="text-foreground">{showReportDetail.location || "N/A"}</span></div>
                <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{showReportDetail.date_time ? new Date(showReportDetail.date_time).toLocaleString() : "N/A"}</span></div>
                <div><span className="text-muted-foreground">Ref:</span> <span className="text-foreground">{showReportDetail.reference_number || "N/A"}</span></div>
                <div><span className="text-muted-foreground">Reporter:</span> <span className="text-foreground">{getUserName(showReportDetail.user_id)}</span></div>
              </div>
              {showReportDetail.latitude && showReportDetail.longitude && (
                <div><span className="text-muted-foreground">Coordinates:</span> <span className="text-foreground">{showReportDetail.latitude.toFixed(4)}, {showReportDetail.longitude.toFixed(4)}</span></div>
              )}
              <div>
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1 p-3 rounded-xl bg-muted text-foreground text-xs">{showReportDetail.description}</p>
              </div>
              <div><span className="text-muted-foreground">Submitted:</span> <span className="text-foreground">{new Date(showReportDetail.created_at).toLocaleString()}</span></div>
            </div>

            {/* Reply to user */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Reply to reporter:</label>
              <div className="flex gap-2">
                <input value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder="Type a message..."
                  className="flex-1 p-2.5 rounded-xl border border-border bg-background text-foreground text-sm" />
                <button onClick={() => handleReplyToUser(showReportDetail)}
                  className="px-3 py-2.5 rounded-xl text-primary-foreground text-sm font-medium" style={{ background: "var(--gradient-primary)" }}>
                  <FaReply />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {showReportDetail.status === "pending" && (
                <>
                  <button onClick={() => handleUpdateStatus(showReportDetail.id, "resolved")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-all">
                    ✓ Resolve
                  </button>
                  <button onClick={() => handleUpdateStatus(showReportDetail.id, "rejected")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all">
                    ✗ Reject
                  </button>
                </>
              )}
              {showReportDetail.status !== "pending" && (
                <button onClick={() => handleUpdateStatus(showReportDetail.id, "pending")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-all">
                  ↩ Reopen
                </button>
              )}
              <button onClick={() => handleDeleteReport(showReportDetail.id)}
                className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all">
                <FaTrash />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground flex items-center gap-2"><FaBell className="text-primary" /> Broadcast Notification</h2>
              <button onClick={() => setShowBroadcast(false)}><FaTimes /></button>
            </div>
            <input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} placeholder="Title"
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm" />
            <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Message" rows={3}
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm" />
            <select value={broadcastType} onChange={e => setBroadcastType(e.target.value)}
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
              <h2 className="font-bold text-foreground flex items-center gap-2"><FaUserPlus className="text-primary" /> Add User / Admin</h2>
              <button onClick={() => setShowAddUser(false)}><FaTimes /></button>
            </div>
            <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email"
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm" />
            <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Password"
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm" />
            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)}
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

      {/* All Reports View */}
      {showAllReports && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-card pb-3">
              <h2 className="font-bold text-foreground">All Crime Reports ({filteredReports.length})</h2>
              <div className="flex gap-2 items-center">
                <select value={reportFilter} onChange={e => setReportFilter(e.target.value)}
                  className="p-2 rounded-lg border border-border bg-background text-foreground text-xs">
                  <option value="all">All</option><option value="pending">Pending</option>
                  <option value="resolved">Resolved</option><option value="rejected">Rejected</option>
                </select>
                <button onClick={handleDownloadReports} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><FaDownload /></button>
                <button onClick={() => setShowAllReports(false)}><FaTimes /></button>
              </div>
            </div>
            <div className="space-y-2">
              {filteredReports.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{r.crime_type} — {r.category || "Uncategorized"}</p>
                    <p className="text-[10px] text-muted-foreground">📍 {r.location || "N/A"} • {getUserName(r.user_id)} • {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      r.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      r.status === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{r.status}</span>
                    <button onClick={() => { setShowAllReports(false); setShowReportDetail(r); }}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs"><FaEye /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Users View */}
      {showAllUsers && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-card pb-3">
              <h2 className="font-bold text-foreground">All Users ({allUsers.length})</h2>
              <button onClick={() => setShowAllUsers(false)}><FaTimes /></button>
            </div>
            <div className="space-y-2">
              {allUsers.map(u => (
                <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0"
                    style={{ background: "var(--gradient-primary)" }}>
                    {u.display_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{u.display_name || "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground">{u.phone || "No phone"} • Joined {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all">
          <FaArrowLeft className="text-sm" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FaTachometerAlt className="text-primary" /> Admin Dashboard
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              <FaCrown className="inline mr-1 text-[10px]" />Super Admin
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">Full control over users, reports, and system operations.</p>
        </div>
        <button onClick={handleRefresh}
          className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all flex items-center gap-1">
          <FaSync className={refreshing ? "animate-spin" : ""} /> {refreshing ? "..." : "Refresh"}
        </button>
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
            { icon: FaDownload, label: "Download Reports", color: "hsl(38, 92%, 50%)", action: handleDownloadReports },
            { icon: FaClipboardList, label: "All Reports", color: "hsl(263, 70%, 50%)", action: () => setShowAllReports(true) },
            { icon: FaUsers, label: "All Users", color: "hsl(234, 85%, 58%)", action: () => setShowAllUsers(true) },
            { icon: FaMapMarkerAlt, label: "Search Stations", color: "hsl(192, 91%, 36%)", action: () => navigate("/search-stations") },
            { icon: FaCog, label: "Settings", color: "hsl(0, 84%, 60%)", action: () => navigate("/settings") },
            { icon: FaExclamationTriangle, label: "Missing Persons", color: "hsl(25, 95%, 53%)", action: () => navigate("/missing-persons") },
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">📋 Recent Reports</h3>
            <button onClick={() => setShowAllReports(true)} className="text-xs text-primary font-semibold hover:underline">View all →</button>
          </div>
          {recentReports.length === 0 ? (
            <p className="text-xs text-muted-foreground">No reports yet.</p>
          ) : (
            <div className="space-y-2">
              {recentReports.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-all"
                  onClick={() => setShowReportDetail(r)}>
                  <div>
                    <p className="text-xs font-medium text-foreground">{r.crime_type}</p>
                    <p className="text-[10px] text-muted-foreground">📍 {r.location || "N/A"} • {getUserName(r.user_id)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      r.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      r.status === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{r.status}</span>
                    <FaEye className="text-xs text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">👤 Recent Users</h3>
            <button onClick={() => setShowAllUsers(true)} className="text-xs text-primary font-semibold hover:underline">View all →</button>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {recentUsers.map((u) => (
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
