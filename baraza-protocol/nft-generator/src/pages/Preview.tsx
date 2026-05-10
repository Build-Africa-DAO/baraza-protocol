import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GeneratedNFT, CollectionConfig } from "@/types";
import IPFSUploader from "@/components/IPFSUploader";
import { getRarityColor } from "@/lib/rarity";
import { cn } from "@/lib/utils";

interface PreviewPageProps {
  nfts: GeneratedNFT[];
  config: CollectionConfig;
  onBaseUriSet: (uri: string) => void;
  pushToast: (type: "success" | "error" | "info" | "pending", title: string, msg?: string) => string;
  updateToast: (id: string, type: "success" | "error" | "info" | "pending", title: string, msg?: string) => void;
}

export default function PreviewPage({ nfts, config, onBaseUriSet, pushToast, updateToast }: PreviewPageProps) {
  const [selected, setSelected] = useState<GeneratedNFT | null>(null);
  const [filter, setFilter] = useState<string>("");

  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-cyber-dim border border-cyan-DEFAULT/20 flex items-center justify-center">
          <span className="text-2xl">🎨</span>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-white mb-2">No NFTs Generated Yet</h2>
          <p className="text-sm font-mono text-gray-500">
            Head to the Generate tab, add your trait layers, and generate your collection.
          </p>
        </div>
      </div>
    );
  }

  const filtered = filter
    ? nfts.filter((n) =>
        Object.entries(n.traits).some(
          ([k, v]) =>
            k.toLowerCase().includes(filter.toLowerCase()) ||
            v.name.toLowerCase().includes(filter.toLowerCase()),
        ),
      )
    : nfts;

  return (
    <div className="flex h-full">
      {/* Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by trait…"
            className="flex-1 max-w-xs px-3 py-1.5 rounded-lg bg-surface border border-border/50 text-xs font-mono text-gray-200 placeholder:text-gray-600 outline-none focus:border-cyan-DEFAULT/50 transition-colors"
          />
          <span className="text-xs font-mono text-gray-600">
            {filtered.length} / {nfts.length} NFTs
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {filtered.map((nft) => (
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelected(nft)}
                className={cn(
                  "rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 group",
                  selected?.id === nft.id
                    ? "border-cyan-DEFAULT shadow-cyan-glow"
                    : "border-border/40 hover:border-cyan-DEFAULT/50",
                )}
              >
                <div className="aspect-square bg-surface/80">
                  {nft.imageUrl ? (
                    <img
                      src={nft.imageUrl}
                      alt={`NFT #${nft.id}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-gray-600">
                      #{nft.id}
                    </div>
                  )}
                </div>
                <div className="px-2 py-1.5 bg-panel/80">
                  <span className="text-[10px] font-mono text-gray-400">#{nft.id}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-80 flex-shrink-0 border-l border-border/50 flex flex-col overflow-hidden">
        {/* NFT detail */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="aspect-square rounded-xl overflow-hidden border border-border/40 bg-surface">
                  {selected.imageUrl && (
                    <img src={selected.imageUrl} alt={`NFT #${selected.id}`} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white">
                    {config.name} #{selected.id}
                  </h3>
                  <p className="text-[10px] font-mono text-gray-600 mt-0.5">Hash: {selected.hash}</p>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(selected.traits).map(([layer, trait]) => (
                    <div
                      key={layer}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface/60 border border-border/30"
                    >
                      <span className="text-[10px] font-mono text-gray-500 capitalize">{layer}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-gray-300">{trait.name}</span>
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
                          style={{
                            color: getRarityColor(trait.rarity),
                            borderColor: `${getRarityColor(trait.rarity)}40`,
                            background: `${getRarityColor(trait.rarity)}10`,
                          }}
                        >
                          {trait.rarity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-48 text-center gap-2"
              >
                <span className="text-2xl">👆</span>
                <p className="text-xs font-mono text-gray-600">Click an NFT to inspect its traits</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* IPFS uploader */}
        <div className="border-t border-border/50 p-4">
          <IPFSUploader
            nfts={nfts}
            config={config}
            onBaseUriSet={onBaseUriSet}
            pushToast={pushToast}
            updateToast={updateToast}
          />
        </div>
      </div>
    </div>
  );
}
