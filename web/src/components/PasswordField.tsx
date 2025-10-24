import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function PasswordField({ label = "Password", ...rest }: Props) {
  const [show, setShow] = useState(false);
  return (
    <label className="vstack" style={{ gap: 6, position: "relative" }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <Lock className="icon" size={18} />
      <input className="input" type={show ? "text" : "password"} {...rest} />
      <span className="right-icon" onClick={() => setShow(s => !s)} aria-label="Toggle password visibility" role="button" tabIndex={0}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </span>
    </label>
  );
}
