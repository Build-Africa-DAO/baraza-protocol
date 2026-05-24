/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/membership.json`.
 */
export type Membership = {
  "address": "34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK",
  "metadata": {
    "name": "membership",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Baraza membership program (tiers, member accounts, lifecycle)"
  },
  "instructions": [
    {
      "name": "activateMember",
      "docs": [
        "Pending -> Active. The off-chain caller MUST present a consumed",
        "PaymentAttestationAccount; on-chain validation of that consumption is",
        "deferred to CPI into payment_attestation program."
      ],
      "discriminator": [
        5,
        114,
        217,
        5,
        226,
        191,
        32,
        133
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "tier"
        },
        {
          "name": "paymentAttestation"
        },
        {
          "name": "minter",
          "docs": [
            "Baraza backend signer authorized to mint."
          ],
          "signer": true
        }
      ],
      "args": [
        {
          "name": "membershipMint",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "membershipTokenAccount",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "createTier",
      "discriminator": [
        64,
        146,
        139,
        178,
        95,
        123,
        94,
        244
      ],
      "accounts": [
        {
          "name": "community"
        },
        {
          "name": "tier",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112,
                  95,
                  116,
                  105,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "community"
              },
              {
                "kind": "arg",
                "path": "params.tier_id"
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
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createTierParams"
            }
          }
        }
      ]
    },
    {
      "name": "markExpired",
      "docs": [
        "Permissionless once `expires_at_slot` has passed. Anyone can mark."
      ],
      "discriminator": [
        233,
        240,
        220,
        88,
        125,
        234,
        231,
        125
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "migrateWallet",
      "docs": [
        "Wallet migration: the old MemberAccount transitions to Migrated and a",
        "NEW MemberAccount is created with the same `member_id_hash` linked to",
        "the new wallet. The off-chain identity (user_id_hash) is preserved.",
        "",
        "Signed by both the admin authority AND the new wallet (proves possession)."
      ],
      "discriminator": [
        19,
        61,
        234,
        12,
        65,
        216,
        167,
        86
      ],
      "accounts": [
        {
          "name": "oldMember",
          "writable": true
        },
        {
          "name": "tier"
        },
        {
          "name": "newMember",
          "writable": true
        },
        {
          "name": "newWallet",
          "signer": true
        },
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "registrar",
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
      "name": "registerMember",
      "docs": [
        "Creates a Pending MemberAccount. No mint, no voting rights yet.",
        "Called by the Baraza backend after a phone-verified user starts a join",
        "flow. The mint + Active transition happens later via `activate_member`",
        "once payment is reconciled."
      ],
      "discriminator": [
        44,
        19,
        160,
        59,
        17,
        122,
        38,
        16
      ],
      "accounts": [
        {
          "name": "community"
        },
        {
          "name": "tier",
          "writable": true
        },
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "wallet"
        },
        {
          "name": "registrar",
          "docs": [
            "Baraza backend/admin signer paying for account creation."
          ],
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
          "name": "params",
          "type": {
            "defined": {
              "name": "registerMemberParams"
            }
          }
        }
      ]
    },
    {
      "name": "reinstateMember",
      "discriminator": [
        79,
        10,
        156,
        114,
        20,
        122,
        219,
        236
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "tier",
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
      "name": "revokeMember",
      "discriminator": [
        182,
        141,
        251,
        30,
        102,
        11,
        236,
        236
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "tier",
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
      "name": "setTierStatus",
      "discriminator": [
        224,
        229,
        237,
        38,
        14,
        91,
        8,
        135
      ],
      "accounts": [
        {
          "name": "tier",
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
              "name": "tierStatus"
            }
          }
        }
      ]
    },
    {
      "name": "suspendMember",
      "discriminator": [
        66,
        24,
        181,
        33,
        163,
        2,
        216,
        162
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "tier",
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
      "name": "updateMemberTier",
      "discriminator": [
        91,
        44,
        66,
        203,
        162,
        6,
        69,
        45
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "oldTier",
          "writable": true
        },
        {
          "name": "newTier",
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
      "name": "updateTier",
      "discriminator": [
        22,
        250,
        234,
        251,
        201,
        246,
        98,
        116
      ],
      "accounts": [
        {
          "name": "tier",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "updateTierParams"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "memberAccount",
      "discriminator": [
        173,
        25,
        100,
        97,
        192,
        177,
        84,
        139
      ]
    },
    {
      "name": "membershipTierAccount",
      "discriminator": [
        162,
        103,
        156,
        223,
        184,
        196,
        50,
        181
      ]
    }
  ],
  "events": [
    {
      "name": "memberActivated",
      "discriminator": [
        168,
        116,
        246,
        211,
        243,
        173,
        55,
        142
      ]
    },
    {
      "name": "memberMigrated",
      "discriminator": [
        155,
        227,
        60,
        140,
        206,
        9,
        16,
        12
      ]
    },
    {
      "name": "memberRegistered",
      "discriminator": [
        57,
        155,
        128,
        94,
        1,
        149,
        25,
        250
      ]
    },
    {
      "name": "memberStatusChanged",
      "discriminator": [
        97,
        23,
        4,
        181,
        116,
        104,
        175,
        73
      ]
    },
    {
      "name": "memberTierChanged",
      "discriminator": [
        138,
        87,
        40,
        203,
        52,
        229,
        3,
        158
      ]
    },
    {
      "name": "tierCreated",
      "discriminator": [
        108,
        89,
        243,
        73,
        191,
        133,
        180,
        100
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidName",
      "msg": "Name must be 1-48 chars"
    },
    {
      "code": 6001,
      "name": "metadataUriTooLong",
      "msg": "Metadata URI exceeds maximum length"
    },
    {
      "code": 6002,
      "name": "invalidTierConfig",
      "msg": "Invalid tier configuration"
    },
    {
      "code": 6003,
      "name": "tierNotOpen",
      "msg": "Tier is not open for registration"
    },
    {
      "code": 6004,
      "name": "tierFull",
      "msg": "Tier has reached its seat cap"
    },
    {
      "code": 6005,
      "name": "tierClosed",
      "msg": "Tier is closed; no further mutations"
    },
    {
      "code": 6006,
      "name": "tierSeatsBelowUsed",
      "msg": "Tier max_seats cannot fall below used_seats"
    },
    {
      "code": 6007,
      "name": "communityMismatch",
      "msg": "Tier does not belong to this community"
    },
    {
      "code": 6008,
      "name": "tierMismatch",
      "msg": "Provided tier does not match member.tier"
    },
    {
      "code": 6009,
      "name": "invalidStateTransition",
      "msg": "Invalid state transition for current member status"
    },
    {
      "code": 6010,
      "name": "memberHasNoExpiry",
      "msg": "Member has no expiry configured"
    },
    {
      "code": 6011,
      "name": "tooEarly",
      "msg": "Action attempted before required slot"
    },
    {
      "code": 6012,
      "name": "unauthorized",
      "msg": "Caller is not authorized for this action"
    },
    {
      "code": 6013,
      "name": "paymentAttestationNotConsumed",
      "msg": "Payment attestation has not been consumed or was voided"
    },
    {
      "code": 6014,
      "name": "paymentAttestationMismatch",
      "msg": "Payment attestation does not match this member activation"
    }
  ],
  "types": [
    {
      "name": "createTierParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tierId",
            "type": "u16"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "descriptionUri",
            "type": "string"
          },
          {
            "name": "votingWeight",
            "type": "u64"
          },
          {
            "name": "duesSmallestUnit",
            "type": "u64"
          },
          {
            "name": "joinFeeSmallestUnit",
            "type": "u64"
          },
          {
            "name": "currencyCode",
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          },
          {
            "name": "maxSeats",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "memberAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "memberIdHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "userIdHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "walletAddress",
            "type": "pubkey"
          },
          {
            "name": "tier",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "membershipStatus"
              }
            }
          },
          {
            "name": "votingWeight",
            "type": "u64"
          },
          {
            "name": "joinedAtSlot",
            "type": "u64"
          },
          {
            "name": "activatedAtSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "expiresAtSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "revokedAtSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "migratedFromMember",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "migratedToMember",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "membershipMint",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "membershipTokenAccount",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "paymentOrderIdHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "memberActivated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "votingWeight",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "memberMigrated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "from",
            "type": "pubkey"
          },
          {
            "name": "to",
            "type": "pubkey"
          },
          {
            "name": "newWallet",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "memberRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "tier",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "memberStatusChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "membershipStatus"
              }
            }
          }
        ]
      }
    },
    {
      "name": "memberTierChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "newTier",
            "type": "pubkey"
          },
          {
            "name": "newVotingWeight",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "membershipStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "active"
          },
          {
            "name": "suspended"
          },
          {
            "name": "revoked"
          },
          {
            "name": "expired"
          },
          {
            "name": "migrated"
          }
        ]
      }
    },
    {
      "name": "membershipTierAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "tierId",
            "type": "u16"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "descriptionUri",
            "type": "string"
          },
          {
            "name": "votingWeight",
            "type": "u64"
          },
          {
            "name": "duesSmallestUnit",
            "type": "u64"
          },
          {
            "name": "joinFeeSmallestUnit",
            "type": "u64"
          },
          {
            "name": "currencyCode",
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          },
          {
            "name": "maxSeats",
            "type": "u32"
          },
          {
            "name": "usedSeats",
            "type": "u32"
          },
          {
            "name": "adminAuthority",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "tierStatus"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "registerMemberParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "memberIdHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "userIdHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "paymentOrderIdHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "expiresAtSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "metadataUri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "tierCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tier",
            "type": "pubkey"
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "tierId",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "tierStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
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
      "name": "updateTierParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "descriptionUri",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "votingWeight",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "duesSmallestUnit",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "joinFeeSmallestUnit",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maxSeats",
            "type": {
              "option": "u32"
            }
          }
        ]
      }
    }
  ]
};

export const IDL = {
  "address": "34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK",
  "metadata": {
    "name": "membership",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Baraza membership program (tiers, member accounts, lifecycle)"
  },
  "instructions": [
    {
      "name": "activate_member",
      "docs": [
        "Pending -> Active. The off-chain caller MUST present a consumed",
        "PaymentAttestationAccount; on-chain validation of that consumption is",
        "deferred to CPI into payment_attestation program."
      ],
      "discriminator": [
        5,
        114,
        217,
        5,
        226,
        191,
        32,
        133
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "tier"
        },
        {
          "name": "payment_attestation"
        },
        {
          "name": "minter",
          "docs": [
            "Baraza backend signer authorized to mint."
          ],
          "signer": true
        }
      ],
      "args": [
        {
          "name": "membership_mint",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "membership_token_account",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "create_tier",
      "discriminator": [
        64,
        146,
        139,
        178,
        95,
        123,
        94,
        244
      ],
      "accounts": [
        {
          "name": "community"
        },
        {
          "name": "tier",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112,
                  95,
                  116,
                  105,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "community"
              },
              {
                "kind": "arg",
                "path": "params.tier_id"
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
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "CreateTierParams"
            }
          }
        }
      ]
    },
    {
      "name": "mark_expired",
      "docs": [
        "Permissionless once `expires_at_slot` has passed. Anyone can mark."
      ],
      "discriminator": [
        233,
        240,
        220,
        88,
        125,
        234,
        231,
        125
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "migrate_wallet",
      "docs": [
        "Wallet migration: the old MemberAccount transitions to Migrated and a",
        "NEW MemberAccount is created with the same `member_id_hash` linked to",
        "the new wallet. The off-chain identity (user_id_hash) is preserved.",
        "",
        "Signed by both the admin authority AND the new wallet (proves possession)."
      ],
      "discriminator": [
        19,
        61,
        234,
        12,
        65,
        216,
        167,
        86
      ],
      "accounts": [
        {
          "name": "old_member",
          "writable": true
        },
        {
          "name": "tier"
        },
        {
          "name": "new_member",
          "writable": true
        },
        {
          "name": "new_wallet",
          "signer": true
        },
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "registrar",
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
      "name": "register_member",
      "docs": [
        "Creates a Pending MemberAccount. No mint, no voting rights yet.",
        "Called by the Baraza backend after a phone-verified user starts a join",
        "flow. The mint + Active transition happens later via `activate_member`",
        "once payment is reconciled."
      ],
      "discriminator": [
        44,
        19,
        160,
        59,
        17,
        122,
        38,
        16
      ],
      "accounts": [
        {
          "name": "community"
        },
        {
          "name": "tier",
          "writable": true
        },
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "wallet"
        },
        {
          "name": "registrar",
          "docs": [
            "Baraza backend/admin signer paying for account creation."
          ],
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
          "name": "params",
          "type": {
            "defined": {
              "name": "RegisterMemberParams"
            }
          }
        }
      ]
    },
    {
      "name": "reinstate_member",
      "discriminator": [
        79,
        10,
        156,
        114,
        20,
        122,
        219,
        236
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "tier",
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
      "name": "revoke_member",
      "discriminator": [
        182,
        141,
        251,
        30,
        102,
        11,
        236,
        236
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "tier",
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
      "name": "set_tier_status",
      "discriminator": [
        224,
        229,
        237,
        38,
        14,
        91,
        8,
        135
      ],
      "accounts": [
        {
          "name": "tier",
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
              "name": "TierStatus"
            }
          }
        }
      ]
    },
    {
      "name": "suspend_member",
      "discriminator": [
        66,
        24,
        181,
        33,
        163,
        2,
        216,
        162
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "tier",
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
      "name": "update_member_tier",
      "discriminator": [
        91,
        44,
        66,
        203,
        162,
        6,
        69,
        45
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true
        },
        {
          "name": "old_tier",
          "writable": true
        },
        {
          "name": "new_tier",
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
      "name": "update_tier",
      "discriminator": [
        22,
        250,
        234,
        251,
        201,
        246,
        98,
        116
      ],
      "accounts": [
        {
          "name": "tier",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "UpdateTierParams"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "MemberAccount",
      "discriminator": [
        173,
        25,
        100,
        97,
        192,
        177,
        84,
        139
      ]
    },
    {
      "name": "MembershipTierAccount",
      "discriminator": [
        162,
        103,
        156,
        223,
        184,
        196,
        50,
        181
      ]
    }
  ],
  "events": [
    {
      "name": "MemberActivated",
      "discriminator": [
        168,
        116,
        246,
        211,
        243,
        173,
        55,
        142
      ]
    },
    {
      "name": "MemberMigrated",
      "discriminator": [
        155,
        227,
        60,
        140,
        206,
        9,
        16,
        12
      ]
    },
    {
      "name": "MemberRegistered",
      "discriminator": [
        57,
        155,
        128,
        94,
        1,
        149,
        25,
        250
      ]
    },
    {
      "name": "MemberStatusChanged",
      "discriminator": [
        97,
        23,
        4,
        181,
        116,
        104,
        175,
        73
      ]
    },
    {
      "name": "MemberTierChanged",
      "discriminator": [
        138,
        87,
        40,
        203,
        52,
        229,
        3,
        158
      ]
    },
    {
      "name": "TierCreated",
      "discriminator": [
        108,
        89,
        243,
        73,
        191,
        133,
        180,
        100
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidName",
      "msg": "Name must be 1-48 chars"
    },
    {
      "code": 6001,
      "name": "MetadataUriTooLong",
      "msg": "Metadata URI exceeds maximum length"
    },
    {
      "code": 6002,
      "name": "InvalidTierConfig",
      "msg": "Invalid tier configuration"
    },
    {
      "code": 6003,
      "name": "TierNotOpen",
      "msg": "Tier is not open for registration"
    },
    {
      "code": 6004,
      "name": "TierFull",
      "msg": "Tier has reached its seat cap"
    },
    {
      "code": 6005,
      "name": "TierClosed",
      "msg": "Tier is closed; no further mutations"
    },
    {
      "code": 6006,
      "name": "TierSeatsBelowUsed",
      "msg": "Tier max_seats cannot fall below used_seats"
    },
    {
      "code": 6007,
      "name": "CommunityMismatch",
      "msg": "Tier does not belong to this community"
    },
    {
      "code": 6008,
      "name": "TierMismatch",
      "msg": "Provided tier does not match member.tier"
    },
    {
      "code": 6009,
      "name": "InvalidStateTransition",
      "msg": "Invalid state transition for current member status"
    },
    {
      "code": 6010,
      "name": "MemberHasNoExpiry",
      "msg": "Member has no expiry configured"
    },
    {
      "code": 6011,
      "name": "TooEarly",
      "msg": "Action attempted before required slot"
    },
    {
      "code": 6012,
      "name": "Unauthorized",
      "msg": "Caller is not authorized for this action"
    },
    {
      "code": 6013,
      "name": "PaymentAttestationNotConsumed",
      "msg": "Payment attestation has not been consumed or was voided"
    },
    {
      "code": 6014,
      "name": "PaymentAttestationMismatch",
      "msg": "Payment attestation does not match this member activation"
    }
  ],
  "types": [
    {
      "name": "CreateTierParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tier_id",
            "type": "u16"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description_uri",
            "type": "string"
          },
          {
            "name": "voting_weight",
            "type": "u64"
          },
          {
            "name": "dues_smallest_unit",
            "type": "u64"
          },
          {
            "name": "join_fee_smallest_unit",
            "type": "u64"
          },
          {
            "name": "currency_code",
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          },
          {
            "name": "max_seats",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "MemberAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member_id_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "user_id_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "wallet_address",
            "type": "pubkey"
          },
          {
            "name": "tier",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "MembershipStatus"
              }
            }
          },
          {
            "name": "voting_weight",
            "type": "u64"
          },
          {
            "name": "joined_at_slot",
            "type": "u64"
          },
          {
            "name": "activated_at_slot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "expires_at_slot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "revoked_at_slot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "migrated_from_member",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "migrated_to_member",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "membership_mint",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "membership_token_account",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "payment_order_id_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "metadata_uri",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "MemberActivated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "voting_weight",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "MemberMigrated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "from",
            "type": "pubkey"
          },
          {
            "name": "to",
            "type": "pubkey"
          },
          {
            "name": "new_wallet",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "MemberRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "tier",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "MemberStatusChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "MembershipStatus"
              }
            }
          }
        ]
      }
    },
    {
      "name": "MemberTierChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "new_tier",
            "type": "pubkey"
          },
          {
            "name": "new_voting_weight",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "MembershipStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Pending"
          },
          {
            "name": "Active"
          },
          {
            "name": "Suspended"
          },
          {
            "name": "Revoked"
          },
          {
            "name": "Expired"
          },
          {
            "name": "Migrated"
          }
        ]
      }
    },
    {
      "name": "MembershipTierAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "tier_id",
            "type": "u16"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description_uri",
            "type": "string"
          },
          {
            "name": "voting_weight",
            "type": "u64"
          },
          {
            "name": "dues_smallest_unit",
            "type": "u64"
          },
          {
            "name": "join_fee_smallest_unit",
            "type": "u64"
          },
          {
            "name": "currency_code",
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          },
          {
            "name": "max_seats",
            "type": "u32"
          },
          {
            "name": "used_seats",
            "type": "u32"
          },
          {
            "name": "admin_authority",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "TierStatus"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "RegisterMemberParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member_id_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "user_id_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "payment_order_id_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "expires_at_slot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "metadata_uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "TierCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tier",
            "type": "pubkey"
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "tier_id",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "TierStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Open"
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
      "name": "UpdateTierParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "description_uri",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "voting_weight",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "dues_smallest_unit",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "join_fee_smallest_unit",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "max_seats",
            "type": {
              "option": "u32"
            }
          }
        ]
      }
    }
  ]
} as unknown as Membership;
