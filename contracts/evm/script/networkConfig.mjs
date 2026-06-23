export const SUPPORTED_NETWORKS = [
  { alias: "mainnet", chainId: "1", label: "ethereum-mainnet" },
  { alias: "sepolia", chainId: "11155111", label: "ethereum-sepolia" },
  { alias: "optimism", chainId: "10", label: "optimism-mainnet" },
  { alias: "optimism_sepolia", chainId: "11155420", label: "optimism-sepolia" },
  { alias: "base", chainId: "8453", label: "base-mainnet" },
  { alias: "base_sepolia", chainId: "84532", label: "base-sepolia" },
  { alias: "zora", chainId: "7777777", label: "zora-mainnet" },
  { alias: "zora_sepolia", chainId: "999999999", label: "zora-sepolia" },
];

export function byChainId(chainId) {
  return SUPPORTED_NETWORKS.find((n) => n.chainId === chainId);
}

export function byAlias(alias) {
  return SUPPORTED_NETWORKS.find((n) => n.alias === alias);
}

export function isSupported(alias) {
  return SUPPORTED_NETWORKS.some((n) => n.alias === alias);
}
