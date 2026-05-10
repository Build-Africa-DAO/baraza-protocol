import type { TraitLayer, SelectedTraits, GeneratedNFT } from "@/types";
import { hashCombination } from "./rarity";

const CANVAS_SIZE = 1000;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function compositeTraits(
  canvas: HTMLCanvasElement,
  layers: TraitLayer[],
  selected: SelectedTraits,
): Promise<void> {
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  for (const layer of sorted) {
    const trait = selected[layer.name];
    if (!trait?.url) continue;
    try {
      const img = await loadImage(trait.url);
      ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    } catch {
      // layer image unavailable — skip silently
    }
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas is empty"))), "image/png"),
  );
}

export async function renderNFT(
  layers: TraitLayer[],
  traits: SelectedTraits,
  id: number,
): Promise<GeneratedNFT> {
  const offscreen = document.createElement("canvas");
  offscreen.width = CANVAS_SIZE;
  offscreen.height = CANVAS_SIZE;
  await compositeTraits(offscreen, layers, traits);
  const blob = await canvasToBlob(offscreen);
  const url = URL.createObjectURL(blob);
  return {
    id,
    hash: hashCombination(traits),
    traits,
    imageBlob: blob,
    imageUrl: url,
  };
}

export async function renderBatch(
  layers: TraitLayer[],
  combos: SelectedTraits[],
  onProgress?: (done: number, total: number) => void,
): Promise<GeneratedNFT[]> {
  const results: GeneratedNFT[] = [];
  for (let i = 0; i < combos.length; i++) {
    const nft = await renderNFT(layers, combos[i], i + 1);
    results.push(nft);
    onProgress?.(i + 1, combos.length);
  }
  return results;
}

export function buildCheckerboard(canvas: HTMLCanvasElement): void {
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d")!;
  const size = 20;
  for (let y = 0; y < CANVAS_SIZE; y += size) {
    for (let x = 0; x < CANVAS_SIZE; x += size) {
      ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "#1a1a26" : "#12121a";
      ctx.fillRect(x, y, size, size);
    }
  }
}
