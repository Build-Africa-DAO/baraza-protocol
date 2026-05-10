import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, Loader2, X, ExternalLink } from "lucide-react";
import type { Toast as ToastItem, ToastType } from "@/types";
import { cn } from "@/lib/utils";

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  pending: Loader2,
};

const colors: Record<ToastType, string> = {
  success: "border-neon-green/40 bg-neon-green/10 text-neon-green",
  error: "border-red-500/40 bg-red-500/10 text-red-400",
  info: "border-cyan-DEFAULT/40 bg-cyan-DEFAULT/10 text-cyan-DEFAULT",
  pending: "border-purple-DEFAULT/40 bg-purple-DEFAULT/10 text-purple-DEFAULT",
};

interface ToastContainerProps {
  toasts: ToastItem[];
  dismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl",
                "bg-surface/80",
                colors[t.type],
              )}
            >
              <Icon
                className={cn("w-4 h-4 mt-0.5 flex-shrink-0", t.type === "pending" && "animate-spin")}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium">{t.title}</p>
                {t.message && <p className="text-xs text-gray-400 mt-0.5 break-words">{t.message}</p>}
                {t.txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${t.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-cyan-DEFAULT mt-1 hover:underline"
                  >
                    View on Etherscan <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-gray-500 hover:text-gray-300 flex-shrink-0 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
