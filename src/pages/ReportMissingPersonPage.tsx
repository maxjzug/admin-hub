import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserPlus } from "react-icons/fa";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { BackButton } from "@/components/layout/BackButton";

export function ReportMissingPersonPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [lastSeen, setLastSeen] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      toast({ title: "Missing fields", description: "Please fill in name and description", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Not signed in", description: "Please sign in first", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("missing_persons").insert({
      user_id: user.id,
      full_name: name,
      age: age ? parseInt(age) : null,
      last_seen_location: lastSeen || null,
      description,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("reportSubmitted"), description: "Missing person report filed." });
      navigate("/missing-persons");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <BackButton />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-foreground mb-1">{t("reportMissingPerson")}</h1>
        <p className="text-sm text-muted-foreground mb-6">File a missing person report.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Full Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              className="w-full p-3 rounded-xl border-2 border-primary/20 bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age"
              className="w-full p-3 rounded-xl border-2 border-primary/20 bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Last Seen Location</label>
            <input type="text" value={lastSeen} onChange={(e) => setLastSeen(e.target.value)} placeholder="Where was the person last seen?"
              className="w-full p-3 rounded-xl border-2 border-primary/20 bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the person..."
              rows={4}
              className="w-full p-3 rounded-xl border-2 border-primary/20 bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all resize-vertical mt-1" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-2xl font-bold text-primary-foreground disabled:opacity-50"
            style={{ background: "var(--gradient-primary)" }}>
            {submitting ? t("submitting") : t("submitReport")}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
