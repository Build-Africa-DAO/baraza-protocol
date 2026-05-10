import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { Wallet, Zap, Shield, ChevronUp, ChevronDown, ExternalLink, AlertCircle } from "lucide-react";
import type { GeneratedNFT, CollectionConfig } from "@/types";
import {
  getNFTCollectionContract,
  NFT_COLLECTION_ADDRESS_SEPOLIA,
  NFTG_ADDRESS_SEPOLIA,
  UNISWAP_DEEPLINK,
  SEPOLIA_CHAIN_ID,
} from "@/lib/contracts";
import { cn } from "@/lib/utils";

interface MintingUIProps {
  address: string | null;
  ethBalance: string;
  nftgBalance: string;
  isGated: boolean;
  chainId: number | null;
  nfts: GeneratedNFT[];
  config: CollectionConfig;
  ipfsBaseUri: string;
  getSigner: () => Promise<ethers.Signer>;
  onConnect: () => void;
  onSwitchChain: () => void;
  pushToast: (type: "success" | "error" | "info" | "pending", title: string, message?: string, txHash?: string) => string;
  updateToast: (id: string, type: "success" | "error" | "info" | "pending", title: string, message?: string, txHash?: string) => void;
}

export default function MintingUI({
  address,
  ethBalance,
  nftgBalance,
  isGated,
  chainId,
  nfts,
  config,
  ipfsBaseUri,
  getSigner,
  onConnect,
  onSwitchChain,
  pushToast,
  updateToast,
}: MintingUIProps) {
  const [quantity, setQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [mintedIds, setMintedIds] = useState<number[]>([]);

  const mintPrice = parseFloat(config.mintPrice) || 0.01;
  const totalCost = (mintPrice * quantity).toFixed(4);
  const wrongChain = address && chainId !== SEPOLIA_CHAIN_ID;
  const contractDeployed = Boolean(NFT_COLLECTION_ADDRESS_SEPOLIA);

  const increment = () => setQuantity((q) => Math.min(config.maxPerWallet, q + 1));
  const decrement = () => setQuantity((q) => Math.max(1, q - 1));

  const mint = useCallback(async () => {
    if (!address || !isGated || !contractDeployed) return;
    setIsMinting(true);
    const toastId = pushToast("pending", "Minting…", `Minting ${quantity} NFT${quantity > 1 ? "s" : ""}`);
    try {
      const signer = await getSigner();
      const contract = getNFTCollectionContract(signer, NFT_COLLECTION_ADDRESS_SEPOLIA);
      const value = ethers.parseEther((mintPrice * quantity).toFixed(18));
      const tx = await contract.mint(quantity, { value });
      updateToast(toastId, "pending", "Transaction sent", "Waiting for confirmation…", tx.hash);
      const receipt = await tx.wait();
      const ids = Array.from({ length: quantity }, (_, i) => (mintedIds.length || 0) + i + 1);
      setMintedIds((prev) => [...prev, ...ids]);
      updateToast(toastId, "success", `Minted ${quantity} NFT${quantity > 1 ? "s" : ""}!`, undefined, receipt.hash);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      updateToast(toastId, "error", "Mint failed", msg.slice(0, 100));
    } finally {
      setIsMinting(false);
    }
  }, [address, isGated, contractDeployed, quantity, mintPrice, getSigner, pushToast, updateToast, mintedIds.length]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatusCard
          label="Wallet"
          value={address ? `${ethBalance} ETH` : "Not Connected"}
          icon={<Wallet className="w-4 h-4" />}
          active={Boolean(address)}
        />
        <StatusCard
          label="NFTG Balance"
          value={`${nftgBalance} NFTG`}
          icon={<Zap className="w-4 h-4" />}
          active={isGated}
          highlight={isGated ? "cyan" : "purple"}
        />
        <StatusCard
          label="Gate Status"
          value={isGated ? "Unlocked" : "Locked (Need 100)"}
          icon={<Shield className="w-4 h-4" />}
          active={isGated}
          highlight={isGated ? "green" : "orange"}
        />
      </div>

      {/* Collection info */}
      {nfts.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-panel/60 p-5 space-y-3">
          <h3 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
            Collection Ready
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-gray-600">Name:</span>{" "}
              <span className="text-gray-200">{config.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Symbol:</span>{" "}
              <span className="text-gray-200">{config.symbol}</span>
            </div>
            <div>
              <span className="text-gray-600">Supply:</span>{" "}
              <span className="text-cyan-DEFAULT">{nfts.length} NFTs</span>
            </div>
            <div>
              <span className="text-gray-600">Mint Price:</span>{" "}
              <span className="text-gray-200">{config.mintPrice} ETH</span>
            </div>
            {ipfsBaseUri && (
              <div className="col-span-2">
                <span className="text-gray-600">Base URI:</span>{" "}
                <span className="text-purple-DEFAULT break-all">{ipfsBaseUri}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notices */}
      {!address && (
        <Notice icon={<AlertCircle className="w-4 h-4" />} color="purple">
          Connect your wallet to start minting.
        </Notice>
      )}
      {wrongChain && (
        <Notice icon={<AlertCircle className="w-4 h-4" />} color="orange">
          Wrong network detected.{" "}
          <button onClick={onSwitchChain} className="underline hover:text-white">
            Switch to Sepolia
          </button>
        </Notice>
      )}
      {address && !isGated && (
        <Notice icon={<Zap className="w-4 h-4" />} color="purple">
          You need ≥ 100 NFTG tokens to mint.{" "}
          <a href={UNISWAP_DEEPLINK} target="_blank" rel="noopener noreferrer" className="underline hover:text-white inline-flex items-center gap-0.5">
            Buy NFTG <ExternalLink className="w-3 h-3" />
          </a>
        </Notice>
      )}
      {!contractDeployed && (
        <Notice icon={<AlertCircle className="w-4 h-4" />} color="orange">
          Contract not yet deployed. Set{" "}
          <code className="px-1 bg-surface rounded text-[10px]">VITE_NFT_COLLECTION_ADDRESS</code> in{" "}
          <code className="px-1 bg-surface rounded text-[10px]">.env</code> after deploying.
        </Notice>
      )}
      {nfts.length === 0 && (
        <Notice icon={<AlertCircle className="w-4 h-4" />} color="cyan">
          Generate your collection first in the Generate tab.
        </Notice>
      )}

      {/* Mint box */}
      <div className="rounded-xl border border-border/50 bg-panel/60 p-5 space-y-4">
        <h3 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
          Mint
        </h3>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-border/50">
            <button
              onClick={decrement}
              className="px-4 py-2.5 bg-surface hover:bg-panel text-gray-300 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="px-6 py-2.5 bg-bg font-display font-bold text-xl text-white w-20 text-center">
              {quantity}
            </span>
            <button
              onClick={increment}
              className="px-4 py-2.5 bg-surface hover:bg-panel text-gray-300 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 space-y-0.5">
            <div className="text-xs font-mono text-gray-500">Total cost</div>
            <div className="font-display text-2xl font-bold text-white">
              {totalCost}{" "}
              <span className="text-base text-gray-500">ETH</span>
            </div>
          </div>
        </div>

        {!address ? (
          <button
            onClick={onConnect}
            className="w-full py-3.5 rounded-xl bg-gradient-cyber text-black font-mono font-bold text-sm shadow-cyan-glow hover:shadow-[0_0_30px_rgba(0,245,255,0.5)] transition-all"
          >
            Connect Wallet
          </button>
        ) : (
          <button
            onClick={mint}
            disabled={!isGated || isMinting || !contractDeployed || nfts.length === 0 || Boolean(wrongChain)}
            className={cn(
              "w-full py-3.5 rounded-xl font-mono font-bold text-sm transition-all duration-200",
              isGated && !isMinting && contractDeployed && nfts.length > 0 && !wrongChain
                ? "bg-gradient-cyber text-black shadow-cyan-glow hover:shadow-[0_0_30px_rgba(0,245,255,0.5)]"
                : "bg-surface text-gray-600 cursor-not-allowed border border-border/50",
            )}
          >
            {isMinting
              ? "Minting…"
              : !isGated
              ? "Need 100 NFTG to Mint"
              : !contractDeployed
              ? "Contract Not Deployed"
              : `Mint ${quantity} NFT${quantity > 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      {/* Minted NFTs */}
      {mintedIds.length > 0 && (
        <div className="rounded-xl border border-neon-green/30 bg-neon-green/5 p-5 space-y-3">
          <h3 className="text-xs font-mono font-semibold text-neon-green uppercase tracking-wider">
            ✓ Minted ({mintedIds.length} NFTs)
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {mintedIds.map((id) => {
              const nft = nfts.find((n) => n.id === id);
              return (
                <div
                  key={id}
                  className="aspect-square rounded-lg overflow-hidden border border-neon-green/20 bg-surface"
                >
                  {nft?.imageUrl ? (
                    <img src={nft.imageUrl} alt={`NFT #${id}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-mono text-gray-600">
                      #{id}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  label,
  value,
  icon,
  active,
  highlight = "cyan",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  active: boolean;
  highlight?: "cyan" | "purple" | "green" | "orange";
}) {
  const colors: Record<string, string> = {
    cyan: "text-cyan-DEFAULT",
    purple: "text-purple-DEFAULT",
    green: "text-neon-green",
    orange: "text-neon-orange",
  };
  return (
    <div className="rounded-xl border border-border/50 bg-panel/60 p-4">
      <div className={cn("mb-2", active ? colors[highlight] : "text-gray-600")}>{icon}</div>
      <div className={cn("text-sm font-mono font-semibold truncate", active ? "text-gray-200" : "text-gray-600")}>
        {value}
      </div>
      <div className="text-[10px] font-mono text-gray-600 mt-0.5">{label}</div>
    </div>
  );
}

function Notice({
  children,
  icon,
  color = "cyan",
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  color?: "cyan" | "purple" | "orange";
}) {
  const styles: Record<string, string> = {
    cyan: "border-cyan-DEFAULT/30 bg-cyan-DEFAULT/8 text-cyan-dim",
    purple: "border-purple-DEFAULT/30 bg-purple-DEFAULT/8 text-purple-dim",
    orange: "border-neon-orange/30 bg-neon-orange/8 text-neon-orange",
  };
  return (
    <div className={cn("flex items-start gap-2 p-3 rounded-xl border text-xs font-mono", styles[color])}>
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <span>{children}</span>
    </div>
  );
}
