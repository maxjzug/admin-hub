import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { WhatsAppButton } from "./WhatsAppButton";

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-bg)" }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <TopBar onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="flex-1 pb-20 md:pb-6">
        <Outlet />
      </main>

      <BottomNav />
      <WhatsAppButton />

      {/* Footer - desktop only */}
      <footer className="hidden md:block text-center py-4 text-xs text-muted-foreground border-t border-border/30">
        © 2026 ReportCrime Uganda. All rights reserved.
      </footer>
    </div>
  );
}
