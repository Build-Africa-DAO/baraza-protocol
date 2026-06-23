// Curated Baraza EVM ABIs generated from contracts/evm/dist/artifacts.
// Keep this file small: export app-facing contracts only, not test/internal artifacts.

export const MANAGER_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_tokenImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_metadataImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_auctionImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_treasuryImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_governorImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_barazaRewardsRecipient",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "acceptOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "auctionImpl",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "barazaRewardsRecipient",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "cancelOwnershipTransfer",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "contractVersion",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "deploy",
    "inputs": [
      {
        "name": "_founderParams",
        "type": "tuple[]",
        "internalType": "struct IManager.FounderParams[]",
        "components": [
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "ownershipPct",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "vestExpiry",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "_tokenParams",
        "type": "tuple",
        "internalType": "struct IManager.TokenParams",
        "components": [
          {
            "name": "initStrings",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "metadataRenderer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "reservedUntilTokenId",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "_auctionParams",
        "type": "tuple",
        "internalType": "struct IManager.AuctionParams",
        "components": [
          {
            "name": "reservePrice",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "duration",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "founderRewardRecipent",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "founderRewardBps",
            "type": "uint16",
            "internalType": "uint16"
          }
        ]
      },
      {
        "name": "_govParams",
        "type": "tuple",
        "internalType": "struct IManager.GovParams",
        "components": [
          {
            "name": "timelockDelay",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "votingDelay",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "votingPeriod",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "proposalThresholdBps",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "quorumThresholdBps",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "vetoer",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "metadata",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "auction",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "treasury",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "governor",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getAddresses",
    "inputs": [
      {
        "name": "_token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "metadata",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "auction",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "treasury",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "governor",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDAOVersions",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct IManager.DAOVersionInfo",
        "components": [
          {
            "name": "token",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "metadata",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "auction",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "treasury",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "governor",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLatestVersions",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct IManager.DAOVersionInfo",
        "components": [
          {
            "name": "token",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "metadata",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "auction",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "treasury",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "governor",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "governorImpl",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "_newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isRegisteredUpgrade",
    "inputs": [
      {
        "name": "_baseImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_upgradeImpl",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "metadataImpl",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingOwner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proxiableUUID",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerUpgrade",
    "inputs": [
      {
        "name": "_baseImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_upgradeImpl",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeUpgrade",
    "inputs": [
      {
        "name": "_baseImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_upgradeImpl",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "safeTransferOwnership",
    "inputs": [
      {
        "name": "_newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setMetadataRenderer",
    "inputs": [
      {
        "name": "_token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_newRendererImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_setupRenderer",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "metadata",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "tokenImpl",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "_newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "treasuryImpl",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "upgradeTo",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeToAndCall",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "event",
    "name": "DAODeployed",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "metadata",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "auction",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "treasury",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "governor",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MetadataRendererUpdated",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "renderer",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerCanceled",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "canceledOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerPending",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "pendingOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerUpdated",
    "inputs": [
      {
        "name": "prevOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "UpgradeRegistered",
    "inputs": [
      {
        "name": "baseImpl",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "upgradeImpl",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "UpgradeRemoved",
    "inputs": [
      {
        "name": "baseImpl",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "upgradeImpl",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Upgraded",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ADDRESS_ZERO",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ALREADY_INITIALIZED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DELEGATE_CALL_FAILED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FOUNDER_REQUIRED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_TARGET",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_UPGRADE",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "NOT_INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_CALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_DELEGATECALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_PENDING_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_PROXY",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_TOKEN_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_UUPS",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UNSUPPORTED_UUID",
    "inputs": []
  }
] as const;

export const TOKEN_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_manager",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "DOMAIN_SEPARATOR",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "acceptOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {
        "name": "_to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "auction",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [
      {
        "name": "_owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "burn",
    "inputs": [
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelOwnershipTransfer",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "contractURI",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "contractVersion",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "delegate",
    "inputs": [
      {
        "name": "_to",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "delegateBySig",
    "inputs": [
      {
        "name": "_from",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_deadline",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_v",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "_r",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_s",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "delegates",
    "inputs": [
      {
        "name": "_account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getApproved",
    "inputs": [
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getFounder",
    "inputs": [
      {
        "name": "_founderId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct TokenTypesV1.Founder",
        "components": [
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "ownershipPct",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "vestExpiry",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getFounders",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct TokenTypesV1.Founder[]",
        "components": [
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "ownershipPct",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "vestExpiry",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPastVotes",
    "inputs": [
      {
        "name": "_account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_timestamp",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getScheduledRecipient",
    "inputs": [
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct TokenTypesV1.Founder",
        "components": [
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "ownershipPct",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "vestExpiry",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVotes",
    "inputs": [
      {
        "name": "_account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "_founders",
        "type": "tuple[]",
        "internalType": "struct IManager.FounderParams[]",
        "components": [
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "ownershipPct",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "vestExpiry",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      },
      {
        "name": "_initStrings",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "_reservedUntilTokenId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_metadataRenderer",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_auction",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_initialOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isApprovedForAll",
    "inputs": [
      {
        "name": "_owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_operator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isMinter",
    "inputs": [
      {
        "name": "_minter",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "metadataRenderer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "mint",
    "inputs": [],
    "outputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "mintBatchTo",
    "inputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "tokenIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "mintFromReserveTo",
    "inputs": [
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "mintTo",
    "inputs": [
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "minter",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nonce",
    "inputs": [
      {
        "name": "_account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "onFirstAuctionStarted",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ownerOf",
    "inputs": [
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingOwner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proxiableUUID",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "remainingTokensInReserve",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "reservedUntilTokenId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "safeTransferFrom",
    "inputs": [
      {
        "name": "_from",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "safeTransferFrom",
    "inputs": [
      {
        "name": "_from",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "safeTransferOwnership",
    "inputs": [
      {
        "name": "_newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setApprovalForAll",
    "inputs": [
      {
        "name": "_operator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_approved",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setMetadataRenderer",
    "inputs": [
      {
        "name": "newRenderer",
        "type": "address",
        "internalType": "contract IBaseMetadata"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setReservedUntilTokenId",
    "inputs": [
      {
        "name": "newReservedUntilTokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "supportsInterface",
    "inputs": [
      {
        "name": "_interfaceId",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalFounderOwnership",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalFounders",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferFrom",
    "inputs": [
      {
        "name": "_from",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "_newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateFounders",
    "inputs": [
      {
        "name": "newFounders",
        "type": "tuple[]",
        "internalType": "struct IManager.FounderParams[]",
        "components": [
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "ownershipPct",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "vestExpiry",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateMinters",
    "inputs": [
      {
        "name": "_minters",
        "type": "tuple[]",
        "internalType": "struct TokenTypesV2.MinterParams[]",
        "components": [
          {
            "name": "minter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "allowed",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeTo",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeToAndCall",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "event",
    "name": "Approval",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "approved",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ApprovalForAll",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "operator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "approved",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DelegateChanged",
    "inputs": [
      {
        "name": "delegator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "to",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DelegateVotesChanged",
    "inputs": [
      {
        "name": "delegate",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "prevTotalVotes",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newTotalVotes",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FounderAllocationsCleared",
    "inputs": [
      {
        "name": "newFounders",
        "type": "tuple[]",
        "indexed": false,
        "internalType": "struct IManager.FounderParams[]",
        "components": [
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "ownershipPct",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "vestExpiry",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MetadataRendererUpdated",
    "inputs": [
      {
        "name": "renderer",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MintScheduled",
    "inputs": [
      {
        "name": "baseTokenId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "founderId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "founder",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct TokenTypesV1.Founder",
        "components": [
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "ownershipPct",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "vestExpiry",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MintUnscheduled",
    "inputs": [
      {
        "name": "baseTokenId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "founderId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "founder",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct TokenTypesV1.Founder",
        "components": [
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "ownershipPct",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "vestExpiry",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MinterUpdated",
    "inputs": [
      {
        "name": "minter",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "allowed",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerCanceled",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "canceledOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerPending",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "pendingOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerUpdated",
    "inputs": [
      {
        "name": "prevOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ReservedUntilTokenIDUpdated",
    "inputs": [
      {
        "name": "reservedUntilTokenId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "to",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Upgraded",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ADDRESS_ZERO",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ALREADY_INITIALIZED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ALREADY_MINTED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CANNOT_CHANGE_RESERVE",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CANNOT_DECREASE_RESERVE",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DELEGATE_CALL_FAILED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EXPIRED_SIGNATURE",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_APPROVAL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_FOUNDER_OWNERSHIP",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_RECIPIENT",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_SIGNATURE",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_TARGET",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_TIMESTAMP",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_UPGRADE",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "NOT_INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NOT_MINTED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NO_METADATA_GENERATED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_AUCTION",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_AUCTION_OR_MINTER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_CALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_DELEGATECALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_MANAGER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_PENDING_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_PROXY",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_TOKEN_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_UUPS",
    "inputs": []
  },
  {
    "type": "error",
    "name": "REENTRANCY",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TOKEN_NOT_RESERVED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UNSUPPORTED_UUID",
    "inputs": []
  }
] as const;

export const GOVERNOR_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_manager",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "DOMAIN_SEPARATOR",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_DELAYED_GOVERNANCE_EXPIRATION",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_PROPOSAL_THRESHOLD_BPS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_QUORUM_THRESHOLD_BPS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_VOTING_DELAY",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_VOTING_PERIOD",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_PROPOSAL_THRESHOLD_BPS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_QUORUM_THRESHOLD_BPS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_VOTING_DELAY",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_VOTING_PERIOD",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "VOTE_TYPEHASH",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "acceptOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "burnVetoer",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancel",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelOwnershipTransfer",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "castVote",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_support",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "castVoteBySig",
    "inputs": [
      {
        "name": "_voter",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_support",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_deadline",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_v",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "_r",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_s",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "castVoteWithReason",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_support",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_reason",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "contractVersion",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "delayedGovernanceExpirationTimestamp",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "execute",
    "inputs": [
      {
        "name": "_targets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "_values",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "_calldatas",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "_descriptionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_proposer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getProposal",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct GovernorTypesV1.Proposal",
        "components": [
          {
            "name": "proposer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "timeCreated",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "againstVotes",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "forVotes",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "abstainVotes",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "voteStart",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "voteEnd",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "proposalThreshold",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "quorumVotes",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "executed",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "canceled",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "vetoed",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVotes",
    "inputs": [
      {
        "name": "_account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_timestamp",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hashProposal",
    "inputs": [
      {
        "name": "_targets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "_values",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "_calldatas",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "_descriptionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_proposer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "_treasury",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_vetoer",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_votingDelay",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_votingPeriod",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_proposalThresholdBps",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_quorumThresholdBps",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "nonce",
    "inputs": [
      {
        "name": "_account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingOwner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalDeadline",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalEta",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalSnapshot",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalThreshold",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalThresholdBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalVotes",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "propose",
    "inputs": [
      {
        "name": "_targets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "_values",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "_calldatas",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "_description",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "proxiableUUID",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "queue",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "eta",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "quorum",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "quorumThresholdBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "safeTransferOwnership",
    "inputs": [
      {
        "name": "_newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "state",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum GovernorTypesV1.ProposalState"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "token",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "_newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "treasury",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "updateDelayedGovernanceExpirationTimestamp",
    "inputs": [
      {
        "name": "_newDelayedTimestamp",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateProposalThresholdBps",
    "inputs": [
      {
        "name": "_newProposalThresholdBps",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateQuorumThresholdBps",
    "inputs": [
      {
        "name": "_newQuorumVotesBps",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateVetoer",
    "inputs": [
      {
        "name": "_newVetoer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateVotingDelay",
    "inputs": [
      {
        "name": "_newVotingDelay",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateVotingPeriod",
    "inputs": [
      {
        "name": "_newVotingPeriod",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeTo",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeToAndCall",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "veto",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "vetoer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "votingDelay",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "votingPeriod",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "DelayedGovernanceExpirationTimestampUpdated",
    "inputs": [
      {
        "name": "prevTimestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newTimestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerCanceled",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "canceledOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerPending",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "pendingOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerUpdated",
    "inputs": [
      {
        "name": "prevOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalCanceled",
    "inputs": [
      {
        "name": "proposalId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalCreated",
    "inputs": [
      {
        "name": "proposalId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "targets",
        "type": "address[]",
        "indexed": false,
        "internalType": "address[]"
      },
      {
        "name": "values",
        "type": "uint256[]",
        "indexed": false,
        "internalType": "uint256[]"
      },
      {
        "name": "calldatas",
        "type": "bytes[]",
        "indexed": false,
        "internalType": "bytes[]"
      },
      {
        "name": "description",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "descriptionHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "proposal",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct GovernorTypesV1.Proposal",
        "components": [
          {
            "name": "proposer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "timeCreated",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "againstVotes",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "forVotes",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "abstainVotes",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "voteStart",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "voteEnd",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "proposalThreshold",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "quorumVotes",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "executed",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "canceled",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "vetoed",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalExecuted",
    "inputs": [
      {
        "name": "proposalId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalQueued",
    "inputs": [
      {
        "name": "proposalId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "eta",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalThresholdBpsUpdated",
    "inputs": [
      {
        "name": "prevBps",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newBps",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalVetoed",
    "inputs": [
      {
        "name": "proposalId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "QuorumVotesBpsUpdated",
    "inputs": [
      {
        "name": "prevBps",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newBps",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Upgraded",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VetoerUpdated",
    "inputs": [
      {
        "name": "prevVetoer",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "newVetoer",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VoteCast",
    "inputs": [
      {
        "name": "voter",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "proposalId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "support",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "weight",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "reason",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VotingDelayUpdated",
    "inputs": [
      {
        "name": "prevVotingDelay",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newVotingDelay",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VotingPeriodUpdated",
    "inputs": [
      {
        "name": "prevVotingPeriod",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newVotingPeriod",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ADDRESS_ZERO",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ALREADY_INITIALIZED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ALREADY_VOTED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BELOW_PROPOSAL_THRESHOLD",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CANNOT_DELAY_GOVERNANCE",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DELEGATE_CALL_FAILED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EXPIRED_SIGNATURE",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_CANCEL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_DELAYED_GOVERNANCE_EXPIRATION",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_PROPOSAL_THRESHOLD_BPS",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_QUORUM_THRESHOLD_BPS",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_SIGNATURE",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_TARGET",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_UPGRADE",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "INVALID_VOTE",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_VOTING_DELAY",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_VOTING_PERIOD",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NOT_INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_CALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_DELEGATECALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_MANAGER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_PENDING_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_PROXY",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_TOKEN_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_UUPS",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_VETOER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PROPOSAL_ALREADY_EXECUTED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PROPOSAL_DOES_NOT_EXIST",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PROPOSAL_EXISTS",
    "inputs": [
      {
        "name": "proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "PROPOSAL_LENGTH_MISMATCH",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PROPOSAL_NOT_QUEUED",
    "inputs": [
      {
        "name": "proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "PROPOSAL_TARGET_MISSING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PROPOSAL_UNSUCCESSFUL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UNSAFE_CAST",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UNSUPPORTED_UUID",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VOTING_NOT_STARTED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WAITING_FOR_TOKENS_TO_CLAIM_OR_EXPIRATION",
    "inputs": []
  }
] as const;

export const TREASURY_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_manager",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "receive",
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "acceptOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancel",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelOwnershipTransfer",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "contractVersion",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "delay",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "execute",
    "inputs": [
      {
        "name": "_targets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "_values",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "_calldatas",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "_descriptionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_proposer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "gracePeriod",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hashProposal",
    "inputs": [
      {
        "name": "_targets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "_values",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "_calldatas",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "_descriptionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_proposer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "_governor",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_delay",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isExpired",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isQueued",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isReady",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "onERC1155BatchReceived",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "onERC1155Received",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "onERC721Received",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingOwner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proxiableUUID",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "queue",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "eta",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "safeTransferOwnership",
    "inputs": [
      {
        "name": "_newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "timestamp",
    "inputs": [
      {
        "name": "_proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "_newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateDelay",
    "inputs": [
      {
        "name": "_newDelay",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateGracePeriod",
    "inputs": [
      {
        "name": "_newGracePeriod",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeTo",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeToAndCall",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "event",
    "name": "DelayUpdated",
    "inputs": [
      {
        "name": "prevDelay",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newDelay",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "GracePeriodUpdated",
    "inputs": [
      {
        "name": "prevGracePeriod",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newGracePeriod",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerCanceled",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "canceledOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerPending",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "pendingOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerUpdated",
    "inputs": [
      {
        "name": "prevOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TransactionCanceled",
    "inputs": [
      {
        "name": "proposalId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TransactionExecuted",
    "inputs": [
      {
        "name": "proposalId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "targets",
        "type": "address[]",
        "indexed": false,
        "internalType": "address[]"
      },
      {
        "name": "values",
        "type": "uint256[]",
        "indexed": false,
        "internalType": "uint256[]"
      },
      {
        "name": "payloads",
        "type": "bytes[]",
        "indexed": false,
        "internalType": "bytes[]"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TransactionScheduled",
    "inputs": [
      {
        "name": "proposalId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Upgraded",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ADDRESS_ZERO",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ALREADY_INITIALIZED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DELEGATE_CALL_FAILED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EXECUTION_EXPIRED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EXECUTION_FAILED",
    "inputs": [
      {
        "name": "txIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "EXECUTION_NOT_READY",
    "inputs": [
      {
        "name": "proposalId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_TARGET",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_UPGRADE",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "NOT_INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_CALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_DELEGATECALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_MANAGER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_PENDING_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_PROXY",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_TREASURY",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_UUPS",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PROPOSAL_ALREADY_QUEUED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PROPOSAL_NOT_QUEUED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UNSAFE_CAST",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UNSUPPORTED_UUID",
    "inputs": []
  }
] as const;

export const AUCTION_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_manager",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_rewardsManager",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_weth",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_barazaRewardsBPS",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "_referralRewardsBPS",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "REWARDS_REASON",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "acceptOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "auction",
    "inputs": [],
    "outputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "highestBid",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "highestBidder",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "startTime",
        "type": "uint40",
        "internalType": "uint40"
      },
      {
        "name": "endTime",
        "type": "uint40",
        "internalType": "uint40"
      },
      {
        "name": "settled",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "barazaRewardsBPS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "cancelOwnershipTransfer",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "contractVersion",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "createBid",
    "inputs": [
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "createBidWithReferral",
    "inputs": [
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_referral",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "currentBidReferral",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "duration",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "founderReward",
    "inputs": [],
    "outputs": [
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "percentBps",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "_token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_founder",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_treasury",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_duration",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_reservePrice",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_founderRewardRecipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_founderRewardBps",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "minBidIncrement",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pause",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "paused",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingOwner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proxiableUUID",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "referralRewardsBPS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "reservePrice",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "safeTransferOwnership",
    "inputs": [
      {
        "name": "_newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setDuration",
    "inputs": [
      {
        "name": "_duration",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setFounderReward",
    "inputs": [
      {
        "name": "reward",
        "type": "tuple",
        "internalType": "struct AuctionTypesV2.FounderReward",
        "components": [
          {
            "name": "recipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "percentBps",
            "type": "uint16",
            "internalType": "uint16"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setMinimumBidIncrement",
    "inputs": [
      {
        "name": "_percentage",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setReservePrice",
    "inputs": [
      {
        "name": "_reservePrice",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setTimeBuffer",
    "inputs": [
      {
        "name": "_timeBuffer",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "settleAuction",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "settleCurrentAndCreateNewAuction",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "timeBuffer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "token",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract Token"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "_newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "treasury",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "unpause",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeTo",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeToAndCall",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "event",
    "name": "AuctionBid",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "bidder",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "extended",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      },
      {
        "name": "endTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AuctionCreated",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "startTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "endTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AuctionSettled",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "winner",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DurationUpdated",
    "inputs": [
      {
        "name": "duration",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FounderRewardUpdated",
    "inputs": [
      {
        "name": "reward",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct AuctionTypesV2.FounderReward",
        "components": [
          {
            "name": "recipient",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "percentBps",
            "type": "uint16",
            "internalType": "uint16"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MinBidIncrementPercentageUpdated",
    "inputs": [
      {
        "name": "minBidIncrementPercentage",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerCanceled",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "canceledOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerPending",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "pendingOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnerUpdated",
    "inputs": [
      {
        "name": "prevOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Paused",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ReservePriceUpdated",
    "inputs": [
      {
        "name": "reservePrice",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TimeBufferUpdated",
    "inputs": [
      {
        "name": "timeBuffer",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Unpaused",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Upgraded",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ADDRESS_ZERO",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ALREADY_INITIALIZED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AUCTION_ACTIVE",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AUCTION_CREATE_FAILED_TO_LAUNCH",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AUCTION_NOT_STARTED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AUCTION_OVER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AUCTION_SETTLED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CANNOT_CREATE_AUCTION",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DELEGATE_CALL_FAILED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FAILING_WETH_TRANSFER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INSOLVENT",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_REWARDS_BPS",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_REWARDS_RECIPIENT",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_REWARD_TOTAL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_TARGET",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_TOKEN_ID",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_UPGRADE",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "MINIMUM_BID_NOT_MET",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MIN_BID_INCREMENT_1_PERCENT",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NOT_INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_CALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_DELEGATECALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_MANAGER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_PENDING_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_PROXY",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_UUPS",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PAUSED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "REENTRANCY",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RESERVE_PRICE_NOT_MET",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UNPAUSED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UNSAFE_CAST",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UNSUPPORTED_UUID",
    "inputs": []
  }
] as const;

export const METADATA_RENDERER_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_manager",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "addProperties",
    "inputs": [
      {
        "name": "_names",
        "type": "string[]",
        "internalType": "string[]"
      },
      {
        "name": "_items",
        "type": "tuple[]",
        "internalType": "struct MetadataRendererTypesV1.ItemParam[]",
        "components": [
          {
            "name": "propertyId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "name",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "isNewProperty",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      },
      {
        "name": "_ipfsGroup",
        "type": "tuple",
        "internalType": "struct MetadataRendererTypesV1.IPFSGroup",
        "components": [
          {
            "name": "baseUri",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "extension",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "attributes",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "contractImage",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "contractURI",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "contractVersion",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "deleteAndRecreateProperties",
    "inputs": [
      {
        "name": "_names",
        "type": "string[]",
        "internalType": "string[]"
      },
      {
        "name": "_items",
        "type": "tuple[]",
        "internalType": "struct MetadataRendererTypesV1.ItemParam[]",
        "components": [
          {
            "name": "propertyId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "name",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "isNewProperty",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      },
      {
        "name": "_ipfsGroup",
        "type": "tuple",
        "internalType": "struct MetadataRendererTypesV1.IPFSGroup",
        "components": [
          {
            "name": "baseUri",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "extension",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "description",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAttributes",
    "inputs": [
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "resultAttributes",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "queryString",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "_initStrings",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "_token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "ipfsData",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "baseUri",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "extension",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ipfsDataCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "itemsCount",
    "inputs": [
      {
        "name": "_propertyId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "onMinted",
    "inputs": [
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "projectURI",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "properties",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "propertiesCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proxiableUUID",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "rendererBase",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setAdditionalTokenProperties",
    "inputs": [
      {
        "name": "_additionalTokenProperties",
        "type": "tuple[]",
        "internalType": "struct MetadataRendererTypesV2.AdditionalTokenProperty[]",
        "components": [
          {
            "name": "key",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "value",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "quote",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "settings",
    "inputs": [],
    "outputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "projectURI",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "description",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "contractImage",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "rendererBase",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "token",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [
      {
        "name": "_tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "updateContractImage",
    "inputs": [
      {
        "name": "_newContractImage",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateDescription",
    "inputs": [
      {
        "name": "_newDescription",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateProjectURI",
    "inputs": [
      {
        "name": "_newProjectURI",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateRendererBase",
    "inputs": [
      {
        "name": "_newRendererBase",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeTo",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "upgradeToAndCall",
    "inputs": [
      {
        "name": "_newImpl",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "event",
    "name": "AdditionalTokenPropertiesSet",
    "inputs": [
      {
        "name": "_additionalJsonProperties",
        "type": "tuple[]",
        "indexed": false,
        "internalType": "struct MetadataRendererTypesV2.AdditionalTokenProperty[]",
        "components": [
          {
            "name": "key",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "value",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "quote",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ContractImageUpdated",
    "inputs": [
      {
        "name": "prevImage",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "newImage",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DescriptionUpdated",
    "inputs": [
      {
        "name": "prevDescription",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "newDescription",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PropertyAdded",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RendererBaseUpdated",
    "inputs": [
      {
        "name": "prevRendererBase",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "newRendererBase",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Upgraded",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "WebsiteURIUpdated",
    "inputs": [
      {
        "name": "lastURI",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "newURI",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ADDRESS_ZERO",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ALREADY_INITIALIZED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DELEGATE_CALL_FAILED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_PROPERTY_SELECTED",
    "inputs": [
      {
        "name": "selectedPropertyId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "INVALID_TARGET",
    "inputs": []
  },
  {
    "type": "error",
    "name": "INVALID_UPGRADE",
    "inputs": [
      {
        "name": "impl",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "NOT_INITIALIZING",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONE_PROPERTY_AND_ITEM_REQUIRED",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_CALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_DELEGATECALL",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_MANAGER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_OWNER",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_PROXY",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_TOKEN",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ONLY_UUPS",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TOKEN_NOT_MINTED",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "TOO_MANY_PROPERTIES",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UNSUPPORTED_UUID",
    "inputs": []
  }
] as const;

export const BARAZA_EVM_ABIS = {
  manager: MANAGER_ABI,
  token: TOKEN_ABI,
  governor: GOVERNOR_ABI,
  treasury: TREASURY_ABI,
  auction: AUCTION_ABI,
  metadataRenderer: METADATA_RENDERER_ABI,
} as const;
