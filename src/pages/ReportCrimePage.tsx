import { useState, useRef } from "react";
import {
  FaGavel, FaMapMarkerAlt, FaCalendarAlt, FaCamera,
  FaFileAlt, FaExclamationTriangle, FaCrosshairs,
  FaMicrophone, FaStop, FaPlay, FaTrash,
} from "react-icons/fa";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

const CRIME_TYPES = [
  "Theft / Robbery", "Assault", "Fraud / Cybercrime", "Domestic Violence",
  "Drug Crime", "Traffic Accident", "Land Dispute", "Corruption / Bribery",
  "Missing Person", "Other",
];

export function ReportCrimePage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [crimeType, setCrimeType] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        setLatitude(lat);
        setLongitude(lon);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          setLocation(data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          toast({ title: t("location") + " detected", description: data.display_name || "" });
        } catch {
          setLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
        setDetecting(false);
      },
      () => {
        toast({ title: "Error", description: "Failed to detect location", variant: "destructive" });
        setDetecting(false);
      }
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: t("voiceRecording"), description: "Recording started..." });
    } catch {
      toast({ title: "Error", description: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };
  const removeRecording = () => { setAudioBlob(null); setAudioUrl(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crimeType || !description) {
      toast({ title: "Missing fields", description: "Please fill in crime type and description", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Not signed in", description: "Please sign in to submit a report", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("crime_reports").insert({
        user_id: user.id,
        crime_type: crimeType,
        description,
        location,
        latitude,
        longitude,
        date_time: date ? new Date(date).toISOString() : null,
        audio_url: null,
        reference_number: "TEMP",
      });
      if (error) throw error;
      toast({ title: t("reportSubmitted"), description: "Your crime report has been submitted." });
      setCrimeType(""); setLocation(""); setDate(""); setDescription("");
      setAudioBlob(null); setAudioUrl(null); setLatitude(null); setLongitude(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-foreground mb-1">{t("reportCrime")}</h1>
        <p className="text-sm text-muted-foreground mb-6">Submit a crime or complaint report to Uganda Police Force.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">{t("crimeType")} *</label>
            <select value={crimeType} onChange={(e) => setCrimeType(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-primary/20 bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all mt-1">
              <option value="">Select crime type...</option>
              {CRIME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">{t("location")}</label>
            <div className="flex gap-2 mt-1">
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Where did this happen?"
                className="flex-1 p-3 rounded-xl border-2 border-primary/20 bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all" />
              <button type="button" onClick={handleDetectLocation} disabled={detecting}
                className="px-4 py-3 rounded-xl text-primary-foreground text-sm font-medium shrink-0 disabled:opacity-50"
                style={{ background: "var(--gradient-primary)" }}>
                <FaCrosshairs className="inline mr-1" />{detecting ? "..." : t("detect")}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Date & Time</label>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-primary/20 bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">{t("description")} *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened in detail..."
              rows={4}
              className="w-full p-3 rounded-xl border-2 border-primary/20 bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all resize-vertical mt-1" />
          </div>

          {/* Voice Recording */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("voiceRecording")}</label>
            <div className="flex gap-2">
              {!isRecording ? (
                <button type="button" onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-all">
                  <FaMicrophone /> {t("startRecording")}
                </button>
              ) : (
                <button type="button" onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium animate-pulse">
                  <FaStop /> {t("stopRecording")}
                </button>
              )}
            </div>
            {audioUrl && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-muted">
                <audio controls src={audioUrl} className="flex-1 h-8" />
                <button type="button" onClick={removeRecording} className="text-destructive hover:text-destructive/80 p-1">
                  <FaTrash />
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-2xl font-bold text-primary-foreground disabled:opacity-50 shadow-lg"
            style={{ background: "var(--gradient-primary)" }}>
            {submitting ? t("submitting") : t("submitReport")}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
