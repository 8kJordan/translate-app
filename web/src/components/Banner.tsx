import { X } from "lucide-react";
import { useState } from "react";

export default function Banner({ message }: { message: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="banner row-space">
      <span>{message}</span>
      <button onClick={() => setOpen(false)} className="btn" style={{background:"transparent", boxShadow:"none", padding:6}} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
