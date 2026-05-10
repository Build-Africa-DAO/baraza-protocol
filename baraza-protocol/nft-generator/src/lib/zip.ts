import JSZip from "jszip";
import type { GeneratedNFT, CollectionConfig, NFTMetadata } from "@/types";
import { buildMetadata } from "./ipfs";

export async function exportCollectionZip(
  nfts: GeneratedNFT[],
  config: CollectionConfig,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const zip = new JSZip();
  const images = zip.folder("images")!;
  const metadata = zip.folder("metadata")!;
  const allMeta: NFTMetadata[] = [];

  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    if (nft.imageBlob) {
      images.file(`${nft.id}.png`, nft.imageBlob);
    }
    const meta = buildMetadata(nft, config, `[IPFS_CID]/${nft.id}.png`);
    allMeta.push(meta);
    metadata.file(`${nft.id}.json`, JSON.stringify(meta, null, 2));
    onProgress?.(i + 1, nfts.length);
  }

  zip.file("metadata.json", JSON.stringify(allMeta, null, 2));
  zip.file(
    "README.txt",
    `NFT Collection: ${config.name}\nGenerated: ${new Date().toISOString()}\nTotal: ${nfts.length} NFTs\n\nReplace [IPFS_CID] in metadata with your actual IPFS CID after uploading.`,
  );

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
