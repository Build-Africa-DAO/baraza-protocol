import type { GeneratedNFT, CollectionConfig } from "@/types";
import MintingUI from "@/components/MintingUI";
import { ethers } from "ethers";

interface MintPageProps {
  address: string | null;
  ethBalance: string;
  nftgBalance: string;
  isGated: boolean;
  chainId: number | null;
  nfts: GeneratedNFT[];
  config: CollectionConfig;
  ipfsBaseUri: string;
  getSigner: () => Promise<ethers.Signer>;
  onConnect: () => void;
  onSwitchChain: () => void;
  pushToast: (type: "success" | "error" | "info" | "pending", title: string, msg?: string, txHash?: string) => string;
  updateToast: (id: string, type: "success" | "error" | "info" | "pending", title: string, msg?: string, txHash?: string) => void;
}

export default function MintPage(props: MintPageProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            Mint Your <span className="text-gradient bg-gradient-cyber bg-clip-text text-transparent">Collection</span>
          </h1>
          <p className="text-sm font-mono text-gray-500">
            Deploy and mint your NFT collection on-chain. You need ≥ 100 NFTG tokens.
          </p>
        </div>
        <MintingUI {...props} />
      </div>
    </div>
  );
}
