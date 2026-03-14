import { FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import { motion } from "framer-motion";

const STATIONS = [
  { name: "Central Police Station", type: "Regional HQ", phone: "0414-233-295", address: "Kampala Road", color: "hsl(234, 85%, 65%)" },
  { name: "Kira Road Police Station", type: "Division", phone: "0414-343-088", address: "Kira Road, Kamwokya", color: "hsl(263, 70%, 50%)" },
  { name: "Nakawa Police Station", type: "Division", phone: "0414-220-100", address: "Nakawa Division", color: "hsl(192, 91%, 36%)" },
  { name: "Kawempe Police Station", type: "Division", phone: "0414-532-655", address: "Kawempe Division", color: "hsl(142, 71%, 45%)" },
  { name: "Makindye Police Station", type: "Division", phone: "0414-510-311", address: "Makindye Division", color: "hsl(38, 92%, 50%)" },
  { name: "Rubaga Police Station", type: "Division", phone: "0414-272-491", address: "Rubaga Division", color: "hsl(330, 81%, 60%)" },
];

export function SearchStationsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-1">Search Stations</h1>
      <p className="text-sm text-muted-foreground mb-6">Find Uganda Police Force stations near you.</p>

      <div className="space-y-3">
        {STATIONS.map((s, i) => (
          <motion.div key={s.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/50">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block"
              style={{ background: s.color + "20", color: s.color }}>{s.type}</span>
            <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">📍 {s.address}</p>
            <a href={`tel:${s.phone.replace(/-/g, "")}`}
              className="flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:underline">
              <FaPhone className="text-[10px]" />{s.phone}
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
