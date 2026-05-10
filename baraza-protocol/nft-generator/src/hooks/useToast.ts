import { useState, useCallback } from "react";
import type { Toast, ToastType } from "@/types";
import { generateId } from "@/lib/utils";

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((type: ToastType, title: string, message?: string, txHash?: string) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, type, title, message, txHash }]);
    if (type !== "pending") {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
    }
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const update = useCallback((id: string, type: ToastType, title: string, message?: string, txHash?: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, type, title, message, txHash } : t)),
    );
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  }, []);

  return { toasts, push, dismiss, update };
}
