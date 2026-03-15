import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all mb-4"
      aria-label="Go back"
    >
      <FaArrowLeft className="text-sm" />
    </button>
  );
}
