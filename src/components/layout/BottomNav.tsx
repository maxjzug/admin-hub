import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaGavel, FaHandsHelping, FaBell, FaCog } from "react-icons/fa";
import { useLang } from "@/contexts/LanguageContext";

const ITEMS = [
  { key: "dashboard", icon: FaHome, route: "/main" },
  { key: "reportCrime", icon: FaGavel, route: "/report-crime" },
  { key: "getHelp", icon: FaHandsHelping, route: "/get-help" },
  { key: "notifications", icon: FaBell, route: "/notifications" },
  { key: "settings", icon: FaCog, route: "/settings" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLang();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/90 backdrop-blur-lg border-t border-border/50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.route;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`text-lg ${active ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] font-medium">{t(item.key)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
