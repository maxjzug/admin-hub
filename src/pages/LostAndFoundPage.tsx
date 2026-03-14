import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Item { id: string; item_name: string; location: string | null; status: string; created_at: string; }

export function LostAndFoundPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("missing_property").select("id, item_name, location, status, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setItems((data as Item[]) || []); setLoading(false); });
  }, []);

  const demoItems: Item[] = [
    { id: "1", item_name: "Blue Backpack", location: "Owino Market", status: "lost", created_at: "2026-03-12" },
    { id: "2", item_name: "Samsung Phone", location: "Wandegeya", status: "found", created_at: "2026-03-10" },
  ];

  const display = items.length > 0 ? items : demoItems;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Lost & Found</h1>
          <p className="text-sm text-muted-foreground">Report or search for lost items.</p>
        </div>
        <button onClick={() => navigate("/report-missing-property")}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground shrink-0"
          style={{ background: "var(--gradient-primary)" }}><FaPlus /></button>
      </div>

      {loading ? (
        <div className="space-y-3">{[0,1,2].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {display.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: item.status === "lost" ? "hsl(0 84% 60% / 0.1)" : "hsl(142 71% 45% / 0.1)",
                    color: item.status === "lost" ? "hsl(0 84% 60%)" : "hsl(142 71% 45%)" }}>
                  {item.status}
                </span>
                <span className="text-xs text-muted-foreground">{item.created_at.split("T")[0]}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{item.item_name}</h3>
              <p className="text-xs text-muted-foreground mt-1">📍 {item.location || "Unknown"}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
