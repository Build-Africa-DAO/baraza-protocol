import type { GeneratedNFT, NFTMetadata, CollectionConfig } from "@/types";

const PINATA_BASE = "https://api.pinata.cloud";

async function pinataFetch(
  path: string,
  options: RequestInit,
  apiKey: string,
  secretKey: string,
): Promise<Response> {
  return fetch(`${PINATA_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
  });
}

export async function testPinataConnection(
  apiKey: string,
  secretKey: string,
): Promise<boolean> {
  try {
    const res = await pinataFetch(
      "/data/testAuthentication",
      { method: "GET" },
      apiKey,
      secretKey,
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function uploadImageToPinata(
  blob: Blob,
  filename: string,
  apiKey: string,
  secretKey: string,
): Promise<string> {
  const form = new FormData();
  form.append("file", blob, filename);
  form.append(
    "pinataMetadata",
    JSON.stringify({ name: filename }),
  );

  const res = await pinataFetch(
    "/pinning/pinFileToIPFS",
    { method: "POST", body: form },
    apiKey,
    secretKey,
  );

  if (!res.ok) throw new Error(`Pinata upload failed: ${res.statusText}`);
  const data = await res.json();
  return data.IpfsHash as string;
}

export async function uploadFolderToPinata(
  files: Array<{ name: string; blob: Blob }>,
  folderName: string,
  apiKey: string,
  secretKey: string,
  onProgress?: (done: number, total: number) => void,
): Promise<string> {
  const form = new FormData();
  files.forEach(({ name, blob }, i) => {
    form.append("file", blob, `${folderName}/${name}`);
    onProgress?.(i + 1, files.length);
  });
  form.append("pinataMetadata", JSON.stringify({ name: folderName }));

  const res = await pinataFetch(
    "/pinning/pinFileToIPFS",
    { method: "POST", body: form },
    apiKey,
    secretKey,
  );

  if (!res.ok) throw new Error(`Pinata folder upload failed: ${res.statusText}`);
  const data = await res.json();
  return data.IpfsHash as string;
}

export function buildMetadata(
  nft: GeneratedNFT,
  config: CollectionConfig,
  imageCid: string,
): NFTMetadata {
  return {
    name: `${config.name} #${nft.id}`,
    description: config.description,
    image: `ipfs://${imageCid}`,
    attributes: Object.entries(nft.traits).map(([layerName, trait]) => ({
      trait_type: layerName.charAt(0).toUpperCase() + layerName.slice(1),
      value: trait.name,
    })),
  };
}

export async function uploadCollection(
  nfts: GeneratedNFT[],
  config: CollectionConfig,
  apiKey: string,
  secretKey: string,
  onProgress?: (stage: string, done: number, total: number) => void,
): Promise<{ imagesCid: string; metadataCid: string; baseUri: string }> {
  // 1. Upload images as a folder
  const imageFiles = nfts
    .filter((n) => n.imageBlob)
    .map((n) => ({ name: `${n.id}.png`, blob: n.imageBlob! }));

  onProgress?.("images", 0, imageFiles.length);
  const imagesCid = await uploadFolderToPinata(
    imageFiles,
    "images",
    apiKey,
    secretKey,
    (d, t) => onProgress?.("images", d, t),
  );

  // 2. Build and upload metadata
  const metaFiles = nfts.map((nft) => {
    const meta = buildMetadata(nft, config, `${imagesCid}/${nft.id}.png`);
    const blob = new Blob([JSON.stringify(meta, null, 2)], { type: "application/json" });
    return { name: `${nft.id}.json`, blob };
  });

  onProgress?.("metadata", 0, metaFiles.length);
  const metadataCid = await uploadFolderToPinata(
    metaFiles,
    "metadata",
    apiKey,
    secretKey,
    (d, t) => onProgress?.("metadata", d, t),
  );

  return {
    imagesCid,
    metadataCid,
    baseUri: `ipfs://${metadataCid}/`,
  };
}
