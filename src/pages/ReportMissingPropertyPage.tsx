import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBox } from "react-icons/fa";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

export function ReportMissingPropertyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const [itemName, setItemName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !description) {
      toast({ title: "Missing fields", description: "Please fill in item name and description", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Not signed in", description: "Please sign in first", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("missing_property").insert({
      user_id: user.id,
      item_name: itemName,
      description,
      location: location || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("reportSubmitted"), description: "Missing property report filed." });
      navigate("/lost-and-found");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-foreground mb-1">{t("reportMissingProperty")}</h1>
        <p className="text-sm text-muted-foreground mb-6">Report lost or stolen property.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Item Name *</label>
            <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="What was lost or stolen?"
              className="w-full p-3 rounded-xl border-2 border-primary/20 bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">{t("location")}</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where did you lose it?"
              className="w-full p-3 rounded-xl border-2 border-primary/20 bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the item..."
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
