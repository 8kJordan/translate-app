import { motion } from "framer-motion";
import { Globe2 } from "lucide-react";

export default function Brand() {
    return (
        <motion.div
            className="brand"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
            <motion.span
                initial={{ rotate: -8, scale: 0.95 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 12 }}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 30,
                    borderRadius: "9999px",
                    background: "#0097a7",      
                    boxShadow: "none"          
                }}
            >
                <Globe2 size={16} color="white" />
            </motion.span>
            <span style={{ fontWeight: 800, letterSpacing: ".3px" }}>Translify</span>
        </motion.div>
    );
}
