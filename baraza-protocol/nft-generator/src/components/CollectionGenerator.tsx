import { useState, useCallback } from "react";
import { Play, Download, ImageIcon, Layers, Hash, AlertTriangle } from "lucide-react";
import type { TraitLayer, GeneratedNFT, CollectionConfig } from "@/types";
import { generateCollection, countUniqueCombinations } from "@/lib/rarity";
import { renderBatch } from "@/lib/canvas";
import { exportCollectionZip, downloadBlob } from "@/lib/zip";
import { cn } from "@/lib/utils";

interface CollectionGeneratorProps {
  layers: TraitLayer[];
  nfts: GeneratedNFT[];
  setNfts: (n: GeneratedNFT[]) => void;
  config: CollectionConfig;
  setConfig: (c: CollectionConfig) => void;
}

export default function CollectionGenerator({
  layers,
  nfts,
  setNfts,
  config,
  setConfig,
}: CollectionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ phase: "", done: 0, total: 0 });

  const totalTraits = layers.reduce((s, l) => s + l.traits.length, 0);
  const maxCombos = countUniqueCombinations(layers);
  const canGenerate = totalTraits > 0 && config.size >= 1;

  const generate = useCallback(async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setNfts([]);
    setProgress({ phase: "Combining", done: 0, total: config.size });

    // Step 1: generate unique trait combinations
    const combos = generateCollection(layers, config.size, (done, total) =>
      setProgress({ phase: "Combining", done, total }),
    );

    // Step 2: render each to canvas
    setProgress({ phase: "Rendering", done: 0, total: combos.length });
    const rendered = await renderBatch(layers, combos, (done, total) =>
      setProgress({ phase: "Rendering", done, total }),
    );

    setNfts(rendered);
    setIsGenerating(false);
    setProgress({ phase: "", done: 0, total: 0 });
  }, [layers, config.size, canGenerate, setNfts]);

  const exportZip = useCallback(async () => {
    if (!nfts.length) return;
    setIsExporting(true);
    setProgress({ phase: "Zipping", done: 0, total: nfts.length });
    const blob = await exportCollectionZip(nfts, config, (done, total) =>
      setProgress({ phase: "Zipping", done, total }),
    );
    downloadBlob(blob, `${config.name.replace(/\s+/g, "_")}_collection.zip`);
    setIsExporting(false);
    setProgress({ phase: "", done: 0, total: 0 });
  }, [nfts, config]);

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Collection config */}
      <div className="rounded-xl border border-border/50 bg-panel/60 p-5 space-y-4">
        <h3 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
          Collection Settings
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              Collection Name
            </label>
            <input
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="My NFT Collection"
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border/50 text-sm font-mono text-gray-200 placeholder:text-gray-600 outline-none focus:border-cyan-DEFAULT/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              Symbol
            </label>
            <input
              value={config.symbol}
              onChange={(e) => setConfig({ ...config, symbol: e.target.value.toUpperCase() })}
              placeholder="MNFT"
              maxLength={8}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border/50 text-sm font-mono text-gray-200 placeholder:text-gray-600 outline-none focus:border-cyan-DEFAULT/50 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            rows={2}
            placeholder="A generative NFT collection…"
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border/50 text-sm font-mono text-gray-200 placeholder:text-gray-600 outline-none focus:border-cyan-DEFAULT/50 resize-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              Collection Size
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={config.size}
              onChange={(e) => setConfig({ ...config, size: Math.min(10000, Math.max(1, Number(e.target.value))) })}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border/50 text-sm font-mono text-gray-200 outline-none focus:border-cyan-DEFAULT/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              Mint Price (ETH)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={config.mintPrice}
              onChange={(e) => setConfig({ ...config, mintPrice: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border/50 text-sm font-mono text-gray-200 outline-none focus:border-cyan-DEFAULT/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              Max/Wallet
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={config.maxPerWallet}
              onChange={(e) => setConfig({ ...config, maxPerWallet: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border/50 text-sm font-mono text-gray-200 outline-none focus:border-cyan-DEFAULT/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Layers, label: "Layers", value: layers.length },
          { icon: ImageIcon, label: "Total Traits", value: totalTraits },
          {
            icon: Hash,
            label: "Max Combos",
            value: maxCombos > 1e6 ? `${(maxCombos / 1e6).toFixed(1)}M+` : maxCombos.toLocaleString(),
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border/50 bg-panel/60 p-4 text-center">
            <Icon className="w-4 h-4 text-cyan-DEFAULT mx-auto mb-1.5" />
            <div className="text-xl font-display font-bold text-white">{value}</div>
            <div className="text-[10px] font-mono text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {config.size > maxCombos && maxCombos > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl border border-neon-orange/30 bg-neon-orange/8 text-neon-orange">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-mono">
            Collection size ({config.size}) exceeds max unique combinations ({maxCombos.toLocaleString()}).
            Generator will produce as many unique NFTs as possible.
          </p>
        </div>
      )}

      {/* Progress */}
      {(isGenerating || isExporting) && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-gray-500">
            <span>{progress.phase}…</span>
            <span>
              {progress.done} / {progress.total} ({pct}%)
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-cyber transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={generate}
          disabled={!canGenerate || isGenerating}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-mono font-semibold transition-all duration-200",
            canGenerate && !isGenerating
              ? "bg-gradient-cyber text-black shadow-cyan-glow hover:shadow-[0_0_30px_rgba(0,245,255,0.5)]"
              : "bg-surface text-gray-600 cursor-not-allowed border border-border/50",
          )}
        >
          <Play className="w-4 h-4" />
          {isGenerating ? "Generating…" : `Generate ${config.size} NFTs`}
        </button>

        {nfts.length > 0 && (
          <button
            onClick={exportZip}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-mono font-medium border border-border/50 text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Zipping…" : "Export ZIP"}
          </button>
        )}
      </div>

      {/* Results count */}
      {nfts.length > 0 && !isGenerating && (
        <p className="text-center text-xs font-mono text-gray-500">
          ✓ {nfts.length} unique NFTs generated —{" "}
          <span className="text-neon-green">ready to preview & mint</span>
        </p>
      )}
    </div>
  );
}
