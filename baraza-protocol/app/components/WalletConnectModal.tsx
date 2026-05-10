"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ open, onClose }: Props) {
  const { wallets, select } = useWallet();

  const seen = new Set<string>();
  const unique = wallets.filter((w) => {
    if (seen.has(w.adapter.name)) return false;
    seen.add(w.adapter.name);
    return true;
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(7,11,18,0.85)", backdropFilter: "blur(4px)" }}
      />
      <div style={{
        position: "relative",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        width: "min(400px, 92vw)",
        maxHeight: "min(480px, 85vh)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "15px" }}>Connect Wallet</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: 1,
              padding: "2px 8px",
              borderRadius: "6px",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "12px" }}>
          {unique.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "24px 0" }}>
              No wallets found. Install Phantom or Solflare to continue.
            </p>
          )}
          {unique.map((wallet) => {
            const detected = wallet.readyState === WalletReadyState.Installed;
            return (
              <button
                key={wallet.adapter.name}
                onClick={() => { select(wallet.adapter.name); onClose(); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  background: "none",
                  border: "1px solid transparent",
                  borderRadius: "10px",
                  cursor: "pointer",
                  marginBottom: "4px",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--card-alt)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                {wallet.adapter.icon && (
                  <img
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    width={32}
                    height={32}
                    style={{ borderRadius: "8px", flexShrink: 0 }}
                  />
                )}
                <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 500, flex: 1, textAlign: "left" }}>
                  {wallet.adapter.name}
                </span>
                {detected && (
                  <span style={{
                    background: "rgba(20,241,149,0.12)",
                    color: "var(--green)",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    border: "1px solid rgba(20,241,149,0.25)",
                    flexShrink: 0,
                  }}>
                    Detected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
