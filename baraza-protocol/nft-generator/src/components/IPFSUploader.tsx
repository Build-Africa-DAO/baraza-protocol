import { useState } from "react";
import { Cloud, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import type { GeneratedNFT, CollectionConfig } from "@/types";
import { uploadCollection, testPinataConnection } from "@/lib/ipfs";
import { cn } from "@/lib/utils";

interface IPFSUploaderProps {
  nfts: GeneratedNFT[];
  config: CollectionConfig;
  onBaseUriSet: (uri: string) => void;
  pushToast: (type: "success" | "error" | "info" | "pending", title: string, msg?: string) => string;
  updateToast: (id: string, type: "success" | "error" | "info" | "pending", title: string, msg?: string) => void;
}

export default function IPFSUploader({ nfts, config, onBaseUriSet, pushToast, updateToast }: IPFSUploaderProps) {
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ stage: "", done: 0, total: 0 });
  const [result, setResult] = useState<{ imagesCid: string; metadataCid: string; baseUri: string } | null>(null);
  const [tested, setTested] = useState<boolean | null>(null);

  const testConnection = async () => {
    const ok = await testPinataConnection(apiKey, secretKey);
    setTested(ok);
    if (ok) pushToast("success", "Pinata connected", "API keys are valid");
    else pushToast("error", "Pinata auth failed", "Check your API key and secret");
  };

  const upload = async () => {
    if (!apiKey || !secretKey || !nfts.length) return;
    setIsUploading(true);
    const toastId = pushToast("pending", "Uploading to IPFS…", "This may take a while");
    try {
      const res = await uploadCollection(nfts, config, apiKey, secretKey, (stage, done, total) =>
        setProgress({ stage, done, total }),
      );
      setResult(res);
      onBaseUriSet(res.baseUri);
      updateToast(toastId, "success", "Uploaded to IPFS!", `Base URI: ${res.baseUri}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      updateToast(toastId, "error", "Upload failed", msg);
    } finally {
      setIsUploading(false);
      setProgress({ stage: "", done: 0, total: 0 });
    }
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/50 bg-panel/60 p-5 space-y-4">
      <h3 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Cloud className="w-3.5 h-3.5" />
        IPFS Upload (Pinata)
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            Pinata API Key
          </label>
          <div className="relative">
            <input
              type={showKeys ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="pk_live_…"
              className="w-full px-3 py-2 pr-8 rounded-lg bg-surface border border-border/50 text-xs font-mono text-gray-200 placeholder:text-gray-600 outline-none focus:border-cyan-DEFAULT/50 transition-colors"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            Pinata Secret
          </label>
          <div className="relative">
            <input
              type={showKeys ? "text" : "password"}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_live_…"
              className="w-full px-3 py-2 pr-8 rounded-lg bg-surface border border-border/50 text-xs font-mono text-gray-200 placeholder:text-gray-600 outline-none focus:border-cyan-DEFAULT/50 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={() => setShowKeys((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] font-mono text-gray-600 hover:text-gray-400 transition-colors"
        >
          {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showKeys ? "Hide" : "Show"} keys
        </button>
        <button
          onClick={testConnection}
          disabled={!apiKey || !secretKey}
          className="px-3 py-1 rounded-lg text-[10px] font-mono border border-border/50 text-gray-400 hover:text-gray-300 hover:border-gray-500 transition-colors disabled:opacity-40"
        >
          Test Connection
        </button>
        {tested !== null && (
          <span className={cn("flex items-center gap-1 text-[10px] font-mono", tested ? "text-neon-green" : "text-red-400")}>
            {tested ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {tested ? "Connected" : "Failed"}
          </span>
        )}
      </div>

      {isUploading && progress.total > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono text-gray-500">
            <span>Uploading {progress.stage}…</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-cyber transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-2 p-3 rounded-lg bg-neon-green/5 border border-neon-green/20">
          <p className="text-[10px] font-mono text-neon-green font-semibold">✓ Upload complete</p>
          <div className="space-y-1 text-[10px] font-mono text-gray-400 break-all">
            <div>Images: <span className="text-gray-300">ipfs://{result.imagesCid}/</span></div>
            <div>Metadata: <span className="text-gray-300">ipfs://{result.metadataCid}/</span></div>
            <div>Base URI: <span className="text-cyan-DEFAULT">{result.baseUri}</span></div>
          </div>
        </div>
      )}

      <button
        onClick={upload}
        disabled={!apiKey || !secretKey || !nfts.length || isUploading}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all",
          apiKey && secretKey && nfts.length && !isUploading
            ? "bg-purple-DEFAULT/20 border border-purple-DEFAULT/40 text-purple-DEFAULT hover:bg-purple-DEFAULT/30"
            : "bg-surface border border-border/50 text-gray-600 cursor-not-allowed",
        )}
      >
        <Cloud className="w-3.5 h-3.5" />
        {isUploading ? "Uploading…" : `Upload ${nfts.length} NFTs to IPFS`}
      </button>
    </div>
  );
}
