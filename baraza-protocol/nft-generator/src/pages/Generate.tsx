import type { TraitLayer, SelectedTraits, GeneratedNFT, CollectionConfig } from "@/types";
import TraitSelector from "@/components/TraitSelector";
import CanvasPreview from "@/components/CanvasPreview";
import CollectionGenerator from "@/components/CollectionGenerator";

interface GeneratePageProps {
  layers: TraitLayer[];
  setLayers: (l: TraitLayer[]) => void;
  selected: SelectedTraits;
  setSelected: (s: SelectedTraits) => void;
  nfts: GeneratedNFT[];
  setNfts: (n: GeneratedNFT[]) => void;
  config: CollectionConfig;
  setConfig: (c: CollectionConfig) => void;
  previewKey: number;
  triggerPreview: () => void;
}

export default function GeneratePage({
  layers,
  setLayers,
  selected,
  setSelected,
  nfts,
  setNfts,
  config,
  setConfig,
  previewKey,
  triggerPreview,
}: GeneratePageProps) {
  return (
    <div className="flex h-full gap-0">
      {/* Left sidebar — trait selector */}
      <div className="w-72 flex-shrink-0 border-r border-border/50 overflow-hidden flex flex-col">
        <TraitSelector layers={layers} setLayers={setLayers} onPreviewChange={triggerPreview} />
      </div>

      {/* Center — canvas preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <CanvasPreview
          layers={layers}
          selected={selected}
          setSelected={setSelected}
          refreshKey={previewKey}
        />
      </div>

      {/* Right — generator settings */}
      <div className="w-96 flex-shrink-0 border-l border-border/50 overflow-y-auto p-5">
        <CollectionGenerator
          layers={layers}
          nfts={nfts}
          setNfts={setNfts}
          config={config}
          setConfig={setConfig}
        />
      </div>
    </div>
  );
}
