export default function Field({ label, value, onChange, placeholder, multiline, type = "text" }) {
  const style = {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
    padding: "12px 14px", color: "#fff", fontSize: 16, outline: "none",
    fontFamily: "inherit", resize: "none", boxSizing: "border-box",
  };

  return (
    <div>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600,
        color: "rgba(255,255,255,0.4)", marginBottom: 6,
        textTransform: "uppercase", letterSpacing: 0.8,
      }}>{label}</label>
      {multiline
        ? <textarea rows={2} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />}
    </div>
  );
}
