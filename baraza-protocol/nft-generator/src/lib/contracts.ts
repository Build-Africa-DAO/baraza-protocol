import { ethers } from "ethers";

export const NFTG_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

export const NFT_COLLECTION_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function mintPrice() view returns (uint256)",
  "function baseURI() view returns (string)",
  "function nftgToken() view returns (address)",
  "function NFTG_REQUIRED() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function mint(uint256 quantity) payable",
  "function setBaseURI(string calldata newBaseURI)",
  "function withdraw()",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Minted(address indexed to, uint256 indexed startId, uint256 quantity)",
];

export const NFTG_ADDRESS_SEPOLIA = import.meta.env.VITE_NFTG_ADDRESS ?? "";
export const NFT_COLLECTION_ADDRESS_SEPOLIA = import.meta.env.VITE_NFT_COLLECTION_ADDRESS ?? "";

export const NFTG_REQUIRED = ethers.parseEther("100");
export const MINT_PRICE = ethers.parseEther("0.01");

export function getNFTGContract(
  signerOrProvider: ethers.Signer | ethers.Provider,
  address: string,
): ethers.Contract {
  return new ethers.Contract(address, NFTG_ABI, signerOrProvider);
}

export function getNFTCollectionContract(
  signerOrProvider: ethers.Signer | ethers.Provider,
  address: string,
): ethers.Contract {
  return new ethers.Contract(address, NFT_COLLECTION_ABI, signerOrProvider);
}

export const UNISWAP_DEEPLINK = `https://app.uniswap.org/swap?outputCurrency=${NFTG_ADDRESS_SEPOLIA}&chain=sepolia`;

export const SEPOLIA_CHAIN_ID = 11155111;

export const SUPPORTED_CHAINS: Record<number, string> = {
  11155111: "Sepolia",
  1: "Ethereum",
};
