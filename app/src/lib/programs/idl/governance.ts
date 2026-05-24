/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/governance.json`.
 */
export type Governance = {
  "address": "DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A",
  "metadata": {
    "name": "governance",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Baraza community DAO governance program (proposals, voting, timelock)"
  },
  "instructions": [
    {
      "name": "activateProposal",
      "docs": [
        "Admin-triggered snapshot placeholder. The membership program is the",
        "source of truth for `total_eligible_weight` / `total_eligible_members`;",
        "both are passed in by the admin and should be validated via CPI in a",
        "future revision."
      ],
      "discriminator": [
        90,
        186,
        203,
        234,
        70,
        185,
        191,
        21
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "proposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "totalEligibleWeight",
          "type": "u64"
        },
        {
          "name": "totalEligibleMembers",
          "type": "u32"
        }
      ]
    },
    {
      "name": "cancelProposal",
      "discriminator": [
        106,
        74,
        128,
        146,
        19,
        65,
        39,
        23
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "proposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "creatorMember"
        },
        {
          "name": "canceler",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "castVote",
      "discriminator": [
        20,
        212,
        15,
        189,
        69,
        180,
        69,
        151
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "voterMember"
        },
        {
          "name": "receipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "proposal"
              },
              {
                "kind": "account",
                "path": "voterMember"
              }
            ]
          }
        },
        {
          "name": "voter",
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
          "name": "support",
          "type": {
            "defined": {
              "name": "voteSupport"
            }
          }
        },
        {
          "name": "reasonUri",
          "type": {
            "option": "string"
          }
        }
      ]
    },
    {
      "name": "createProposal",
      "discriminator": [
        132,
        116,
        68,
        174,
        216,
        160,
        198,
        22
      ],
      "accounts": [
        {
          "name": "community"
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
          "name": "creatorMember"
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "community"
              },
              {
                "kind": "arg",
                "path": "proposalId"
              }
            ]
          }
        },
        {
          "name": "creator",
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
          "name": "proposalId",
          "type": "u64"
        },
        {
          "name": "kind",
          "type": {
            "defined": {
              "name": "proposalKind"
            }
          }
        },
        {
          "name": "metadataUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "executeProposal",
      "discriminator": [
        186,
        60,
        116,
        133,
        108,
        128,
        111,
        28
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "proposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "expireProposal",
      "discriminator": [
        21,
        237,
        43,
        176,
        1,
        202,
        146,
        144
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "proposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "finalizeProposal",
      "docs": [
        "Permissionless. After `voting_ends_at_slot`, transitions Active to either",
        "Defeated or Succeeded based on quorum + majority. Abstain weight counts",
        "toward quorum participation but is excluded from the majority denominator."
      ],
      "discriminator": [
        23,
        68,
        51,
        167,
        109,
        173,
        187,
        164
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "proposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeConfig",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "community",
          "docs": [
            "is derived from this key; later CPI hardens the trust boundary."
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "initializeConfigParams"
            }
          }
        }
      ]
    },
    {
      "name": "queueProposal",
      "discriminator": [
        168,
        219,
        139,
        211,
        205,
        152,
        125,
        110
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "proposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "vetoProposal",
      "discriminator": [
        177,
        197,
        208,
        96,
        169,
        68,
        23,
        162
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "proposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "vetoer",
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "communityConfigAccount",
      "discriminator": [
        183,
        69,
        91,
        172,
        146,
        173,
        253,
        251
      ]
    },
    {
      "name": "proposalAccount",
      "discriminator": [
        164,
        190,
        4,
        248,
        203,
        124,
        243,
        64
      ]
    },
    {
      "name": "voteReceiptAccount",
      "discriminator": [
        45,
        159,
        191,
        186,
        110,
        120,
        241,
        101
      ]
    }
  ],
  "events": [
    {
      "name": "proposalActivated",
      "discriminator": [
        165,
        205,
        106,
        34,
        20,
        77,
        79,
        219
      ]
    },
    {
      "name": "proposalCanceled",
      "discriminator": [
        152,
        168,
        133,
        240,
        166,
        147,
        22,
        229
      ]
    },
    {
      "name": "proposalCreated",
      "discriminator": [
        186,
        8,
        160,
        108,
        81,
        13,
        51,
        206
      ]
    },
    {
      "name": "proposalExecuted",
      "discriminator": [
        92,
        213,
        189,
        201,
        101,
        83,
        111,
        83
      ]
    },
    {
      "name": "proposalExpired",
      "discriminator": [
        48,
        8,
        10,
        52,
        213,
        133,
        166,
        223
      ]
    },
    {
      "name": "proposalFinalized",
      "discriminator": [
        159,
        104,
        210,
        220,
        86,
        209,
        61,
        51
      ]
    },
    {
      "name": "proposalQueued",
      "discriminator": [
        127,
        31,
        107,
        17,
        2,
        119,
        72,
        39
      ]
    },
    {
      "name": "proposalVetoed",
      "discriminator": [
        185,
        29,
        77,
        23,
        134,
        251,
        155,
        27
      ]
    },
    {
      "name": "voteCast",
      "discriminator": [
        39,
        53,
        195,
        104,
        188,
        17,
        225,
        213
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "programPaused",
      "msg": "Program is paused"
    },
    {
      "code": 6001,
      "name": "metadataUriTooLong",
      "msg": "Metadata URI exceeds maximum length"
    },
    {
      "code": 6002,
      "name": "unauthorized",
      "msg": "Caller is not authorized for this action"
    },
    {
      "code": 6003,
      "name": "invalidStateTransition",
      "msg": "Invalid state transition for current proposal status"
    },
    {
      "code": 6004,
      "name": "proposalNotActive",
      "msg": "Proposal is not active"
    },
    {
      "code": 6005,
      "name": "outsideVotingWindow",
      "msg": "Action attempted outside the voting window"
    },
    {
      "code": 6006,
      "name": "tooEarly",
      "msg": "Action attempted before required slot"
    },
    {
      "code": 6007,
      "name": "timelockNotElapsed",
      "msg": "Timelock has not elapsed"
    },
    {
      "code": 6008,
      "name": "graceExpired",
      "msg": "Grace period has expired"
    },
    {
      "code": 6009,
      "name": "missingEta",
      "msg": "Proposal is missing ETA (queue first)"
    },
    {
      "code": 6010,
      "name": "vetoNotConfigured",
      "msg": "Vetoer authority is not configured for this community"
    },
    {
      "code": 6011,
      "name": "communityMismatch",
      "msg": "Community key does not match config"
    },
    {
      "code": 6012,
      "name": "paramOutOfBounds",
      "msg": "Parameter is out of allowed bounds"
    },
    {
      "code": 6013,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6014,
      "name": "zeroWeightVote",
      "msg": "Vote weight must be greater than zero"
    },
    {
      "code": 6015,
      "name": "invalidProposalPayload",
      "msg": "Proposal payload is invalid for its kind"
    },
    {
      "code": 6016,
      "name": "memberNotActive",
      "msg": "Member is not active"
    },
    {
      "code": 6017,
      "name": "memberMismatch",
      "msg": "Member account does not match this community or signer"
    },
    {
      "code": 6018,
      "name": "proposalThresholdNotMet",
      "msg": "Proposal threshold not met"
    }
  ],
  "types": [
    {
      "name": "communityConfigAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "votingDelaySlots",
            "type": "u64"
          },
          {
            "name": "votingPeriodSlots",
            "type": "u64"
          },
          {
            "name": "timelockDelaySlots",
            "type": "u64"
          },
          {
            "name": "gracePeriodSlots",
            "type": "u64"
          },
          {
            "name": "quorumBps",
            "type": "u16"
          },
          {
            "name": "approvalThresholdBps",
            "type": "u16"
          },
          {
            "name": "proposalThresholdWeight",
            "type": "u64"
          },
          {
            "name": "vetoerAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "adminAuthority",
            "type": "pubkey"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "configField",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "votingDelay"
          },
          {
            "name": "votingPeriod"
          },
          {
            "name": "timelockDelay"
          },
          {
            "name": "gracePeriod"
          },
          {
            "name": "quorumBps"
          },
          {
            "name": "approvalThresholdBps"
          },
          {
            "name": "proposalThresholdWeight"
          },
          {
            "name": "vetoerAuthority"
          }
        ]
      }
    },
    {
      "name": "initializeConfigParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votingDelaySlots",
            "type": "u64"
          },
          {
            "name": "votingPeriodSlots",
            "type": "u64"
          },
          {
            "name": "timelockDelaySlots",
            "type": "u64"
          },
          {
            "name": "gracePeriodSlots",
            "type": "u64"
          },
          {
            "name": "quorumBps",
            "type": "u16"
          },
          {
            "name": "approvalThresholdBps",
            "type": "u16"
          },
          {
            "name": "proposalThresholdWeight",
            "type": "u64"
          },
          {
            "name": "vetoerAuthority",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "memberActionKind",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "suspend"
          },
          {
            "name": "reinstate"
          },
          {
            "name": "revoke"
          }
        ]
      }
    },
    {
      "name": "proposalAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "proposalId",
            "type": "u64"
          },
          {
            "name": "creatorMember",
            "type": "pubkey"
          },
          {
            "name": "kind",
            "type": {
              "defined": {
                "name": "proposalKind"
              }
            }
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "proposalStatus"
              }
            }
          },
          {
            "name": "createdAtSlot",
            "type": "u64"
          },
          {
            "name": "votingStartsAtSlot",
            "type": "u64"
          },
          {
            "name": "votingEndsAtSlot",
            "type": "u64"
          },
          {
            "name": "etaSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "executedAtSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "canceledAtSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "vetoedAtSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "snapshotSlot",
            "type": "u64"
          },
          {
            "name": "eligibleMemberCount",
            "type": "u32"
          },
          {
            "name": "eligibleVotingWeight",
            "type": "u64"
          },
          {
            "name": "quorumRequired",
            "type": "u64"
          },
          {
            "name": "forWeight",
            "type": "u64"
          },
          {
            "name": "againstWeight",
            "type": "u64"
          },
          {
            "name": "abstainWeight",
            "type": "u64"
          },
          {
            "name": "voterCount",
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
      "name": "proposalActivated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "eligibleVotingWeight",
            "type": "u64"
          },
          {
            "name": "quorumRequired",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "proposalCanceled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "proposalCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "votingStartsAtSlot",
            "type": "u64"
          },
          {
            "name": "votingEndsAtSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "proposalExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "proposalExpired",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "proposalFinalized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "proposalStatus"
              }
            }
          },
          {
            "name": "forWeight",
            "type": "u64"
          },
          {
            "name": "againstWeight",
            "type": "u64"
          },
          {
            "name": "abstainWeight",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "proposalKind",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "treasuryRelease",
            "fields": [
              {
                "name": "recipient",
                "type": "pubkey"
              },
              {
                "name": "amount",
                "type": "u64"
              },
              {
                "name": "tokenMint",
                "type": {
                  "option": "pubkey"
                }
              },
              {
                "name": "purposeTag",
                "type": "u8"
              }
            ]
          },
          {
            "name": "ruleChange",
            "fields": [
              {
                "name": "targetField",
                "type": {
                  "defined": {
                    "name": "configField"
                  }
                }
              },
              {
                "name": "newValueRaw",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                }
              }
            ]
          },
          {
            "name": "membershipAction",
            "fields": [
              {
                "name": "targetMember",
                "type": "pubkey"
              },
              {
                "name": "action",
                "type": {
                  "defined": {
                    "name": "memberActionKind"
                  }
                }
              }
            ]
          },
          {
            "name": "text"
          }
        ]
      }
    },
    {
      "name": "proposalQueued",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "etaSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "proposalStatus",
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
            "name": "defeated"
          },
          {
            "name": "succeeded"
          },
          {
            "name": "queued"
          },
          {
            "name": "executed"
          },
          {
            "name": "expired"
          },
          {
            "name": "canceled"
          },
          {
            "name": "vetoed"
          }
        ]
      }
    },
    {
      "name": "proposalVetoed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "voteCast",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "support",
            "type": {
              "defined": {
                "name": "voteSupport"
              }
            }
          },
          {
            "name": "weight",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "voteReceiptAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "voterMember",
            "type": "pubkey"
          },
          {
            "name": "voterWallet",
            "type": "pubkey"
          },
          {
            "name": "support",
            "type": {
              "defined": {
                "name": "voteSupport"
              }
            }
          },
          {
            "name": "weight",
            "type": "u64"
          },
          {
            "name": "castAtSlot",
            "type": "u64"
          },
          {
            "name": "reasonUri",
            "type": {
              "option": "string"
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
      "name": "voteSupport",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "against"
          },
          {
            "name": "for"
          },
          {
            "name": "abstain"
          }
        ]
      }
    }
  ]
};

export const IDL = {
  "address": "DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A",
  "metadata": {
    "name": "governance",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Baraza community DAO governance program (proposals, voting, timelock)"
  },
  "instructions": [
    {
      "name": "activate_proposal",
      "docs": [
        "Admin-triggered snapshot placeholder. The membership program is the",
        "source of truth for `total_eligible_weight` / `total_eligible_members`;",
        "both are passed in by the admin and should be validated via CPI in a",
        "future revision."
      ],
      "discriminator": [
        90,
        186,
        203,
        234,
        70,
        185,
        191,
        21
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "ProposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "total_eligible_weight",
          "type": "u64"
        },
        {
          "name": "total_eligible_members",
          "type": "u32"
        }
      ]
    },
    {
      "name": "cancel_proposal",
      "discriminator": [
        106,
        74,
        128,
        146,
        19,
        65,
        39,
        23
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "ProposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "creator_member"
        },
        {
          "name": "canceler",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "cast_vote",
      "discriminator": [
        20,
        212,
        15,
        189,
        69,
        180,
        69,
        151
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "voter_member"
        },
        {
          "name": "receipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "proposal"
              },
              {
                "kind": "account",
                "path": "voter_member"
              }
            ]
          }
        },
        {
          "name": "voter",
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
          "name": "support",
          "type": {
            "defined": {
              "name": "VoteSupport"
            }
          }
        },
        {
          "name": "reason_uri",
          "type": {
            "option": "string"
          }
        }
      ]
    },
    {
      "name": "create_proposal",
      "discriminator": [
        132,
        116,
        68,
        174,
        216,
        160,
        198,
        22
      ],
      "accounts": [
        {
          "name": "community"
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
          "name": "creator_member"
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "community"
              },
              {
                "kind": "arg",
                "path": "proposal_id"
              }
            ]
          }
        },
        {
          "name": "creator",
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
          "name": "proposal_id",
          "type": "u64"
        },
        {
          "name": "kind",
          "type": {
            "defined": {
              "name": "ProposalKind"
            }
          }
        },
        {
          "name": "metadata_uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "execute_proposal",
      "discriminator": [
        186,
        60,
        116,
        133,
        108,
        128,
        111,
        28
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "ProposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "expire_proposal",
      "discriminator": [
        21,
        237,
        43,
        176,
        1,
        202,
        146,
        144
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "ProposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "finalize_proposal",
      "docs": [
        "Permissionless. After `voting_ends_at_slot`, transitions Active to either",
        "Defeated or Succeeded based on quorum + majority. Abstain weight counts",
        "toward quorum participation but is excluded from the majority denominator."
      ],
      "discriminator": [
        23,
        68,
        51,
        167,
        109,
        173,
        187,
        164
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "ProposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "initialize_config",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "community",
          "docs": [
            "is derived from this key; later CPI hardens the trust boundary."
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "InitializeConfigParams"
            }
          }
        }
      ]
    },
    {
      "name": "queue_proposal",
      "discriminator": [
        168,
        219,
        139,
        211,
        205,
        152,
        125,
        110
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "ProposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "veto_proposal",
      "discriminator": [
        177,
        197,
        208,
        96,
        169,
        68,
        23,
        162
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "proposal.community",
                "account": "ProposalAccount"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "vetoer",
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "CommunityConfigAccount",
      "discriminator": [
        183,
        69,
        91,
        172,
        146,
        173,
        253,
        251
      ]
    },
    {
      "name": "ProposalAccount",
      "discriminator": [
        164,
        190,
        4,
        248,
        203,
        124,
        243,
        64
      ]
    },
    {
      "name": "VoteReceiptAccount",
      "discriminator": [
        45,
        159,
        191,
        186,
        110,
        120,
        241,
        101
      ]
    }
  ],
  "events": [
    {
      "name": "ProposalActivated",
      "discriminator": [
        165,
        205,
        106,
        34,
        20,
        77,
        79,
        219
      ]
    },
    {
      "name": "ProposalCanceled",
      "discriminator": [
        152,
        168,
        133,
        240,
        166,
        147,
        22,
        229
      ]
    },
    {
      "name": "ProposalCreated",
      "discriminator": [
        186,
        8,
        160,
        108,
        81,
        13,
        51,
        206
      ]
    },
    {
      "name": "ProposalExecuted",
      "discriminator": [
        92,
        213,
        189,
        201,
        101,
        83,
        111,
        83
      ]
    },
    {
      "name": "ProposalExpired",
      "discriminator": [
        48,
        8,
        10,
        52,
        213,
        133,
        166,
        223
      ]
    },
    {
      "name": "ProposalFinalized",
      "discriminator": [
        159,
        104,
        210,
        220,
        86,
        209,
        61,
        51
      ]
    },
    {
      "name": "ProposalQueued",
      "discriminator": [
        127,
        31,
        107,
        17,
        2,
        119,
        72,
        39
      ]
    },
    {
      "name": "ProposalVetoed",
      "discriminator": [
        185,
        29,
        77,
        23,
        134,
        251,
        155,
        27
      ]
    },
    {
      "name": "VoteCast",
      "discriminator": [
        39,
        53,
        195,
        104,
        188,
        17,
        225,
        213
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ProgramPaused",
      "msg": "Program is paused"
    },
    {
      "code": 6001,
      "name": "MetadataUriTooLong",
      "msg": "Metadata URI exceeds maximum length"
    },
    {
      "code": 6002,
      "name": "Unauthorized",
      "msg": "Caller is not authorized for this action"
    },
    {
      "code": 6003,
      "name": "InvalidStateTransition",
      "msg": "Invalid state transition for current proposal status"
    },
    {
      "code": 6004,
      "name": "ProposalNotActive",
      "msg": "Proposal is not active"
    },
    {
      "code": 6005,
      "name": "OutsideVotingWindow",
      "msg": "Action attempted outside the voting window"
    },
    {
      "code": 6006,
      "name": "TooEarly",
      "msg": "Action attempted before required slot"
    },
    {
      "code": 6007,
      "name": "TimelockNotElapsed",
      "msg": "Timelock has not elapsed"
    },
    {
      "code": 6008,
      "name": "GraceExpired",
      "msg": "Grace period has expired"
    },
    {
      "code": 6009,
      "name": "MissingEta",
      "msg": "Proposal is missing ETA (queue first)"
    },
    {
      "code": 6010,
      "name": "VetoNotConfigured",
      "msg": "Vetoer authority is not configured for this community"
    },
    {
      "code": 6011,
      "name": "CommunityMismatch",
      "msg": "Community key does not match config"
    },
    {
      "code": 6012,
      "name": "ParamOutOfBounds",
      "msg": "Parameter is out of allowed bounds"
    },
    {
      "code": 6013,
      "name": "Overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6014,
      "name": "ZeroWeightVote",
      "msg": "Vote weight must be greater than zero"
    },
    {
      "code": 6015,
      "name": "InvalidProposalPayload",
      "msg": "Proposal payload is invalid for its kind"
    },
    {
      "code": 6016,
      "name": "MemberNotActive",
      "msg": "Member is not active"
    },
    {
      "code": 6017,
      "name": "MemberMismatch",
      "msg": "Member account does not match this community or signer"
    },
    {
      "code": 6018,
      "name": "ProposalThresholdNotMet",
      "msg": "Proposal threshold not met"
    }
  ],
  "types": [
    {
      "name": "CommunityConfigAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "voting_delay_slots",
            "type": "u64"
          },
          {
            "name": "voting_period_slots",
            "type": "u64"
          },
          {
            "name": "timelock_delay_slots",
            "type": "u64"
          },
          {
            "name": "grace_period_slots",
            "type": "u64"
          },
          {
            "name": "quorum_bps",
            "type": "u16"
          },
          {
            "name": "approval_threshold_bps",
            "type": "u16"
          },
          {
            "name": "proposal_threshold_weight",
            "type": "u64"
          },
          {
            "name": "vetoer_authority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "admin_authority",
            "type": "pubkey"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ConfigField",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "VotingDelay"
          },
          {
            "name": "VotingPeriod"
          },
          {
            "name": "TimelockDelay"
          },
          {
            "name": "GracePeriod"
          },
          {
            "name": "QuorumBps"
          },
          {
            "name": "ApprovalThresholdBps"
          },
          {
            "name": "ProposalThresholdWeight"
          },
          {
            "name": "VetoerAuthority"
          }
        ]
      }
    },
    {
      "name": "InitializeConfigParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voting_delay_slots",
            "type": "u64"
          },
          {
            "name": "voting_period_slots",
            "type": "u64"
          },
          {
            "name": "timelock_delay_slots",
            "type": "u64"
          },
          {
            "name": "grace_period_slots",
            "type": "u64"
          },
          {
            "name": "quorum_bps",
            "type": "u16"
          },
          {
            "name": "approval_threshold_bps",
            "type": "u16"
          },
          {
            "name": "proposal_threshold_weight",
            "type": "u64"
          },
          {
            "name": "vetoer_authority",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "MemberActionKind",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Suspend"
          },
          {
            "name": "Reinstate"
          },
          {
            "name": "Revoke"
          }
        ]
      }
    },
    {
      "name": "ProposalAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "proposal_id",
            "type": "u64"
          },
          {
            "name": "creator_member",
            "type": "pubkey"
          },
          {
            "name": "kind",
            "type": {
              "defined": {
                "name": "ProposalKind"
              }
            }
          },
          {
            "name": "metadata_uri",
            "type": "string"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "ProposalStatus"
              }
            }
          },
          {
            "name": "created_at_slot",
            "type": "u64"
          },
          {
            "name": "voting_starts_at_slot",
            "type": "u64"
          },
          {
            "name": "voting_ends_at_slot",
            "type": "u64"
          },
          {
            "name": "eta_slot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "executed_at_slot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "canceled_at_slot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "vetoed_at_slot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "snapshot_slot",
            "type": "u64"
          },
          {
            "name": "eligible_member_count",
            "type": "u32"
          },
          {
            "name": "eligible_voting_weight",
            "type": "u64"
          },
          {
            "name": "quorum_required",
            "type": "u64"
          },
          {
            "name": "for_weight",
            "type": "u64"
          },
          {
            "name": "against_weight",
            "type": "u64"
          },
          {
            "name": "abstain_weight",
            "type": "u64"
          },
          {
            "name": "voter_count",
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
      "name": "ProposalActivated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "eligible_voting_weight",
            "type": "u64"
          },
          {
            "name": "quorum_required",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "ProposalCanceled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "ProposalCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "voting_starts_at_slot",
            "type": "u64"
          },
          {
            "name": "voting_ends_at_slot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "ProposalExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "ProposalExpired",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "ProposalFinalized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "ProposalStatus"
              }
            }
          },
          {
            "name": "for_weight",
            "type": "u64"
          },
          {
            "name": "against_weight",
            "type": "u64"
          },
          {
            "name": "abstain_weight",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "ProposalKind",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TreasuryRelease",
            "fields": [
              {
                "name": "recipient",
                "type": "pubkey"
              },
              {
                "name": "amount",
                "type": "u64"
              },
              {
                "name": "token_mint",
                "type": {
                  "option": "pubkey"
                }
              },
              {
                "name": "purpose_tag",
                "type": "u8"
              }
            ]
          },
          {
            "name": "RuleChange",
            "fields": [
              {
                "name": "target_field",
                "type": {
                  "defined": {
                    "name": "ConfigField"
                  }
                }
              },
              {
                "name": "new_value_raw",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                }
              }
            ]
          },
          {
            "name": "MembershipAction",
            "fields": [
              {
                "name": "target_member",
                "type": "pubkey"
              },
              {
                "name": "action",
                "type": {
                  "defined": {
                    "name": "MemberActionKind"
                  }
                }
              }
            ]
          },
          {
            "name": "Text"
          }
        ]
      }
    },
    {
      "name": "ProposalQueued",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "eta_slot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "ProposalStatus",
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
            "name": "Defeated"
          },
          {
            "name": "Succeeded"
          },
          {
            "name": "Queued"
          },
          {
            "name": "Executed"
          },
          {
            "name": "Expired"
          },
          {
            "name": "Canceled"
          },
          {
            "name": "Vetoed"
          }
        ]
      }
    },
    {
      "name": "ProposalVetoed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "VoteCast",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "support",
            "type": {
              "defined": {
                "name": "VoteSupport"
              }
            }
          },
          {
            "name": "weight",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "VoteReceiptAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "voter_member",
            "type": "pubkey"
          },
          {
            "name": "voter_wallet",
            "type": "pubkey"
          },
          {
            "name": "support",
            "type": {
              "defined": {
                "name": "VoteSupport"
              }
            }
          },
          {
            "name": "weight",
            "type": "u64"
          },
          {
            "name": "cast_at_slot",
            "type": "u64"
          },
          {
            "name": "reason_uri",
            "type": {
              "option": "string"
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
      "name": "VoteSupport",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Against"
          },
          {
            "name": "For"
          },
          {
            "name": "Abstain"
          }
        ]
      }
    }
  ]
} as unknown as Governance;
