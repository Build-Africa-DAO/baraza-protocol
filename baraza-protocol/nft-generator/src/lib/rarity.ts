import type { Trait, TraitLayer, SelectedTraits } from "@/types";

export const RARITY_WEIGHTS: Record<string, number> = {
  common: 60,
  rare: 30,
  legendary: 10,
};

export function weightedRandom(traits: Trait[]): Trait | null {
  if (!traits.length) return null;
  const total = traits.reduce((sum, t) => sum + t.weight, 0);
  if (total === 0) return traits[Math.floor(Math.random() * traits.length)];
  let rand = Math.random() * total;
  for (const trait of traits) {
    rand -= trait.weight;
    if (rand <= 0) return trait;
  }
  return traits[traits.length - 1];
}

export function generateCombination(layers: TraitLayer[]): SelectedTraits {
  const result: SelectedTraits = {};
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  for (const layer of sorted) {
    if (!layer.traits.length) continue;
    const picked = weightedRandom(layer.traits);
    if (picked) result[layer.name] = picked;
  }
  return result;
}

export function hashCombination(traits: SelectedTraits): string {
  const key = Object.keys(traits)
    .sort()
    .map((k) => `${k}:${traits[k].id}`)
    .join("|");
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0");
}

export function countUniqueCombinations(layers: TraitLayer[]): number {
  return layers
    .filter((l) => l.traits.length > 0)
    .reduce((acc, l) => acc * l.traits.length, 1);
}

export function generateCollection(
  layers: TraitLayer[],
  size: number,
  onProgress?: (done: number, total: number) => void,
): SelectedTraits[] {
  const seen = new Set<string>();
  const results: SelectedTraits[] = [];
  const maxAttempts = size * 20;
  let attempts = 0;

  while (results.length < size && attempts < maxAttempts) {
    attempts++;
    const combo = generateCombination(layers);
    const hash = hashCombination(combo);
    if (!seen.has(hash)) {
      seen.add(hash);
      results.push(combo);
      onProgress?.(results.length, size);
    }
  }

  return results;
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case "legendary":
      return "#ff6b00";
    case "rare":
      return "#8b00ff";
    default:
      return "#00f5ff";
  }
}

export function getRarityLabel(rarity: string): string {
  switch (rarity) {
    case "legendary":
      return "Legendary";
    case "rare":
      return "Rare";
    default:
      return "Common";
  }
}
