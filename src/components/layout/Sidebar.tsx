import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes, FaHome, FaGavel, FaHandsHelping, FaSearch,
  FaUserFriends, FaMapMarkerAlt, FaBook, FaCog, FaBell,
  FaSignOutAlt, FaShieldAlt,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

const NAV_ITEMS = [
  { key: "dashboard", icon: FaHome, route: "/main" },
  { key: "reportCrime", icon: FaGavel, route: "/report-crime" },
  { key: "getHelp", icon: FaHandsHelping, route: "/get-help" },
  { key: "lostAndFound", icon: FaSearch, route: "/lost-and-found" },
  { key: "missingPersons", icon: FaUserFriends, route: "/missing-persons" },
  { key: "searchStations", icon: FaMapMarkerAlt, route: "/search-stations" },
  { key: "lawsAndRights", icon: FaBook, route: "/laws-and-rights" },
  { key: "settings", icon: FaCog, route: "/settings" },
  { key: "notifications", icon: FaBell, route: "/notifications" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { t } = useLang();

  const handleNav = (route: string) => {
    navigate(route);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col overflow-y-auto"
            style={{ background: "var(--gradient-primary)" }}
          >
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-2 text-white">
                <FaShieldAlt className="text-xl" />
                <span className="font-bold text-lg">ReportCrime</span>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white">
                <FaTimes className="text-xl" />
              </button>
            </div>

            {user && (
              <div className="px-5 pb-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                    {profile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {profile?.display_name || user.email}
                    </p>
                    <p className="text-white/60 text-xs truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex-1 px-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.route;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNav(item.route)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="text-lg shrink-0" />
                    <span>{t(item.key)}</span>
                  </button>
                );
              })}

              {isAdmin && (
                <button
                  onClick={() => handleNav("/admin")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === "/admin"
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <FaShieldAlt className="text-lg shrink-0" />
                  <span>Admin Dashboard</span>
                </button>
              )}
            </nav>

            {user && (
              <div className="p-4">
                <button
                  onClick={async () => { await signOut(); navigate("/home"); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white text-sm font-medium transition-all"
                >
                  <FaSignOutAlt className="text-lg" />
                  <span>{t("signOut")}</span>
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
