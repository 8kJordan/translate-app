import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
};

export default function Field2({ label, error, className, ...rest }: Props) {
  return (
    <label className="vstack" style={{ gap: 6 }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <input className={`input no-icon ${className || ""}`} {...rest} />
      {error ? (
        <span style={{ color: "#ff9aa2", fontSize: 12 }}>{error}</span>
      ) : null}
    </label>
  );
}