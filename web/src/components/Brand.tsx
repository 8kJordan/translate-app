import { motion } from "framer-motion";
import { Globe2 } from "lucide-react";

export default function Brand() {
    return (
        <motion.div
            className="brand"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
            }}
        >
            <motion.span
                initial={{ rotate: -8, scale: 0.95 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 12 }}
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
            </motion.span>

            {/* Use HUD display font with optional glow */}
            <span
                className="brand-text glow"
                style={{
                    fontSize: "2rem",
                    lineHeight: 1,
                    color: "#eaf0ff",
                    opacity: 1,
                    mixBlendMode: "normal"
                }}
            >
                Translify
            </span>
        </motion.div>
    );
}

