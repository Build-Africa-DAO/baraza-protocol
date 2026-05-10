import { useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import type { WalletState } from "@/types";
import {
  getNFTGContract,
  NFTG_ADDRESS_SEPOLIA,
  NFTG_REQUIRED,
  SEPOLIA_CHAIN_ID,
} from "@/lib/contracts";

const DEFAULT_STATE: WalletState = {
  address: null,
  ethBalance: "0",
  nftgBalance: "0",
  isGated: false,
  chainId: null,
};

export function useWallet() {
  const [state, setState] = useState<WalletState>(DEFAULT_STATE);
  const [isConnecting, setIsConnecting] = useState(false);
  const providerRef = useRef<ethers.BrowserProvider | null>(null);

  const refreshBalances = useCallback(async (address: string, provider: ethers.BrowserProvider) => {
    try {
      const [ethBal, network] = await Promise.all([
        provider.getBalance(address),
        provider.getNetwork(),
      ]);

      let nftgBal = 0n;
      if (NFTG_ADDRESS_SEPOLIA) {
        try {
          const nftg = getNFTGContract(provider, NFTG_ADDRESS_SEPOLIA);
          nftgBal = await nftg.balanceOf(address);
        } catch {
          // contract not deployed yet — balance stays 0
        }
      }

      setState({
        address,
        ethBalance: (Number(ethBal) / 1e18).toFixed(4),
        nftgBalance: (Number(nftgBal) / 1e18).toFixed(2),
        isGated: nftgBal >= NFTG_REQUIRED,
        chainId: Number(network.chainId),
      });
    } catch {
      // network error
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install it first.");
      return;
    }
    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      providerRef.current = provider;
      const accounts: string[] = await provider.send("eth_requestAccounts", []);
      if (accounts[0]) await refreshBalances(accounts[0], provider);
    } catch {
      // user rejected
    } finally {
      setIsConnecting(false);
    }
  }, [refreshBalances]);

  const disconnect = useCallback(() => {
    providerRef.current = null;
    setState(DEFAULT_STATE);
  }, []);

  const getSigner = useCallback(async () => {
    if (!providerRef.current) throw new Error("Wallet not connected");
    return providerRef.current.getSigner();
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch {
      // add network if missing
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
            chainName: "Sepolia Test Network",
            nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
    }
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const onAccountsChanged = (accounts: string[]) => {
      if (!accounts.length) {
        setState(DEFAULT_STATE);
      } else if (providerRef.current) {
        refreshBalances(accounts[0], providerRef.current);
      }
    };
    const onChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, [refreshBalances]);

  return { ...state, isConnecting, connect, disconnect, getSigner, switchToSepolia, refreshBalances };
}
