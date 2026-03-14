import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaShieldAlt, FaArrowRight, FaGavel, FaHandsHelping } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/contexts/AuthContext";
import { backendAuth } from "@/config/backendAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/LanguageContext";

export function HomePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLang();
  const [authTab, setAuthTab] = useState<"explore" | "signin" | "google">("explore");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      const result = await backendAuth.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/main",
      });
      if (result.error) {
        toast({ title: "Error", description: String(result.error), variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to sign in with Google", variant: "destructive" });
    }
    setAuthLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
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
    setAuthLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--gradient-primary)" }}>

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md flex flex-col items-center gap-6"
      >
        {/* Hero */}
        <div className="flex items-center gap-2 text-white">
          <FaShieldAlt className="text-3xl" />
          <h1 className="text-2xl font-bold">ReportCrime Uganda</h1>
        </div>
        <p className="text-white/70 text-sm text-center">
          Your safety companion. Report crimes, find help, know your rights.
        </p>

        {/* Quick feature pills */}
        <div className="flex gap-2">
          {[
            { icon: FaGavel, label: "Report" },
            { icon: FaHandsHelping, label: "Get Help" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs">
                <Icon className="text-xs" />
                {item.label}
              </div>
            );
          })}
        </div>

        {/* Card wrapper */}
        <div className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-6 space-y-4">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1">
            <button onClick={() => setAuthTab("explore")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                authTab === "explore" ? "bg-white/20 text-white shadow" : "text-white/70 hover:text-white/90"
              }`}>Explore</button>
            <button onClick={() => setAuthTab("signin")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                authTab === "signin" ? "bg-white/20 text-white shadow" : "text-white/70 hover:text-white/90"
              }`}>Sign In</button>
            <button onClick={() => setAuthTab("google")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                authTab === "google" ? "bg-white/20 text-white shadow" : "text-white/70 hover:text-white/90"
              }`}>
              <FcGoogle className="text-sm" />Google
            </button>
          </div>

          <AnimatePresence mode="wait">
            {authTab === "google" ? (
              <motion.div key="google" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <p className="text-white/60 text-sm text-center">Sign in with your Google account</p>
                <button onClick={handleGoogleSignIn} disabled={authLoading}
                  className="w-full py-3.5 rounded-2xl bg-white text-gray-800 font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50">
                  <FcGoogle className="text-xl" />{t("continueWithGoogle")}
                </button>
                <button onClick={() => setAuthTab("signin")} className="text-primary text-sm underline w-full text-center">
                  Use email instead
                </button>
              </motion.div>
            ) : authTab === "explore" ? (
              <motion.div key="explore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <motion.button
                  onClick={() => navigate("/main")}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: "linear-gradient(135deg, hsl(234 85% 58%) 0%, hsl(270 65% 52%) 100%)", boxShadow: "0 8px 32px hsl(234 85% 50% / 0.35)" }}
                >
                  Get Started <FaArrowRight />
                </motion.button>
                <p className="text-white/50 text-xs text-center">
                  Browse anonymously or{" "}
                  <button onClick={() => setAuthTab("signin")} className="text-primary underline">sign in</button>
                  {" / "}
                  <button onClick={() => setAuthTab("google")} className="text-primary underline">Google</button>
                  {" "}to save your reports.
                </p>
              </motion.div>
            ) : (
              <motion.form key="signin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleEmailAuth} className="space-y-3">
                <button type="button" onClick={handleGoogleSignIn} disabled={authLoading}
                  className="w-full py-3 rounded-2xl bg-white text-gray-800 font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50 text-sm">
                  <FcGoogle className="text-lg" />{t("continueWithGoogle")}
                </button>
                <div className="text-center text-white/30 text-xs">OR</div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("email")}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/50" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("password")}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/50" />
                <button type="submit" disabled={authLoading}
                  className="w-full py-3.5 rounded-2xl font-bold text-white disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}>
                  {authLoading ? "..." : isSignUp ? t("createAccount") : t("signIn")}
                </button>
                <p className="text-white/50 text-xs text-center">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary underline">
                    {isSignUp ? t("signIn") : t("createAccount")}
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {user && (
          <p className="text-white/50 text-xs">Signed in as {user.email}</p>
        )}
      </motion.div>
    </div>
  );
}
