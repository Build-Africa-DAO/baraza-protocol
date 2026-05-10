export type RarityTier = "common" | "rare" | "legendary";

export interface Trait {
  id: string;
  name: string;
  file: File | null;
  url: string | null;
  rarity: RarityTier;
  weight: number; // 1–100
}

export interface TraitLayer {
  id: string;
  name: string; // "background", "body", etc.
  zIndex: number;
  traits: Trait[];
  required: boolean;
}

export interface SelectedTraits {
  [layerName: string]: Trait;
}

export interface GeneratedNFT {
  id: number;
  hash: string;
  traits: SelectedTraits;
  imageBlob?: Blob;
  imageUrl?: string;
  ipfsCid?: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
}

export interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  size: number;
  mintPrice: string;
  maxPerWallet: number;
  royaltyPercent: number;
}

export interface PinataConfig {
  apiKey: string;
  secretKey: string;
}

export interface WalletState {
  address: string | null;
  ethBalance: string;
  nftgBalance: string;
  isGated: boolean;
  chainId: number | null;
}

export interface MintState {
  quantity: number;
  isMinting: boolean;
  txHash: string | null;
  mintedIds: number[];
  error: string | null;
}

export type ToastType = "success" | "error" | "info" | "pending";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  txHash?: string;
}

export type AppTab = "generate" | "preview" | "mint";
