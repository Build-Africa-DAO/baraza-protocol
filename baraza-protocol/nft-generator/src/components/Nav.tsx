import { Zap, Wallet, ExternalLink } from "lucide-react";
import type { AppTab } from "@/types";
import { shortAddress } from "@/lib/utils";
import { UNISWAP_DEEPLINK, SEPOLIA_CHAIN_ID, SUPPORTED_CHAINS } from "@/lib/contracts";
import { cn } from "@/lib/utils";

interface NavProps {
  activeTab: AppTab;
  setTab: (t: AppTab) => void;
  address: string | null;
  ethBalance: string;
  nftgBalance: string;
  isGated: boolean;
  chainId: number | null;
  isConnecting: boolean;
  onConnect: () => void;
  onSwitchChain: () => void;
}

const TABS: { id: AppTab; label: string }[] = [
  { id: "generate", label: "Generate" },
  { id: "preview", label: "Preview" },
  { id: "mint", label: "Mint" },
];

export default function Nav({
  activeTab,
  setTab,
  address,
  ethBalance,
  nftgBalance,
  isGated,
  chainId,
  isConnecting,
  onConnect,
  onSwitchChain,
}: NavProps) {
  const wrongChain = address && chainId !== SEPOLIA_CHAIN_ID;
  const chainName = chainId ? SUPPORTED_CHAINS[chainId] ?? `Chain ${chainId}` : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/50 bg-bg/80 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-4 h-full flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-cyber flex items-center justify-center shadow-cyan-glow">
            <Zap className="w-4 h-4 text-black fill-current" />
          </div>
          <span className="font-display text-sm font-bold text-white hidden sm:block">
            NFT<span className="text-cyan-DEFAULT">GEN</span>
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface/60 rounded-xl p-1 border border-border/50">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-gradient-cyber text-black shadow-cyan-glow"
                  : "text-gray-400 hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Network badge */}
          {chainName && (
            <span
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border",
                wrongChain
                  ? "border-red-500/50 bg-red-500/10 text-red-400 cursor-pointer"
                  : "border-neon-green/30 bg-neon-green/10 text-neon-green",
              )}
              onClick={wrongChain ? onSwitchChain : undefined}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", wrongChain ? "bg-red-400" : "bg-neon-green animate-pulse")} />
              {wrongChain ? "Wrong Network" : chainName}
            </span>
          )}

          {/* NFTG balance */}
          {address && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border",
                  isGated
                    ? "border-cyan-DEFAULT/40 bg-cyan-DEFAULT/10 text-cyan-DEFAULT"
                    : "border-purple-DEFAULT/40 bg-purple-DEFAULT/10 text-purple-DEFAULT",
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", isGated ? "bg-cyan-DEFAULT" : "bg-purple-DEFAULT")} />
                {nftgBalance} NFTG
              </div>
              {!isGated && (
                <a
                  href={UNISWAP_DEEPLINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono text-neon-orange border border-neon-orange/30 bg-neon-orange/10 hover:bg-neon-orange/20 transition-colors"
                >
                  Buy NFTG <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Wallet button */}
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-200",
              address
                ? "bg-surface border border-border text-gray-300 hover:border-cyan-DEFAULT/50"
                : "bg-gradient-cyber text-black shadow-cyan-glow hover:shadow-[0_0_30px_rgba(0,245,255,0.5)]",
            )}
          >
            <Wallet className="w-3.5 h-3.5" />
            {isConnecting ? "Connecting…" : address ? shortAddress(address) : "Connect Wallet"}
          </button>

          {/* ETH balance */}
          {address && (
            <span className="hidden md:block text-xs font-mono text-gray-500">
              {ethBalance} ETH
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
