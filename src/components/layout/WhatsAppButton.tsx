import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_NUMBER = "+256779999999";

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}?text=Hello%2C%20I%20need%20help%20with%20ReportCrime%20Uganda`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 z-40 md:bottom-6 w-14 h-14 rounded-full bg-[hsl(142,70%,45%)] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      aria-label="Contact us on WhatsApp"
    >
      <FaWhatsapp className="text-2xl" />
    </a>
  );
}
