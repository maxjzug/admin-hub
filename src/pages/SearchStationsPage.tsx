import { useState, useMemo, useEffect } from "react";
import {
  FaMapMarkerAlt, FaPhone, FaSearch, FaClock, FaShieldAlt,
  FaDirections, FaFilter, FaMap, FaList, FaTimes, FaCrosshairs,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BackButton } from "@/components/layout/BackButton";

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Station {
  id: number; name: string; district: string; division: string; address: string;
  phone: string; emergency: string; hours: string; lat: number; lng: number; type: string;
  distance?: number;
}

const STATIONS: Station[] = [
  { id:1, name:"Central Police Station", district:"Kampala", division:"Central", address:"Kampala Road, Kampala", phone:"0414-233-295", emergency:"999", hours:"Open 24/7", lat:0.3136, lng:32.5811, type:"Regional HQ" },
  { id:2, name:"Kira Road Police Station", district:"Kampala", division:"Central", address:"Kira Road, Kampala", phone:"0414-343-088", emergency:"999", hours:"Open 24/7", lat:0.3403, lng:32.5895, type:"Division" },
  { id:3, name:"Jinja Road Police Station", district:"Kampala", division:"East", address:"Jinja Road, Kampala", phone:"0414-220-202", emergency:"999", hours:"Open 24/7", lat:0.3178, lng:32.6001, type:"Division" },
  { id:4, name:"Kawempe Police Station", district:"Kampala", division:"Kawempe", address:"Kawempe, Kampala", phone:"0414-532-655", emergency:"999", hours:"Open 24/7", lat:0.3731, lng:32.556, type:"Division" },
  { id:5, name:"Makindye Police Station", district:"Kampala", division:"Makindye", address:"Makindye, Kampala", phone:"0414-510-311", emergency:"999", hours:"Open 24/7", lat:0.2788, lng:32.5894, type:"Division" },
  { id:6, name:"Rubaga Police Station", district:"Kampala", division:"Rubaga", address:"Rubaga Road, Kampala", phone:"0414-272-491", emergency:"999", hours:"Open 24/7", lat:0.3028, lng:32.5532, type:"Division" },
  { id:7, name:"Nakawa Police Station", district:"Kampala", division:"Nakawa", address:"Nakawa, Kampala", phone:"0414-220-100", emergency:"999", hours:"Open 24/7", lat:0.3219, lng:32.6219, type:"Division" },
  { id:8, name:"Old Kampala Police Station", district:"Kampala", division:"Central", address:"Old Kampala Hill, Kampala", phone:"0414-251-046", emergency:"999", hours:"Open 24/7", lat:0.3172, lng:32.5726, type:"Station" },
  { id:9, name:"Wandegeya Police Station", district:"Kampala", division:"Central", address:"Wandegeya, Kampala", phone:"0414-530-155", emergency:"999", hours:"Open 24/7", lat:0.3386, lng:32.5704, type:"Station" },
  { id:10, name:"Katwe Police Station", district:"Kampala", division:"Makindye", address:"Katwe, Kampala", phone:"0414-271-960", emergency:"999", hours:"Open 24/7", lat:0.2952, lng:32.5668, type:"Station" },
  { id:11, name:"Kabalagala Police Station", district:"Kampala", division:"Makindye", address:"Kabalagala, Kampala", phone:"0414-510-412", emergency:"999", hours:"Open 24/7", lat:0.2919, lng:32.5981, type:"Station" },
  { id:12, name:"Entebbe Central Police Station", district:"Wakiso", division:"Entebbe", address:"Entebbe Road, Entebbe", phone:"0414-320-247", emergency:"999", hours:"Open 24/7", lat:0.0512, lng:32.4637, type:"Regional HQ" },
  { id:13, name:"Wakiso Police Station", district:"Wakiso", division:"Wakiso", address:"Wakiso Town, Wakiso", phone:"0312-200-990", emergency:"999", hours:"Open 24/7", lat:0.4064, lng:32.4561, type:"Station" },
  { id:14, name:"Nansana Police Station", district:"Wakiso", division:"Nansana", address:"Nansana Town, Wakiso", phone:"0414-342-109", emergency:"999", hours:"Open 24/7", lat:0.3652, lng:32.5238, type:"Station" },
  { id:15, name:"Kajjansi Police Station", district:"Wakiso", division:"Entebbe", address:"Kajjansi, Wakiso", phone:"0414-200-540", emergency:"999", hours:"Open 24/7", lat:0.1765, lng:32.5453, type:"Station" },
  { id:16, name:"Luweero Central Police Station", district:"Luweero", division:"Luweero", address:"Luweero Town", phone:"0312-264-801", emergency:"999", hours:"Open 24/7", lat:0.8475, lng:32.4847, type:"Regional HQ" },
  { id:17, name:"Wobulenzi Police Station", district:"Luweero", division:"Wobulenzi", address:"Wobulenzi Town", phone:"0312-264-820", emergency:"999", hours:"Open 24/7", lat:0.7269, lng:32.5019, type:"Station" },
  { id:18, name:"Zirobwe Police Station", district:"Luweero", division:"Zirobwe", address:"Zirobwe Town", phone:"0312-264-835", emergency:"999", hours:"Mon–Sat 08:00–20:00", lat:0.7849, lng:32.6281, type:"Station" },
  { id:19, name:"Kamira Police Station", district:"Luweero", division:"Kamira", address:"Kamira Sub-county", phone:"0312-264-842", emergency:"999", hours:"Mon–Sat 08:00–18:00", lat:0.9214, lng:32.5662, type:"Station" },
  { id:20, name:"Katikamu Police Station", district:"Luweero", division:"Katikamu", address:"Katikamu, Luweero", phone:"0312-264-850", emergency:"999", hours:"Mon–Sat 08:00–18:00", lat:0.761, lng:32.4423, type:"Station" },
  { id:21, name:"Mukono Police Station", district:"Mukono", division:"Mukono", address:"Mukono Town", phone:"0414-290-215", emergency:"999", hours:"Open 24/7", lat:0.3531, lng:32.7553, type:"Regional HQ" },
  { id:22, name:"Seeta Police Station", district:"Mukono", division:"Seeta", address:"Seeta, Mukono", phone:"0414-291-010", emergency:"999", hours:"Open 24/7", lat:0.3411, lng:32.6812, type:"Station" },
  { id:23, name:"Kayunga Police Station", district:"Kayunga", division:"Kayunga", address:"Kayunga Town", phone:"0312-270-100", emergency:"999", hours:"Open 24/7", lat:0.7033, lng:32.8893, type:"Station" },
  { id:24, name:"Jinja Central Police Station", district:"Jinja", division:"Jinja", address:"Main Street, Jinja", phone:"0434-121-300", emergency:"999", hours:"Open 24/7", lat:0.4244, lng:33.2041, type:"Regional HQ" },
  { id:25, name:"Nalufenya Police Station", district:"Jinja", division:"Nalufenya", address:"Nalufenya, Jinja", phone:"0434-121-355", emergency:"999", hours:"Open 24/7", lat:0.4391, lng:33.2204, type:"Division" },
  { id:26, name:"Mbarara Central Police Station", district:"Mbarara", division:"Mbarara", address:"High Street, Mbarara", phone:"0485-420-100", emergency:"999", hours:"Open 24/7", lat:-0.6062, lng:30.6545, type:"Regional HQ" },
  { id:27, name:"Rwizi Police Station", district:"Mbarara", division:"Rwizi", address:"Rwizi Arc, Mbarara", phone:"0485-421-200", emergency:"999", hours:"Open 24/7", lat:-0.5926, lng:30.6431, type:"Division" },
  { id:28, name:"Gulu Central Police Station", district:"Gulu", division:"Gulu", address:"Gulu Town", phone:"0471-432-270", emergency:"999", hours:"Open 24/7", lat:2.7747, lng:32.299, type:"Regional HQ" },
  { id:29, name:"Layibi Police Station", district:"Gulu", division:"Layibi", address:"Layibi Division, Gulu", phone:"0471-432-310", emergency:"999", hours:"Open 24/7", lat:2.7612, lng:32.2841, type:"Station" },
  { id:30, name:"Mbale Central Police Station", district:"Mbale", division:"Mbale", address:"Cathedral Avenue, Mbale", phone:"0454-433-570", emergency:"999", hours:"Open 24/7", lat:1.0782, lng:34.1754, type:"Regional HQ" },
  { id:31, name:"Fort Portal Police Station", district:"Kabarole", division:"Fort Portal", address:"Fort Portal Town", phone:"0483-422-222", emergency:"999", hours:"Open 24/7", lat:0.6615, lng:30.2746, type:"Regional HQ" },
  { id:32, name:"Masaka Police Station", district:"Masaka", division:"Masaka", address:"Masaka Town", phone:"0481-420-055", emergency:"999", hours:"Open 24/7", lat:-0.3397, lng:31.7394, type:"Regional HQ" },
  { id:33, name:"Nyendo Police Station", district:"Masaka", division:"Nyendo", address:"Nyendo, Masaka", phone:"0481-420-180", emergency:"999", hours:"Open 24/7", lat:-0.3589, lng:31.7212, type:"Station" },
  { id:34, name:"Lira Central Police Station", district:"Lira", division:"Lira", address:"Lira Town", phone:"0473-420-100", emergency:"999", hours:"Open 24/7", lat:2.2487, lng:32.8997, type:"Regional HQ" },
  { id:35, name:"Arua Police Station", district:"Arua", division:"Arua", address:"Arua Town", phone:"0476-420-100", emergency:"999", hours:"Open 24/7", lat:3.0199, lng:30.9106, type:"Regional HQ" },
  { id:36, name:"Soroti Police Station", district:"Soroti", division:"Soroti", address:"Soroti Town", phone:"0454-461-133", emergency:"999", hours:"Open 24/7", lat:1.715, lng:33.6111, type:"Regional HQ" },
  { id:37, name:"Kabale Police Station", district:"Kabale", division:"Kabale", address:"Kabale Town", phone:"0486-422-103", emergency:"999", hours:"Open 24/7", lat:-1.2491, lng:29.9897, type:"Regional HQ" },
  { id:38, name:"Tororo Police Station", district:"Tororo", division:"Tororo", address:"Tororo Town", phone:"0454-445-113", emergency:"999", hours:"Open 24/7", lat:0.6924, lng:34.1805, type:"Regional HQ" },
  { id:39, name:"Hoima Police Station", district:"Hoima", division:"Hoima", address:"Hoima Town", phone:"0465-440-100", emergency:"999", hours:"Open 24/7", lat:1.4341, lng:31.3522, type:"Regional HQ" },
  { id:40, name:"Iganga Police Station", district:"Iganga", division:"Iganga", address:"Iganga Town", phone:"0434-440-214", emergency:"999", hours:"Open 24/7", lat:0.6097, lng:33.4688, type:"Station" },
  { id:41, name:"Mityana Police Station", district:"Mityana", division:"Mityana", address:"Mityana Town", phone:"0312-268-100", emergency:"999", hours:"Open 24/7", lat:0.4257, lng:32.0244, type:"Regional HQ" },
  { id:42, name:"Busunjju Police Station", district:"Mityana", division:"Busunjju", address:"Busunjju, Mityana", phone:"0312-268-120", emergency:"999", hours:"Mon–Sat 08:00–18:00", lat:0.4541, lng:31.9862, type:"Station" },
  { id:43, name:"Nakaseke Police Station", district:"Nakaseke", division:"Nakaseke", address:"Nakaseke Town", phone:"0312-264-900", emergency:"999", hours:"Open 24/7", lat:0.9892, lng:32.4538, type:"Station" },
  { id:44, name:"Mpigi Police Station", district:"Mpigi", division:"Mpigi", address:"Mpigi Town", phone:"0414-200-600", emergency:"999", hours:"Open 24/7", lat:0.2252, lng:32.3143, type:"Station" },
  { id:45, name:"Pallisa Police Station", district:"Pallisa", division:"Pallisa", address:"Pallisa Town", phone:"0454-464-100", emergency:"999", hours:"Open 24/7", lat:1.1453, lng:33.7095, type:"Station" },
  { id:46, name:"Kasese Police Station", district:"Kasese", division:"Kasese", address:"Kasese Town", phone:"0483-444-100", emergency:"999", hours:"Open 24/7", lat:0.1826, lng:30.0859, type:"Regional HQ" },
  { id:47, name:"Ntungamo Police Station", district:"Ntungamo", division:"Ntungamo", address:"Ntungamo Town", phone:"0486-460-100", emergency:"999", hours:"Open 24/7", lat:-0.8834, lng:30.2655, type:"Station" },
  { id:48, name:"Bushenyi Police Station", district:"Bushenyi", division:"Bushenyi", address:"Bushenyi Town", phone:"0485-440-100", emergency:"999", hours:"Open 24/7", lat:-0.5459, lng:30.2016, type:"Station" },
];

const ALL_DISTRICTS = ["All Districts", ...Array.from(new Set(STATIONS.map(s => s.district))).sort()];
const ALL_TYPES = ["All Types", ...Array.from(new Set(STATIONS.map(s => s.type))).sort()];

const TYPE_COLOR: Record<string, string> = { "Regional HQ": "hsl(234, 85%, 65%)", "Division": "hsl(160, 84%, 39%)", "Station": "hsl(38, 92%, 50%)" };

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], zoom, { duration: 0.8 }); }, [lat, lng, zoom, map]);
  return null;
}

function stationIcon(type: string) {
  const color = TYPE_COLOR[type] || "hsl(234, 85%, 65%)";
  return L.divIcon({
    html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px">🛡️</div>`,
    iconSize: [28, 28],
    className: "",
  });
}

const userIcon = L.divIcon({
  html: '<div style="width:16px;height:16px;background:hsl(234,85%,58%);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
  iconSize: [16, 16],
  className: "",
});

export function SearchStationsPage() {
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("All Districts");
  const [type, setType] = useState("All Types");
  const [showFilters, setShowFilters] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setLocating(false); },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = STATIONS.filter(s => {
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.district.toLowerCase().includes(q) || s.division.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
      const matchDistrict = district === "All Districts" || s.district === district;
      const matchType = type === "All Types" || s.type === type;
      return matchSearch && matchDistrict && matchType;
    });
    if (userLat && userLng) {
      result = result.map(s => ({ ...s, distance: getDistance(userLat, userLng, s.lat, s.lng) })).sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
    return result;
  }, [search, district, type, userLat, userLng]);

  const openDirections = (s: Station) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + ", " + s.address)}`, "_blank", "noopener");
  };

  const QUICK_DISTRICTS = ["All Districts", "Kampala", "Luweero", "Wakiso", "Mukono", "Jinja", "Mbarara", "Gulu", "Lira"];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <BackButton />

      <div className="flex items-center gap-2 mb-1">
        <FaShieldAlt className="text-primary text-xl" />
        <h1 className="text-xl font-bold text-foreground">Search Police Stations</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Find Uganda Police Force stations by name, district, or division. {filtered.length} station{filtered.length !== 1 ? "s" : ""} found.
      </p>

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setViewMode("list")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}>
          <FaList /> List
        </button>
        <button onClick={() => setViewMode("map")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${viewMode === "map" ? "bg-accent text-accent-foreground shadow-md" : "bg-muted text-muted-foreground"}`}>
          <FaMap /> Map
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, district, or address…"
          className="w-full pl-9 pr-4 py-2.5 rounded-full border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all ${showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>
          <FaFilter /> Filters {(district !== "All Districts" || type !== "All Types") && <span className="bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">!</span>}
        </button>
        <button onClick={detectLocation} disabled={locating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30 disabled:opacity-50">
          <FaCrosshairs /> {locating ? "Detecting…" : userLat ? "Near me ✓" : "Sort by distance"}
        </button>
        {userLat && (
          <button onClick={() => { setUserLat(null); setUserLng(null); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/30">
            <FaTimes /> Clear
          </button>
        )}
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3">
            <div className="grid grid-cols-2 gap-3 p-3 bg-card rounded-2xl border border-border">
              <div>
                <label className="text-xs font-medium text-muted-foreground">District</label>
                <select value={district} onChange={e => setDistrict(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm">
                  {ALL_DISTRICTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select value={type} onChange={e => setType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm">
                  {ALL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={() => { setDistrict("All Districts"); setType("All Types"); }}
                className="col-span-2 px-3 py-1.5 rounded-full text-xs bg-muted text-muted-foreground hover:bg-muted/80">Reset Filters</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick district chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide mb-1">
        {QUICK_DISTRICTS.map(d => (
          <button key={d} onClick={() => setDistrict(d)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${district === d ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/50"}`}>
            {d}
          </button>
        ))}
      </div>

      {/* MAP VIEW */}
      {viewMode === "map" && (
        <div className="mb-4">
          <div className="rounded-2xl overflow-hidden border border-border/50 h-[350px]">
            <MapContainer center={[1.3, 32.3]} zoom={7} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
              {filtered.map(s => (
                <Marker key={s.id} position={[s.lat, s.lng]} icon={stationIcon(s.type)}
                  eventHandlers={{ click: () => setSelectedStation(s) }}>
                  <Popup>
                    <strong>{s.name}</strong><br />
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{s.district} • {s.division}</span><br />
                    📍 {s.address}<br />
                    <a href={`tel:${s.phone.replace(/-/g, "")}`}>📞 {s.phone}</a><br />
                    🕐 {s.hours}
                  </Popup>
                </Marker>
              ))}
              {userLat && userLng && (
                <Marker position={[userLat, userLng]} icon={userIcon}>
                  <Popup>Your Location</Popup>
                </Marker>
              )}
              {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} zoom={flyTarget.zoom} />}
            </MapContainer>
          </div>

          {/* Legend */}
          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
            {Object.entries(TYPE_COLOR).map(([t, c]) => (
              <span key={t} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ background: c }} /> {t}
              </span>
            ))}
            {userLat && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary" /> You</span>}
          </div>

          {/* Selected station card on map */}
          {selectedStation && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 rounded-2xl bg-card border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: (TYPE_COLOR[selectedStation.type] || "") + "20", color: TYPE_COLOR[selectedStation.type] }}>{selectedStation.type}</span>
                  <h3 className="text-sm font-bold text-foreground mt-1">{selectedStation.name}</h3>
                  <p className="text-xs text-muted-foreground">📍 {selectedStation.address} | {selectedStation.district} • {selectedStation.division}</p>
                  <p className="text-xs text-muted-foreground">🕐 {selectedStation.hours}</p>
                </div>
                <button onClick={() => setSelectedStation(null)} className="text-muted-foreground hover:text-foreground"><FaTimes /></button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <a href={`tel:${selectedStation.phone.replace(/-/g, "")}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <FaPhone className="text-[10px]" /> {selectedStation.phone}
                </a>
                <button onClick={() => openDirections(selectedStation)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                  <FaDirections /> Directions
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No stations match your search.</p>
          ) : filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="p-4 rounded-2xl bg-card border border-border/50 cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => { setSelectedStation(s); setViewMode("map"); setFlyTarget({ lat: s.lat, lng: s.lng, zoom: 14 }); }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1"
                    style={{ background: (TYPE_COLOR[s.type] || "") + "20", color: TYPE_COLOR[s.type] }}>{s.type}</span>
                  <h3 className="text-sm font-bold text-foreground">{s.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5"><FaMapMarkerAlt className="inline mr-1" />{s.address}</p>
                  <p className="text-xs text-muted-foreground"><FaShieldAlt className="inline mr-1" />{s.district} • {s.division}</p>
                  <p className="text-xs text-muted-foreground"><FaClock className="inline mr-1" />{s.hours}</p>
                </div>
                {s.distance !== undefined && (
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg shrink-0">
                    {s.distance.toFixed(1)} km
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3" onClick={e => e.stopPropagation()}>
                <a href={`tel:${s.phone.replace(/-/g, "")}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20">
                  <FaPhone className="text-[10px]" /> {s.phone}
                </a>
                <a href={`tel:999`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20">
                  <FaPhone className="text-[10px]" /> 999
                </a>
                <button onClick={() => openDirections(s)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/80">
                  <FaDirections /> Directions
                </button>
                <button onClick={() => { setSelectedStation(s); setViewMode("map"); setFlyTarget({ lat: s.lat, lng: s.lng, zoom: 14 }); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80">
                  <FaMap /> Map
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
