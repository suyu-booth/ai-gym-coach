import { useState } from "react";

export default function QuickSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, display: "block" }}>{label}</label>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "10px", borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
        color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left",
      }}>
        {value}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
          background: "#1F2937", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)", marginTop: 4, overflow: "hidden",
        }}>
          {options.map(o => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }} style={{
              width: "100%", padding: "10px 12px",
              background: value === o ? "rgba(59,130,246,0.15)" : "transparent",
              border: "none", borderTop: "1px solid rgba(255,255,255,0.04)",
              color: "#fff", fontSize: 13, cursor: "pointer", textAlign: "left",
            }}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}
