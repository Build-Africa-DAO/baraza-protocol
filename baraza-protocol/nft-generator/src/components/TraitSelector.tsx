import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Plus, Trash2, Upload, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import type { TraitLayer, Trait, RarityTier } from "@/types";
import { RARITY_WEIGHTS, getRarityColor, getRarityLabel } from "@/lib/rarity";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";

const RARITY_TIERS: RarityTier[] = ["common", "rare", "legendary"];

interface TraitSelectorProps {
  layers: TraitLayer[];
  setLayers: (layers: TraitLayer[]) => void;
  onPreviewChange: () => void;
}

function TraitRow({
  trait,
  onRarityChange,
  onWeightChange,
  onRemove,
}: {
  trait: Trait;
  onRarityChange: (r: RarityTier) => void;
  onWeightChange: (w: number) => void;
  onRemove: () => void;
}) {
  const color = getRarityColor(trait.rarity);
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-bg/60 border border-border/50 group">
      {trait.url && (
        <img src={trait.url} alt={trait.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
      )}
      <span className="text-xs font-mono text-gray-300 flex-1 truncate">{trait.name}</span>
      <select
        value={trait.rarity}
        onChange={(e) => onRarityChange(e.target.value as RarityTier)}
        className="text-[10px] font-mono rounded px-1.5 py-0.5 border border-border/50 bg-surface outline-none"
        style={{ color }}
      >
        {RARITY_TIERS.map((r) => (
          <option key={r} value={r}>
            {getRarityLabel(r)}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1 w-20">
        <input
          type="range"
          min={1}
          max={100}
          value={trait.weight}
          onChange={(e) => onWeightChange(Number(e.target.value))}
          className="w-12 accent-cyan-DEFAULT"
        />
        <span className="text-[10px] font-mono text-gray-500 w-6 text-right">{trait.weight}</span>
      </div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function LayerPanel({
  layer,
  onUpdate,
  onRemove,
  onTraitAdd,
  onPreviewChange,
}: {
  layer: TraitLayer;
  onUpdate: (l: TraitLayer) => void;
  onRemove: () => void;
  onTraitAdd: (files: File[]) => void;
  onPreviewChange: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/png": [".png"], "image/webp": [".webp"] },
    multiple: true,
    onDrop: (files) => {
      onTraitAdd(files);
      onPreviewChange();
    },
  });

  const updateTrait = (idx: number, patch: Partial<Trait>) => {
    const traits = layer.traits.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onUpdate({ ...layer, traits });
    onPreviewChange();
  };

  const removeTrait = (idx: number) => {
    const traits = layer.traits.filter((_, i) => i !== idx);
    onUpdate({ ...layer, traits });
    onPreviewChange();
  };

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-panel/80 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <GripVertical className="w-3.5 h-3.5 text-gray-600" />
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
        )}
        <span className="text-xs font-mono font-semibold text-gray-200 flex-1 capitalize">
          {layer.name}
        </span>
        <span className="text-[10px] font-mono text-gray-600">
          z:{layer.zIndex} · {layer.traits.length} traits
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-gray-600 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="p-2 space-y-1.5 bg-surface/40">
          {layer.traits.map((trait, i) => (
            <TraitRow
              key={trait.id}
              trait={trait}
              onRarityChange={(r) => updateTrait(i, { rarity: r, weight: RARITY_WEIGHTS[r] })}
              onWeightChange={(w) => updateTrait(i, { weight: w })}
              onRemove={() => removeTrait(i)}
            />
          ))}
          <div
            {...getRootProps()}
            className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed transition-colors cursor-pointer text-xs font-mono",
              isDragActive
                ? "border-cyan-DEFAULT/70 bg-cyan-DEFAULT/5 text-cyan-DEFAULT"
                : "border-border/40 text-gray-600 hover:border-cyan-DEFAULT/40 hover:text-cyan-dim",
            )}
          >
            <input {...getInputProps()} />
            <Upload className="w-3.5 h-3.5" />
            Drop PNGs or click to add traits
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_LAYERS: string[] = ["background", "body", "eyes", "mouth", "accessory"];

export default function TraitSelector({ layers, setLayers, onPreviewChange }: TraitSelectorProps) {
  const [newLayerName, setNewLayerName] = useState("");

  const addLayer = () => {
    const name = newLayerName.trim().toLowerCase() || `layer_${layers.length + 1}`;
    setLayers([
      ...layers,
      { id: generateId(), name, zIndex: layers.length, traits: [], required: false },
    ]);
    setNewLayerName("");
  };

  const addDefaultLayers = () => {
    if (layers.length > 0) return;
    setLayers(
      DEFAULT_LAYERS.map((name, i) => ({
        id: generateId(),
        name,
        zIndex: i,
        traits: [],
        required: i === 0,
      })),
    );
  };

  const updateLayer = (idx: number, updated: TraitLayer) => {
    setLayers(layers.map((l, i) => (i === idx ? updated : l)));
  };

  const removeLayer = (idx: number) => {
    setLayers(layers.filter((_, i) => i !== idx));
    onPreviewChange();
  };

  const addTraitsToLayer = useCallback(
    (layerIdx: number, files: File[]) => {
      const newTraits: Trait[] = files.map((f) => ({
        id: generateId(),
        name: f.name.replace(/\.[^.]+$/, ""),
        file: f,
        url: URL.createObjectURL(f),
        rarity: "common",
        weight: RARITY_WEIGHTS["common"],
      }));
      const updated = { ...layers[layerIdx], traits: [...layers[layerIdx].traits, ...newTraits] };
      updateLayer(layerIdx, updated);
    },
    [layers],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border/50">
        <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
          Trait Layers
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {layers.length === 0 && (
          <button
            onClick={addDefaultLayers}
            className="w-full py-3 rounded-xl border border-dashed border-cyan-DEFAULT/30 text-xs font-mono text-cyan-dim hover:border-cyan-DEFAULT/60 hover:bg-cyan-DEFAULT/5 transition-colors"
          >
            + Add default layers
          </button>
        )}

        {layers.map((layer, idx) => (
          <LayerPanel
            key={layer.id}
            layer={layer}
            onUpdate={(l) => updateLayer(idx, l)}
            onRemove={() => removeLayer(idx)}
            onTraitAdd={(files) => addTraitsToLayer(idx, files)}
            onPreviewChange={onPreviewChange}
          />
        ))}
      </div>

      <div className="p-3 border-t border-border/50 flex gap-2">
        <input
          value={newLayerName}
          onChange={(e) => setNewLayerName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addLayer()}
          placeholder="Layer name…"
          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border/50 text-xs font-mono text-gray-300 placeholder:text-gray-600 outline-none focus:border-cyan-DEFAULT/50"
        />
        <button
          onClick={addLayer}
          className="px-3 py-2 rounded-lg bg-cyan-DEFAULT/10 border border-cyan-DEFAULT/30 text-cyan-DEFAULT hover:bg-cyan-DEFAULT/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
