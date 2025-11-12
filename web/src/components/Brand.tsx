import { Globe2 } from "lucide-react";

export default function Brand() {
  return (
    <div
      className="brand"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "9999px",
          background: "#0097a7",
          boxShadow: "none",
        }}
      >
        <Globe2 size={30} color="white" />
      </span>

      <span
        className="brand-text"
        style={{
          fontSize: "1.8rem",
          lineHeight: 1,
          color: "#eaf0ff",
        }}
      >
        Translify
      </span>
    </div>
  );
}
