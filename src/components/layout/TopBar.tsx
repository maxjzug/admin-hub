import { useNavigate } from "react-router-dom";
import { FaBars, FaBell, FaShieldAlt } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-lg border-b border-border/50">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all"
        >
          <FaBars />
        </button>
        <div className="flex items-center gap-2">
          <FaShieldAlt className="text-primary text-lg" />
          <span className="font-bold text-foreground text-sm">ReportCrime Uganda</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/notifications")}
          className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all relative"
        >
          <FaBell />
        </button>

        {user ? (
          <button
            onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            {profile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
