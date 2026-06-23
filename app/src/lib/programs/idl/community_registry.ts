/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/community_registry.json`.
 */
export type CommunityRegistry = {
  "address": "Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD",
  "metadata": {
    "name": "communityRegistry",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Baraza community registry program (community identity + admin authority)"
  },
  "instructions": [
    {
      "name": "acceptAdmin",
      "docs": [
        "Nominee accepts the handoff. Signed by the nominee, not the outgoing admin."
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
          "name": "community",
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
      "name": "bumpMemberCount",
      "docs": [
        "Incremented by membership program via CPI when an Active MemberAccount is created.",
        "Decremented on revoke. Membership program must hold mint authority."
      ],
      "discriminator": [
        248,
        15,
        121,
        171,
        176,
        110,
        250,
        185
      ],
      "accounts": [
        {
          "name": "community",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "delta",
          "type": "i32"
        }
      ]
    },
    {
      "name": "cancelAdminNomination",
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
          "name": "community",
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
      "name": "createCommunity",
      "discriminator": [
        203,
        214,
        176,
        194,
        13,
        207,
        22,
        60
      ],
      "accounts": [
        {
          "name": "community",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "slug"
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
          "name": "slug",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "metadataUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "nominateAdmin",
      "docs": [
        "Two-step admin handoff. Current admin nominates a successor."
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
          "name": "community",
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
      "name": "setStatus",
      "discriminator": [
        181,
        184,
        224,
        203,
        193,
        29,
        177,
        224
      ],
      "accounts": [
        {
          "name": "community",
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
              "name": "communityStatus"
            }
          }
        }
      ]
    },
    {
      "name": "updateMetadata",
      "discriminator": [
        170,
        182,
        43,
        239,
        97,
        78,
        225,
        186
      ],
      "accounts": [
        {
          "name": "community",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newName",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "newMetadataUri",
          "type": {
            "option": "string"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "communityAccount",
      "discriminator": [
        111,
        62,
        119,
        115,
        144,
        161,
        149,
        151
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
      "name": "communityCreated",
      "discriminator": [
        218,
        186,
        205,
        161,
        125,
        58,
        101,
        64
      ]
    },
    {
      "name": "communityMetadataUpdated",
      "discriminator": [
        19,
        97,
        94,
        64,
        93,
        191,
        243,
        96
      ]
    },
    {
      "name": "communityStatusChanged",
      "discriminator": [
        132,
        123,
        104,
        65,
        254,
        181,
        58,
        83
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidSlug",
      "msg": "Slug must be 1-48 chars of lowercase a-z, 0-9, or hyphen"
    },
    {
      "code": 6001,
      "name": "invalidName",
      "msg": "Name must be 1-96 chars"
    },
    {
      "code": 6002,
      "name": "metadataUriTooLong",
      "msg": "Metadata URI exceeds maximum length"
    },
    {
      "code": 6003,
      "name": "unauthorized",
      "msg": "Caller is not authorized for this action"
    },
    {
      "code": 6004,
      "name": "communityNotActive",
      "msg": "Community is not in Active status"
    },
    {
      "code": 6005,
      "name": "communityClosed",
      "msg": "Community is closed; status change rejected"
    },
    {
      "code": 6006,
      "name": "noPendingAdmin",
      "msg": "No pending admin nomination"
    },
    {
      "code": 6007,
      "name": "memberCountUnderflow",
      "msg": "Member count would underflow"
    }
  ],
  "types": [
    {
      "name": "adminNominated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
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
            "name": "community",
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
      "name": "communityAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "slug",
            "type": "string"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "adminAuthority",
            "type": "pubkey"
          },
          {
            "name": "pendingAdmin",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "communityStatus"
              }
            }
          },
          {
            "name": "createdAtSlot",
            "type": "u64"
          },
          {
            "name": "memberCount",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "communityCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "slug",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "communityMetadataUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "communityStatus",
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
      "name": "communityStatusChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "communityStatus"
              }
            }
          }
        ]
      }
    }
  ]
};

export const IDL = {
  "address": "Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD",
  "metadata": {
    "name": "community_registry",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Baraza community registry program (community identity + admin authority)"
  },
  "instructions": [
    {
      "name": "accept_admin",
      "docs": [
        "Nominee accepts the handoff. Signed by the nominee, not the outgoing admin."
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
          "name": "community",
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
      "name": "bump_member_count",
      "docs": [
        "Incremented by membership program via CPI when an Active MemberAccount is created.",
        "Decremented on revoke. Membership program must hold mint authority."
      ],
      "discriminator": [
        248,
        15,
        121,
        171,
        176,
        110,
        250,
        185
      ],
      "accounts": [
        {
          "name": "community",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "delta",
          "type": "i32"
        }
      ]
    },
    {
      "name": "cancel_admin_nomination",
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
          "name": "community",
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
      "name": "create_community",
      "discriminator": [
        203,
        214,
        176,
        194,
        13,
        207,
        22,
        60
      ],
      "accounts": [
        {
          "name": "community",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "slug"
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
          "name": "slug",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "metadata_uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "nominate_admin",
      "docs": [
        "Two-step admin handoff. Current admin nominates a successor."
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
          "name": "community",
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
      "name": "set_status",
      "discriminator": [
        181,
        184,
        224,
        203,
        193,
        29,
        177,
        224
      ],
      "accounts": [
        {
          "name": "community",
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
              "name": "CommunityStatus"
            }
          }
        }
      ]
    },
    {
      "name": "update_metadata",
      "discriminator": [
        170,
        182,
        43,
        239,
        97,
        78,
        225,
        186
      ],
      "accounts": [
        {
          "name": "community",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "new_name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "new_metadata_uri",
          "type": {
            "option": "string"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "CommunityAccount",
      "discriminator": [
        111,
        62,
        119,
        115,
        144,
        161,
        149,
        151
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
      "name": "CommunityCreated",
      "discriminator": [
        218,
        186,
        205,
        161,
        125,
        58,
        101,
        64
      ]
    },
    {
      "name": "CommunityMetadataUpdated",
      "discriminator": [
        19,
        97,
        94,
        64,
        93,
        191,
        243,
        96
      ]
    },
    {
      "name": "CommunityStatusChanged",
      "discriminator": [
        132,
        123,
        104,
        65,
        254,
        181,
        58,
        83
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidSlug",
      "msg": "Slug must be 1-48 chars of lowercase a-z, 0-9, or hyphen"
    },
    {
      "code": 6001,
      "name": "InvalidName",
      "msg": "Name must be 1-96 chars"
    },
    {
      "code": 6002,
      "name": "MetadataUriTooLong",
      "msg": "Metadata URI exceeds maximum length"
    },
    {
      "code": 6003,
      "name": "Unauthorized",
      "msg": "Caller is not authorized for this action"
    },
    {
      "code": 6004,
      "name": "CommunityNotActive",
      "msg": "Community is not in Active status"
    },
    {
      "code": 6005,
      "name": "CommunityClosed",
      "msg": "Community is closed; status change rejected"
    },
    {
      "code": 6006,
      "name": "NoPendingAdmin",
      "msg": "No pending admin nomination"
    },
    {
      "code": 6007,
      "name": "MemberCountUnderflow",
      "msg": "Member count would underflow"
    }
  ],
  "types": [
    {
      "name": "AdminNominated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
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
            "name": "community",
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
      "name": "CommunityAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "slug",
            "type": "string"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "metadata_uri",
            "type": "string"
          },
          {
            "name": "admin_authority",
            "type": "pubkey"
          },
          {
            "name": "pending_admin",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "CommunityStatus"
              }
            }
          },
          {
            "name": "created_at_slot",
            "type": "u64"
          },
          {
            "name": "member_count",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "CommunityCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "slug",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "CommunityMetadataUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "CommunityStatus",
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
      "name": "CommunityStatusChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "CommunityStatus"
              }
            }
          }
        ]
      }
    }
  ]
} as unknown as CommunityRegistry;
