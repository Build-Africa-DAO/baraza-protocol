/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/treasury_vault.json`.
 */
export type TreasuryVault = {
  "address": "ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy",
  "metadata": {
    "name": "treasuryVault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Baraza treasury vault program (deposits visible, withdrawals gated)"
  },
  "instructions": [
    {
      "name": "depositSol",
      "docs": [
        "Permissionless. Transfers SOL from depositor into the vault PDA."
      ],
      "discriminator": [
        108,
        81,
        78,
        117,
        125,
        155,
        56,
        200
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "disableWithdrawals",
      "discriminator": [
        150,
        136,
        206,
        120,
        173,
        230,
        137,
        209
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "enableWithdrawals",
      "discriminator": [
        97,
        146,
        76,
        161,
        177,
        54,
        109,
        83
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeVault",
      "discriminator": [
        48,
        191,
        163,
        44,
        71,
        129,
        63,
        164
      ],
      "accounts": [
        {
          "name": "community"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "community"
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "recordSplDeposit",
      "docs": [
        "Records an SPL token deposit event. The token transfer itself is",
        "performed by the caller in the same transaction (SPL token program",
        "transfer to a vault-PDA-owned ATA). This instruction just emits the",
        "audit-trail event and bumps the counter.",
        "",
        "TODO: enforce on-chain by reading the vault's ATA balance before/after."
      ],
      "discriminator": [
        54,
        251,
        166,
        65,
        193,
        12,
        254,
        152
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "depositor",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "tokenMint",
          "type": "pubkey"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "releaseSol",
      "docs": [
        "Withdraws SOL from the vault. GATED by:",
        "- vault.status == Active",
        "- vault.withdrawals_enabled (admin emergency control, default false)",
        "- signer == vault.admin_authority (placeholder; production gates via",
        "CPI from governance::execute_proposal verifying an Executed",
        "TreasuryRelease proposal)",
        "",
        "TODO(cpi): replace admin signer check with proof of an Executed",
        "TreasuryRelease proposal. Use instruction-sysvar introspection to",
        "confirm caller is the governance program, OR pass the proposal account",
        "and verify status == Executed + recipient + amount match."
      ],
      "discriminator": [
        58,
        64,
        23,
        194,
        212,
        156,
        137,
        9
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "proposal",
          "docs": [
            "and kind must be TreasuryRelease with matching recipient + amount.",
            "TODO(cpi): deserialize and validate here once governance crate is wired."
          ]
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setVaultStatus",
      "discriminator": [
        162,
        197,
        12,
        243,
        182,
        89,
        162,
        242
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "status",
          "type": {
            "defined": {
              "name": "vaultStatus"
            }
          }
        }
      ]
    },
    {
      "name": "transferAdmin",
      "discriminator": [
        42,
        242,
        66,
        106,
        228,
        10,
        111,
        156
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "treasuryVaultAccount",
      "discriminator": [
        20,
        8,
        69,
        157,
        150,
        224,
        6,
        229
      ]
    }
  ],
  "events": [
    {
      "name": "adminTransferred",
      "discriminator": [
        255,
        147,
        182,
        5,
        199,
        217,
        38,
        179
      ]
    },
    {
      "name": "solDeposited",
      "discriminator": [
        111,
        73,
        30,
        181,
        111,
        34,
        200,
        6
      ]
    },
    {
      "name": "solReleased",
      "discriminator": [
        78,
        90,
        99,
        137,
        132,
        36,
        217,
        80
      ]
    },
    {
      "name": "splDeposited",
      "discriminator": [
        57,
        184,
        227,
        128,
        235,
        82,
        125,
        250
      ]
    },
    {
      "name": "vaultInitialized",
      "discriminator": [
        180,
        43,
        207,
        2,
        18,
        71,
        3,
        75
      ]
    },
    {
      "name": "vaultStatusChanged",
      "discriminator": [
        154,
        211,
        55,
        218,
        107,
        9,
        239,
        215
      ]
    },
    {
      "name": "withdrawalsToggled",
      "discriminator": [
        238,
        127,
        72,
        195,
        197,
        51,
        234,
        185
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Caller is not authorized for this action"
    },
    {
      "code": 6001,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6002,
      "name": "vaultNotActive",
      "msg": "Vault is not in Active status"
    },
    {
      "code": 6003,
      "name": "vaultClosed",
      "msg": "Vault is closed; no further actions allowed"
    },
    {
      "code": 6004,
      "name": "withdrawalsDisabled",
      "msg": "Withdrawals are disabled for this vault"
    },
    {
      "code": 6005,
      "name": "insufficientBalance",
      "msg": "Vault balance is insufficient (would breach rent minimum)"
    }
  ],
  "types": [
    {
      "name": "adminTransferred",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "previous",
            "type": "pubkey"
          },
          {
            "name": "current",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "solDeposited",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "depositor",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "memoTag",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "solReleased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "proposal",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "splDeposited",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "depositor",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "treasuryVaultAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "adminAuthority",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "vaultStatus"
              }
            }
          },
          {
            "name": "withdrawalsEnabled",
            "type": "bool"
          },
          {
            "name": "totalSolDeposited",
            "type": "u64"
          },
          {
            "name": "totalSolReleased",
            "type": "u64"
          },
          {
            "name": "depositCount",
            "type": "u64"
          },
          {
            "name": "releaseCount",
            "type": "u64"
          },
          {
            "name": "createdAtSlot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vaultInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "admin",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "vaultStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "paused"
          },
          {
            "name": "closed"
          }
        ]
      }
    },
    {
      "name": "vaultStatusChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "vaultStatus"
              }
            }
          }
        ]
      }
    },
    {
      "name": "withdrawalsToggled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "enabled",
            "type": "bool"
          }
        ]
      }
    }
  ]
};

export const IDL = {
  "address": "ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy",
  "metadata": {
    "name": "treasury_vault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Baraza treasury vault program (deposits visible, withdrawals gated)"
  },
  "instructions": [
    {
      "name": "deposit_sol",
      "docs": [
        "Permissionless. Transfers SOL from depositor into the vault PDA."
      ],
      "discriminator": [
        108,
        81,
        78,
        117,
        125,
        155,
        56,
        200
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "disable_withdrawals",
      "discriminator": [
        150,
        136,
        206,
        120,
        173,
        230,
        137,
        209
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "enable_withdrawals",
      "discriminator": [
        97,
        146,
        76,
        161,
        177,
        54,
        109,
        83
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initialize_vault",
      "discriminator": [
        48,
        191,
        163,
        44,
        71,
        129,
        63,
        164
      ],
      "accounts": [
        {
          "name": "community"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "community"
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "record_spl_deposit",
      "docs": [
        "Records an SPL token deposit event. The token transfer itself is",
        "performed by the caller in the same transaction (SPL token program",
        "transfer to a vault-PDA-owned ATA). This instruction just emits the",
        "audit-trail event and bumps the counter.",
        "",
        "TODO: enforce on-chain by reading the vault's ATA balance before/after."
      ],
      "discriminator": [
        54,
        251,
        166,
        65,
        193,
        12,
        254,
        152
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "depositor",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "token_mint",
          "type": "pubkey"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "release_sol",
      "docs": [
        "Withdraws SOL from the vault. GATED by:",
        "- vault.status == Active",
        "- vault.withdrawals_enabled (admin emergency control, default false)",
        "- signer == vault.admin_authority (placeholder; production gates via",
        "CPI from governance::execute_proposal verifying an Executed",
        "TreasuryRelease proposal)",
        "",
        "TODO(cpi): replace admin signer check with proof of an Executed",
        "TreasuryRelease proposal. Use instruction-sysvar introspection to",
        "confirm caller is the governance program, OR pass the proposal account",
        "and verify status == Executed + recipient + amount match."
      ],
      "discriminator": [
        58,
        64,
        23,
        194,
        212,
        156,
        137,
        9
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "proposal",
          "docs": [
            "and kind must be TreasuryRelease with matching recipient + amount.",
            "TODO(cpi): deserialize and validate here once governance crate is wired."
          ]
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "set_vault_status",
      "discriminator": [
        162,
        197,
        12,
        243,
        182,
        89,
        162,
        242
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "status",
          "type": {
            "defined": {
              "name": "VaultStatus"
            }
          }
        }
      ]
    },
    {
      "name": "transfer_admin",
      "discriminator": [
        42,
        242,
        66,
        106,
        228,
        10,
        111,
        156
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "new_admin",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "TreasuryVaultAccount",
      "discriminator": [
        20,
        8,
        69,
        157,
        150,
        224,
        6,
        229
      ]
    }
  ],
  "events": [
    {
      "name": "AdminTransferred",
      "discriminator": [
        255,
        147,
        182,
        5,
        199,
        217,
        38,
        179
      ]
    },
    {
      "name": "SolDeposited",
      "discriminator": [
        111,
        73,
        30,
        181,
        111,
        34,
        200,
        6
      ]
    },
    {
      "name": "SolReleased",
      "discriminator": [
        78,
        90,
        99,
        137,
        132,
        36,
        217,
        80
      ]
    },
    {
      "name": "SplDeposited",
      "discriminator": [
        57,
        184,
        227,
        128,
        235,
        82,
        125,
        250
      ]
    },
    {
      "name": "VaultInitialized",
      "discriminator": [
        180,
        43,
        207,
        2,
        18,
        71,
        3,
        75
      ]
    },
    {
      "name": "VaultStatusChanged",
      "discriminator": [
        154,
        211,
        55,
        218,
        107,
        9,
        239,
        215
      ]
    },
    {
      "name": "WithdrawalsToggled",
      "discriminator": [
        238,
        127,
        72,
        195,
        197,
        51,
        234,
        185
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Caller is not authorized for this action"
    },
    {
      "code": 6001,
      "name": "InvalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6002,
      "name": "VaultNotActive",
      "msg": "Vault is not in Active status"
    },
    {
      "code": 6003,
      "name": "VaultClosed",
      "msg": "Vault is closed; no further actions allowed"
    },
    {
      "code": 6004,
      "name": "WithdrawalsDisabled",
      "msg": "Withdrawals are disabled for this vault"
    },
    {
      "code": 6005,
      "name": "InsufficientBalance",
      "msg": "Vault balance is insufficient (would breach rent minimum)"
    }
  ],
  "types": [
    {
      "name": "AdminTransferred",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "previous",
            "type": "pubkey"
          },
          {
            "name": "current",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "SolDeposited",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "depositor",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "memo_tag",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "SolReleased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "proposal",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "SplDeposited",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "depositor",
            "type": "pubkey"
          },
          {
            "name": "token_mint",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "TreasuryVaultAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "admin_authority",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "VaultStatus"
              }
            }
          },
          {
            "name": "withdrawals_enabled",
            "type": "bool"
          },
          {
            "name": "total_sol_deposited",
            "type": "u64"
          },
          {
            "name": "total_sol_released",
            "type": "u64"
          },
          {
            "name": "deposit_count",
            "type": "u64"
          },
          {
            "name": "release_count",
            "type": "u64"
          },
          {
            "name": "created_at_slot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "VaultInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "admin",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "VaultStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Active"
          },
          {
            "name": "Paused"
          },
          {
            "name": "Closed"
          }
        ]
      }
    },
    {
      "name": "VaultStatusChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "VaultStatus"
              }
            }
          }
        ]
      }
    },
    {
      "name": "WithdrawalsToggled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "enabled",
            "type": "bool"
          }
        ]
      }
    }
  ]
} as unknown as TreasuryVault;
