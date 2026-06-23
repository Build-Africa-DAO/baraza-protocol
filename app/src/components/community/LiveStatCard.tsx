import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp } from 'lucide-react';

interface LiveStatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  format?: (v: number) => string;
  color: string;
  bg: string;
  showDelta?: boolean;
}

/**
 * Animated stat card that smoothly counts up when the value changes
 * and shows a green delta indicator for recent increases.
 */
const LiveStatCard: React.FC<LiveStatCardProps> = ({
  icon: Icon,
  label,
  value,
  format,
  color,
  bg,
  showDelta = true,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [delta, setDelta] = useState(0);
  const [showDeltaBadge, setShowDeltaBadge] = useState(false);
  const prevValueRef = useRef(value);
  const animFrameRef = useRef<number>();
  const deltaTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const prev = prevValueRef.current;
    const diff = value - prev;
    prevValueRef.current = value;

    if (diff === 0) return;

    // Show delta badge
    if (showDelta && diff > 0) {
      setDelta(diff);
      setShowDeltaBadge(true);
      if (deltaTimerRef.current) clearTimeout(deltaTimerRef.current);
      deltaTimerRef.current = setTimeout(() => setShowDeltaBadge(false), 3000);
    }

    // Animate count
    const startVal = displayValue;
    const startTime = performance.now();
    const duration = 600;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (value - startVal) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatted = format ? format(displayValue) : displayValue.toLocaleString('en-KE');

  return (
    <div className="baraza-card p-4 relative overflow-hidden group">
      {/* Subtle pulse on update */}
      <motion.div
        key={value}
        initial={{ opacity: 0.3, scale: 1 }}
        animate={{ opacity: 0, scale: 2 }}
        transition={{ duration: 1.2 }}
        className={`absolute inset-0 rounded-lg ${bg}`}
        style={{ pointerEvents: 'none' }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            {showDeltaBadge && delta > 0 && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full"
              >
                <TrendingUp className="w-2.5 h-2.5" />
                +{format ? format(delta) : delta.toLocaleString('en-KE')}
              </motion.span>
            )}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          </div>
        </div>

        <p className="font-display text-lg font-bold text-foreground tabular-nums">{formatted}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

export default LiveStatCard;
