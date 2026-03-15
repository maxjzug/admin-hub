import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/LanguageContext";

export function AuthPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/main",
      });
      if (result.error) {
        toast({ title: "Error", description: String(result.error), variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to sign in with Google", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + "/main" },
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent a confirmation link." });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        navigate("/main");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--gradient-primary)" }}>

      <motion.div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-white/5 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-white/5 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity }} />

      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm space-y-6">

        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <FaShieldAlt className="text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">ReportCrime Uganda</h1>
          <p className="text-white/60 text-sm">{isSignUp ? t("createAccount") : t("welcomeBack")}</p>
        </div>

        <button onClick={handleGoogleSignIn} disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-white text-gray-800 font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50">
          <FcGoogle className="text-xl" />{t("continueWithGoogle")}
        </button>

        <div className="text-center text-white/30 text-xs">OR</div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email")}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password")}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-white disabled:opacity-50 shadow-lg"
            style={{ background: "var(--gradient-primary)" }}>
            {loading ? "..." : isSignUp ? t("createAccount") : t("signIn")}
          </button>
        </form>

        <p className="text-white/50 text-xs text-center">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-white font-medium hover:underline">
            {isSignUp ? t("signIn") : t("createAccount")}
          </button>
        </p>

        <button onClick={() => navigate("/home")} className="text-white/40 text-xs w-full text-center hover:text-white/50 transition-colors flex items-center justify-center gap-1">
          <FaArrowLeft className="text-[10px]" /> Back to home
        </button>
      </motion.div>
    </div>
  );
}
