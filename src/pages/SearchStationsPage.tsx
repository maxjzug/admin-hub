import { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaPhone, FaCrosshairs, FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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

const STATIONS = [
  { name: "Central Police Station", type: "Regional HQ", phone: "0414-233-295", address: "Kampala Road", lat: 0.3136, lng: 32.5811, color: "hsl(234, 85%, 65%)" },
  { name: "Kira Road Police Station", type: "Division", phone: "0414-343-088", address: "Kira Road, Kamwokya", lat: 0.3350, lng: 32.5920, color: "hsl(263, 70%, 50%)" },
  { name: "Nakawa Police Station", type: "Division", phone: "0414-220-100", address: "Nakawa Division", lat: 0.3314, lng: 32.6155, color: "hsl(192, 91%, 36%)" },
  { name: "Kawempe Police Station", type: "Division", phone: "0414-532-655", address: "Kawempe Division", lat: 0.3536, lng: 32.5655, color: "hsl(142, 71%, 45%)" },
  { name: "Makindye Police Station", type: "Division", phone: "0414-510-311", address: "Makindye Division", lat: 0.2960, lng: 32.5930, color: "hsl(38, 92%, 50%)" },
  { name: "Rubaga Police Station", type: "Division", phone: "0414-272-491", address: "Rubaga Division", lat: 0.3050, lng: 32.5550, color: "hsl(330, 81%, 60%)" },
  { name: "Jinja Road Police Station", type: "Division", phone: "0414-251-720", address: "Jinja Road", lat: 0.3175, lng: 32.5980, color: "hsl(25, 95%, 53%)" },
  { name: "Wandegeya Police Station", type: "Division", phone: "0414-540-123", address: "Wandegeya", lat: 0.3410, lng: 32.5750, color: "hsl(0, 84%, 60%)" },
];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function FlyToUser({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 14); }, [lat, lng, map]);
  return null;
}

export function SearchStationsPage() {
  const navigate = useNavigate();
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [filterNearby, setFilterNearby] = useState(false);

  const handleDetect = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setDetecting(false); setFilterNearby(true); },
      () => setDetecting(false)
    );
  };

  const sortedStations = userLat && userLng
    ? [...STATIONS].sort((a, b) => getDistance(userLat, userLng, a.lat, a.lng) - getDistance(userLat, userLng, b.lat, b.lng))
    : STATIONS;

  const displayStations = filterNearby && userLat && userLng
    ? sortedStations.filter(s => getDistance(userLat, userLng, s.lat, s.lng) < 15)
    : sortedStations;

  const userIcon = L.divIcon({
    html: '<div style="width:14px;height:14px;background:hsl(234,85%,58%);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
    iconSize: [14, 14],
    className: "",
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <BackButton />
      <h1 className="text-xl font-bold text-foreground mb-1">Search Stations</h1>
      <p className="text-sm text-muted-foreground mb-4">Find Uganda Police Force stations near you.</p>

      <div className="flex gap-2 mb-4">
        <button onClick={handleDetect} disabled={detecting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-primary-foreground text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--gradient-primary)" }}>
          <FaCrosshairs /> {detecting ? "Detecting..." : "Find Nearby"}
        </button>
        {filterNearby && (
          <button onClick={() => setFilterNearby(false)}
            className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80">
            Show All
          </button>
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border/50 mb-4 h-[250px]">
        <MapContainer center={[0.3136, 32.5811]} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          {displayStations.map(s => (
            <Marker key={s.name} position={[s.lat, s.lng]}>
              <Popup>
                <strong>{s.name}</strong><br />{s.address}<br />
                <a href={`tel:${s.phone.replace(/-/g, "")}`}>{s.phone}</a>
              </Popup>
            </Marker>
          ))}
          {userLat && userLng && (
            <>
              <Marker position={[userLat, userLng]} icon={userIcon}>
                <Popup>Your Location</Popup>
              </Marker>
              <FlyToUser lat={userLat} lng={userLng} />
            </>
          )}
        </MapContainer>
      </div>

      <div className="space-y-3">
        {displayStations.map((s, i) => (
          <motion.div key={s.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/50">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block"
                  style={{ background: s.color + "20", color: s.color }}>{s.type}</span>
                <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">📍 {s.address}</p>
                <a href={`tel:${s.phone.replace(/-/g, "")}`}
                  className="flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:underline">
                  <FaPhone className="text-[10px]" />{s.phone}
                </a>
              </div>
              {userLat && userLng && (
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-lg shrink-0">
                  {getDistance(userLat, userLng, s.lat, s.lng).toFixed(1)} km
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
