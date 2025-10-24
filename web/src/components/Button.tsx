import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type MotionButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  loading?: boolean;
  children?: ReactNode; // force ReactNode, not MotionValue*
};

export default function Button({
  loading = false,
  children,
  className,
  disabled,
  ...rest
}: MotionButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      className={`btn btn-gradient ${className ?? ""}`}
      disabled={loading || !!disabled}
      {...rest}
    >
      {loading && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          focusable="false"
          style={{ marginRight: 6 }}
        >
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.3" />
          <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="currentColor">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      )}
      {loading ? "Signing in…" : children}
    </motion.button>
  );
}
