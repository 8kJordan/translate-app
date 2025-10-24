import { motion, type HTMLMotionProps } from "framer-motion";

export default function GlassCard(props: HTMLMotionProps<"div">) {
  const { children, ...rest } = props;
  return (
    <motion.div
      {...rest}
      className="glass-card"
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}
