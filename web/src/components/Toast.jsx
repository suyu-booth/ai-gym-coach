import { useEffect } from "react";

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = { success: "#22C55E", error: "#EF4444", info: "#3B82F6" };

  return (
    <div style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      zIndex: 1000, background: colors[type] || colors.info, color: "#fff",
      padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animation: "slideDown 0.3s ease",
    }}>
      {message}
    </div>
  );
}
