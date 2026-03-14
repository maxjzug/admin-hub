import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaShieldAlt } from "react-icons/fa";

export function SplashPage() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      navigate("/home");
    }, 3500);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--gradient-primary)" }}>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center gap-6 text-center px-6"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center"
        >
          <FaShieldAlt className="text-white text-4xl" />
        </motion.div>

        <div>
          <h1 className="text-3xl font-bold text-white">ReportCrime</h1>
          <p className="text-white/80 text-lg mt-1">Uganda</p>
        </div>

        <p className="text-white/60 text-sm max-w-xs">
          Your safety companion. Report crimes, find help, know your rights.
        </p>

        {/* Progress bar */}
        <div className="w-48 h-1.5 rounded-full bg-white/20 overflow-hidden mt-4">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "linear" }}
          />
        </div>
      </motion.div>

      {/* Animated dots */}
      <div className="absolute bottom-16 flex gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-white/40"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
