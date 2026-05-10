import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AppTab, TraitLayer, SelectedTraits, GeneratedNFT, CollectionConfig } from "@/types";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/useToast";
import ParticleBackground from "@/components/ParticleBackground";
import Nav from "@/components/Nav";
import ToastContainer from "@/components/Toast";
import GeneratePage from "@/pages/Generate";
import PreviewPage from "@/pages/Preview";
import MintPage from "@/pages/Mint";

const DEFAULT_CONFIG: CollectionConfig = {
  name: "My NFT Collection",
  symbol: "MNFT",
  description: "A generative NFT collection created with NFT Generator Studio.",
  size: 10,
  mintPrice: "0.01",
  maxPerWallet: 20,
  royaltyPercent: 5,
};

export default function App() {
  const [tab, setTab] = useState<AppTab>("generate");
  const [layers, setLayers] = useState<TraitLayer[]>([]);
  const [selected, setSelected] = useState<SelectedTraits>({});
  const [nfts, setNfts] = useState<GeneratedNFT[]>([]);
  const [config, setConfig] = useState<CollectionConfig>(DEFAULT_CONFIG);
  const [ipfsBaseUri, setIpfsBaseUri] = useState("");
  const [previewKey, setPreviewKey] = useState(0);

  const wallet = useWallet();
  const { toasts, push, dismiss, update } = useToast();

  const triggerPreview = () => setPreviewKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-bg text-white font-mono overflow-hidden">
      <ParticleBackground />

      {/* Cyber grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,245,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.025) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <Nav
        activeTab={tab}
        setTab={setTab}
        address={wallet.address}
        ethBalance={wallet.ethBalance}
        nftgBalance={wallet.nftgBalance}
        isGated={wallet.isGated}
        chainId={wallet.chainId}
        isConnecting={wallet.isConnecting}
        onConnect={wallet.connect}
        onSwitchChain={wallet.switchToSepolia}
      />

      {/* Main content area */}
      <main className="fixed inset-0 top-16 z-10">
        <AnimatePresence mode="wait">
          {tab === "generate" && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <GeneratePage
                layers={layers}
                setLayers={setLayers}
                selected={selected}
                setSelected={setSelected}
                nfts={nfts}
                setNfts={setNfts}
                config={config}
                setConfig={setConfig}
                previewKey={previewKey}
                triggerPreview={triggerPreview}
              />
            </motion.div>
          )}

          {tab === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <PreviewPage
                nfts={nfts}
                config={config}
                onBaseUriSet={setIpfsBaseUri}
                pushToast={push}
                updateToast={update}
              />
            </motion.div>
          )}

          {tab === "mint" && (
            <motion.div
              key="mint"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="h-full overflow-y-auto"
            >
              <MintPage
                address={wallet.address}
                ethBalance={wallet.ethBalance}
                nftgBalance={wallet.nftgBalance}
                isGated={wallet.isGated}
                chainId={wallet.chainId}
                nfts={nfts}
                config={config}
                ipfsBaseUri={ipfsBaseUri}
                getSigner={wallet.getSigner}
                onConnect={wallet.connect}
                onSwitchChain={wallet.switchToSepolia}
                pushToast={push}
                updateToast={update}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
