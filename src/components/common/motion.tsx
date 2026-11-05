import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps, type Variants } from 'framer-motion';
import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};
const reducedReveal: Variants = { hidden: { opacity: 1 }, visible: { opacity: 1, transition: { duration: 0 } } };
const staggerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export function Reveal({ children, ...props }: PropsWithChildren<HTMLMotionProps<'div'>>) {
  const reduced = useReducedMotion();
  return <motion.div variants={reduced ? reducedReveal : revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} {...props}>{children}</motion.div>;
}
export function Stagger({ children, ...props }: PropsWithChildren<HTMLMotionProps<'div'>>) {
  const reduced = useReducedMotion();
  return <motion.div variants={reduced ? reducedReveal : staggerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} {...props}>{children}</motion.div>;
}
export function StaggerItem({ children, ...props }: PropsWithChildren<HTMLMotionProps<'div'>>) {
  const reduced = useReducedMotion();
  return <motion.div variants={reduced ? reducedReveal : revealVariants} {...props}>{children}</motion.div>;
}
export function PageTransition({ children, ...props }: PropsWithChildren<HTMLMotionProps<'main'>>) {
  const reduced = useReducedMotion();
  return <motion.main initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0 }} transition={{ duration: reduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }} {...props}>{children}</motion.main>;
}
export function RouteTransition({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  return <AnimatePresence mode="wait" initial={false}>
    <motion.div key={pathname} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -4 }} transition={{ duration: reduced ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  </AnimatePresence>;
}
export function MicroInteraction({ children, ...props }: PropsWithChildren<HTMLMotionProps<'div'>>) {
  const reduced = useReducedMotion();
  return <motion.div whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { scale: 0.98 }} transition={{ duration: 0.2 }} {...props}>{children}</motion.div>;
}


