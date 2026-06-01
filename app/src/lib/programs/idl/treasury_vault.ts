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
      "name": "acceptAdmin",
      "docs": [
        "Step 2 of a safe admin transfer. Signed by the nominee; completes the",
        "handoff atomically. Prevents key-loss from a typo in `nominate_admin`."
      ],
      "discriminator": [
        112,
        42,
        45,
        90,
        116,
        181,
        13,
        170
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "nominee",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "acceptReleaseAuthority",
      "docs": [
        "Step 2 of a two-step release-authority handoff. The nominee must sign,",
        "preventing an accidental or malicious one-sided authority replacement."
      ],
      "discriminator": [
        77,
        24,
        105,
        56,
        196,
        9,
        182,
        52
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "nominee",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "cancelAdminNomination",
      "docs": [
        "Clears a pending admin nomination. Callable only by the current admin."
      ],
      "discriminator": [
        24,
        177,
        168,
        131,
        72,
        94,
        236,
        165
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
      "name": "cancelReleaseAuthorityNomination",
      "discriminator": [
        121,
        73,
        169,
        10,
        243,
        74,
        175,
        155
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
      "name": "nominateAdmin",
      "docs": [
        "Step 1 of a safe two-step admin transfer. Nominates a successor without",
        "immediately relinquishing control. The nominee must call `accept_admin`",
        "to complete the handoff. Use `cancel_admin_nomination` to abort."
      ],
      "discriminator": [
        134,
        11,
        31,
        244,
        20,
        77,
        138,
        121
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
    },
    {
      "name": "nominateReleaseAuthority",
      "docs": [
        "Step 1 of a two-step release-authority handoff. Production deployments",
        "nominate the Squads vault PDA, then accept through a Squads transaction."
      ],
      "discriminator": [
        239,
        74,
        158,
        243,
        125,
        74,
        120,
        93
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
          "name": "newReleaseAuthority",
          "type": "pubkey"
        }
      ]
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
        "- the configured release authority signer (Squads vault in production)",
        "- an Executed governance TreasuryRelease proposal with matching",
        "community, native SOL recipient, and amount",
        "- a one-time release receipt PDA, initialized by this instruction"
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
            "payload are validated manually."
          ]
        },
        {
          "name": "releaseReceipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "proposal"
              }
            ]
          }
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "executor",
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
    }
  ],
  "accounts": [
    {
      "name": "releaseReceiptAccount",
      "discriminator": [
        60,
        127,
        241,
        127,
        212,
        206,
        214,
        185
      ]
    },
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
      "name": "adminNominated",
      "discriminator": [
        22,
        247,
        53,
        33,
        59,
        59,
        68,
        112
      ]
    },
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
      "name": "releaseAuthorityNominated",
      "discriminator": [
        146,
        76,
        182,
        106,
        206,
        209,
        157,
        17
      ]
    },
    {
      "name": "releaseAuthorityTransferred",
      "discriminator": [
        146,
        58,
        61,
        206,
        47,
        190,
        191,
        71
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
    },
    {
      "code": 6006,
      "name": "noPendingAdmin",
      "msg": "No pending admin nomination to accept"
    },
    {
      "code": 6007,
      "name": "proposalNotExecuted",
      "msg": "Governance proposal is not executed"
    },
    {
      "code": 6008,
      "name": "proposalMismatch",
      "msg": "Governance proposal does not authorize this SOL release"
    },
    {
      "code": 6009,
      "name": "unauthorizedReleaseAuthority",
      "msg": "Release executor is not the configured multisig authority"
    },
    {
      "code": 6010,
      "name": "noPendingReleaseAuthority",
      "msg": "No pending release authority nomination to accept"
    }
  ],
  "types": [
    {
      "name": "adminNominated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "nominee",
            "type": "pubkey"
          }
        ]
      }
    },
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
      "name": "releaseAuthorityNominated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "nominee",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "releaseAuthorityTransferred",
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
      "name": "releaseReceiptAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
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
            "name": "releasedAtSlot",
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
            "name": "pendingAdmin",
            "docs": [
              "Pending two-step admin transfer. Set by `nominate_admin`, cleared on",
              "`accept_admin` or `cancel_admin_nomination`."
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "releaseAuthority",
            "docs": [
              "Signer required for proposal-authorized releases. Hand this off to a",
              "Squads vault PDA before enabling production withdrawals."
            ],
            "type": "pubkey"
          },
          {
            "name": "pendingReleaseAuthority",
            "type": {
              "option": "pubkey"
            }
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
      "name": "accept_admin",
      "docs": [
        "Step 2 of a safe admin transfer. Signed by the nominee; completes the",
        "handoff atomically. Prevents key-loss from a typo in `nominate_admin`."
      ],
      "discriminator": [
        112,
        42,
        45,
        90,
        116,
        181,
        13,
        170
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "nominee",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "accept_release_authority",
      "docs": [
        "Step 2 of a two-step release-authority handoff. The nominee must sign,",
        "preventing an accidental or malicious one-sided authority replacement."
      ],
      "discriminator": [
        77,
        24,
        105,
        56,
        196,
        9,
        182,
        52
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "nominee",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "cancel_admin_nomination",
      "docs": [
        "Clears a pending admin nomination. Callable only by the current admin."
      ],
      "discriminator": [
        24,
        177,
        168,
        131,
        72,
        94,
        236,
        165
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
      "name": "cancel_release_authority_nomination",
      "discriminator": [
        121,
        73,
        169,
        10,
        243,
        74,
        175,
        155
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
      "name": "nominate_admin",
      "docs": [
        "Step 1 of a safe two-step admin transfer. Nominates a successor without",
        "immediately relinquishing control. The nominee must call `accept_admin`",
        "to complete the handoff. Use `cancel_admin_nomination` to abort."
      ],
      "discriminator": [
        134,
        11,
        31,
        244,
        20,
        77,
        138,
        121
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
    },
    {
      "name": "nominate_release_authority",
      "docs": [
        "Step 1 of a two-step release-authority handoff. Production deployments",
        "nominate the Squads vault PDA, then accept through a Squads transaction."
      ],
      "discriminator": [
        239,
        74,
        158,
        243,
        125,
        74,
        120,
        93
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
          "name": "new_release_authority",
          "type": "pubkey"
        }
      ]
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
        "- the configured release authority signer (Squads vault in production)",
        "- an Executed governance TreasuryRelease proposal with matching",
        "community, native SOL recipient, and amount",
        "- a one-time release receipt PDA, initialized by this instruction"
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
            "payload are validated manually."
          ]
        },
        {
          "name": "release_receipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "proposal"
              }
            ]
          }
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "executor",
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
    }
  ],
  "accounts": [
    {
      "name": "ReleaseReceiptAccount",
      "discriminator": [
        60,
        127,
        241,
        127,
        212,
        206,
        214,
        185
      ]
    },
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
      "name": "AdminNominated",
      "discriminator": [
        22,
        247,
        53,
        33,
        59,
        59,
        68,
        112
      ]
    },
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
      "name": "ReleaseAuthorityNominated",
      "discriminator": [
        146,
        76,
        182,
        106,
        206,
        209,
        157,
        17
      ]
    },
    {
      "name": "ReleaseAuthorityTransferred",
      "discriminator": [
        146,
        58,
        61,
        206,
        47,
        190,
        191,
        71
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
    },
    {
      "code": 6006,
      "name": "NoPendingAdmin",
      "msg": "No pending admin nomination to accept"
    },
    {
      "code": 6007,
      "name": "ProposalNotExecuted",
      "msg": "Governance proposal is not executed"
    },
    {
      "code": 6008,
      "name": "ProposalMismatch",
      "msg": "Governance proposal does not authorize this SOL release"
    },
    {
      "code": 6009,
      "name": "UnauthorizedReleaseAuthority",
      "msg": "Release executor is not the configured multisig authority"
    },
    {
      "code": 6010,
      "name": "NoPendingReleaseAuthority",
      "msg": "No pending release authority nomination to accept"
    }
  ],
  "types": [
    {
      "name": "AdminNominated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "nominee",
            "type": "pubkey"
          }
        ]
      }
    },
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
      "name": "ReleaseAuthorityNominated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "nominee",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "ReleaseAuthorityTransferred",
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
      "name": "ReleaseReceiptAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
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
            "name": "released_at_slot",
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
            "name": "pending_admin",
            "docs": [
              "Pending two-step admin transfer. Set by `nominate_admin`, cleared on",
              "`accept_admin` or `cancel_admin_nomination`."
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "release_authority",
            "docs": [
              "Signer required for proposal-authorized releases. Hand this off to a",
              "Squads vault PDA before enabling production withdrawals."
            ],
            "type": "pubkey"
          },
          {
            "name": "pending_release_authority",
            "type": {
              "option": "pubkey"
            }
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
