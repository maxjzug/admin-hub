import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  FaGavel, FaHandsHelping, FaSearch, FaUserFriends,
  FaMapMarkerAlt, FaBook, FaUserPlus, FaBox, FaTimes,
} from "react-icons/fa";
import { motion } from "framer-motion";

const CARDS = [
  { key: "report-crime", label: "Report Crime", desc: "Submit crime or complaint reports", route: "/report-crime", icon: FaGavel, color: "hsl(0, 84%, 60%)" },
  { key: "get-help", label: "Get Help", desc: "Contact support & AI assistant", route: "/get-help", icon: FaHandsHelping, color: "hsl(142, 71%, 45%)" },
  { key: "lost-and-found", label: "Lost & Found", desc: "Report or search for lost items", route: "/lost-and-found", icon: FaSearch, color: "hsl(38, 92%, 50%)" },
  { key: "missing-persons", label: "Missing Persons", desc: "View & report missing people", route: "/missing-persons", icon: FaUserFriends, color: "hsl(217, 91%, 60%)" },
  { key: "search-stations", label: "Search Stations", desc: "Find police stations near you", route: "/search-stations", icon: FaMapMarkerAlt, color: "hsl(263, 70%, 50%)" },
  { key: "laws", label: "Laws & Rights", desc: "Browse Ugandan laws & rights", route: "/laws-and-rights", icon: FaBook, color: "hsl(192, 91%, 36%)" },
  { key: "report-missing-person", label: "Report Missing Person", desc: "File a missing person report", route: "/report-missing-person", icon: FaUserPlus, color: "hsl(330, 81%, 60%)" },
  { key: "report-missing-property", label: "Report Missing Property", desc: "Report lost property", route: "/report-missing-property", icon: FaBox, color: "hsl(25, 95%, 53%)" },
];

export function MainDashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = CARDS.filter(
    (c) => !search || c.label.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Search bar */}
      <div className="relative mb-6">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
        <input
          type="text" placeholder="Search features..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full py-2.5 pl-10 pr-10 border-2 border-primary/20 bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition">
            <FaTimes className="text-xs" />
          </button>
        )}
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.key}
              onClick={() => navigate(card.route)}
              initial={{ opacity: 0, y: 24, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05 + i * 0.05, duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card backdrop-blur-sm text-left p-4 transition-shadow duration-300 hover:shadow-lg hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: card.color + "20", color: card.color }}>
                <Icon className="text-lg" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{card.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
