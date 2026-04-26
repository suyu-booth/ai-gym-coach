import { palette, type } from "../lib/theme.js";

export default function Field({ label, value, onChange, placeholder, multiline, type: inputType = "text" }) {
  const props = {
    value,
    onChange: e => onChange(e.target.value),
    placeholder,
    className: "gh-input",
    style: {
      fontSize: 18, padding: "10px 0",
      ...(inputType === "number" ? { fontVariantNumeric: "lining-nums tabular-nums" } : {}),
    },
  };

  return (
    <div>
      <label style={{ ...type.caps, color: palette.creamMute, display: "block", marginBottom: 4 }}>{label}</label>
      {multiline
        ? <textarea rows={2} {...props} style={{ ...props.style, resize: "none" }} />
        : <input type={inputType} {...props} />}
    </div>
  );
}
