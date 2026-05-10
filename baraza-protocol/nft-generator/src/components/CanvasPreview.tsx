import { useEffect, useRef, useState } from "react";
import { Download, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import type { TraitLayer, SelectedTraits } from "@/types";
import { compositeTraits, buildCheckerboard, canvasToBlob } from "@/lib/canvas";
import { generateCombination } from "@/lib/rarity";
import { downloadBlob } from "@/lib/zip";
import { cn } from "@/lib/utils";

interface CanvasPreviewProps {
  layers: TraitLayer[];
  selected: SelectedTraits;
  setSelected: (s: SelectedTraits) => void;
  refreshKey: number;
}

export default function CanvasPreview({ layers, selected, setSelected, refreshKey }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isRendering, setIsRendering] = useState(false);

  const render = async (sel: SelectedTraits) => {
    if (!canvasRef.current) return;
    setIsRendering(true);
    const hasTraits = Object.values(sel).some((t) => t?.url);
    if (!hasTraits) {
      buildCheckerboard(canvasRef.current);
    } else {
      await compositeTraits(canvasRef.current, layers, sel);
    }
    setIsRendering(false);
  };

  useEffect(() => {
    render(selected);
  }, [selected, refreshKey]);

  const randomize = () => {
    const combo = generateCombination(layers);
    setSelected(combo);
  };

  const download = async () => {
    if (!canvasRef.current) return;
    const blob = await canvasToBlob(canvasRef.current);
    downloadBlob(blob, "preview.png");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
          Preview Canvas
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
            className="p-1.5 rounded-lg hover:bg-surface text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-gray-500 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
            className="p-1.5 rounded-lg hover:bg-surface text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-bg/40">
        <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
          <canvas
            ref={canvasRef}
            className={cn(
              "rounded-xl shadow-[0_0_40px_rgba(0,245,255,0.08)] border border-border/30 max-w-full",
              isRendering && "opacity-70",
            )}
            style={{ imageRendering: "pixelated", width: 400, height: 400 }}
          />
          {isRendering && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-cyan-DEFAULT border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Trait chips */}
      <div className="px-4 py-2 border-t border-border/40 flex flex-wrap gap-1.5 min-h-[3rem]">
        {Object.entries(selected).map(([layer, trait]) => (
          <span
            key={layer}
            className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-cyan-DEFAULT/30 bg-cyan-DEFAULT/8 text-cyan-dim"
          >
            {layer}: {trait.name}
          </span>
        ))}
        {Object.keys(selected).length === 0 && (
          <span className="text-[10px] font-mono text-gray-600">No traits selected</span>
        )}
      </div>

      <div className="p-3 border-t border-border/50 flex gap-2">
        <button
          onClick={randomize}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono border border-cyan-DEFAULT/30 bg-cyan-DEFAULT/8 text-cyan-DEFAULT hover:bg-cyan-DEFAULT/15 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Randomize
        </button>
        <button
          onClick={download}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono border border-border/50 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download PNG
        </button>
      </div>
    </div>
  );
}
