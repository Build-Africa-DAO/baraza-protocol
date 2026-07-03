/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/payment_attestation.json`.
 */
export type PaymentAttestation = {
  "address": "Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT",
  "metadata": {
    "name": "paymentAttestation",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Baraza payment attestation program"
  },
  "instructions": [
    {
      "name": "attestPayment",
      "discriminator": [
        123,
        12,
        76,
        170,
        218,
        62,
        47,
        70
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "attestation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "params.order_id_hash"
              }
            ]
          }
        },
        {
          "name": "attester",
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
              "name": "attestPaymentParams"
            }
          }
        }
      ]
    },
    {
      "name": "consumePaymentForMint",
      "discriminator": [
        117,
        240,
        179,
        70,
        213,
        162,
        162,
        130
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "attestation",
          "writable": true
        },
        {
          "name": "consumer",
          "signer": true
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
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
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
          "name": "trustedAttester",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "transferTrustedAttester",
      "discriminator": [
        233,
        218,
        40,
        132,
        236,
        57,
        83,
        155
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "trustedAttester",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "voidPaymentAttestation",
      "discriminator": [
        156,
        49,
        158,
        180,
        80,
        74,
        229,
        134
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "attestation",
          "writable": true
        },
        {
          "name": "attester",
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "paymentAttestationAccount",
      "discriminator": [
        62,
        247,
        19,
        32,
        195,
        26,
        7,
        197
      ]
    },
    {
      "name": "paymentConfigAccount",
      "discriminator": [
        208,
        240,
        157,
        153,
        186,
        223,
        191,
        16
      ]
    }
  ],
  "events": [
    {
      "name": "paymentAttestationConsumed",
      "discriminator": [
        247,
        129,
        65,
        78,
        168,
        255,
        39,
        229
      ]
    },
    {
      "name": "paymentAttestationVoided",
      "discriminator": [
        7,
        89,
        58,
        21,
        197,
        0,
        82,
        43
      ]
    },
    {
      "name": "paymentAttested",
      "discriminator": [
        202,
        127,
        151,
        234,
        238,
        136,
        206,
        17
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Caller is not authorized for this payment attestation"
    },
    {
      "code": 6001,
      "name": "alreadyConsumed",
      "msg": "Payment attestation has already been consumed"
    },
    {
      "code": 6002,
      "name": "attestationExpired",
      "msg": "Payment attestation has expired"
    },
    {
      "code": 6003,
      "name": "attestationVoided",
      "msg": "Payment attestation has been voided"
    },
    {
      "code": 6004,
      "name": "alreadyVoided",
      "msg": "Payment attestation has already been voided"
    },
    {
      "code": 6005,
      "name": "invalidAmount",
      "msg": "Payment amount must be greater than zero"
    },
    {
      "code": 6006,
      "name": "invalidProviderEnvironment",
      "msg": "Provider environment is invalid"
    }
  ],
  "types": [
    {
      "name": "attestPaymentParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderIdHash",
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
            "name": "tier",
            "type": "pubkey"
          },
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
            "name": "recipientWallet",
            "type": "pubkey"
          },
          {
            "name": "amountSmallestUnit",
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
            "name": "providerReferenceHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "providerEnvironment",
            "type": "string"
          },
          {
            "name": "expiresAtSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "paymentAttestationAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderIdHash",
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
            "name": "tier",
            "type": "pubkey"
          },
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
            "name": "recipientWallet",
            "type": "pubkey"
          },
          {
            "name": "amountSmallestUnit",
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
            "name": "providerReferenceHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "providerEnvironment",
            "type": "string"
          },
          {
            "name": "attester",
            "type": "pubkey"
          },
          {
            "name": "expiresAtSlot",
            "type": "u64"
          },
          {
            "name": "consumed",
            "type": "bool"
          },
          {
            "name": "consumedAtSlot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "voided",
            "type": "bool"
          },
          {
            "name": "voidedAtSlot",
            "type": {
              "option": "u64"
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
      "name": "paymentAttestationConsumed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attestation",
            "type": "pubkey"
          },
          {
            "name": "consumer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "paymentAttestationVoided",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attestation",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "paymentAttested",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attestation",
            "type": "pubkey"
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "tier",
            "type": "pubkey"
          },
          {
            "name": "recipientWallet",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "paymentConfigAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "trustedAttester",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};

export const IDL = {
  "address": "Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT",
  "metadata": {
    "name": "payment_attestation",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Baraza payment attestation program"
  },
  "instructions": [
    {
      "name": "attest_payment",
      "discriminator": [
        123,
        12,
        76,
        170,
        218,
        62,
        47,
        70
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "attestation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "params.order_id_hash"
              }
            ]
          }
        },
        {
          "name": "attester",
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
              "name": "AttestPaymentParams"
            }
          }
        }
      ]
    },
    {
      "name": "consume_payment_for_mint",
      "discriminator": [
        117,
        240,
        179,
        70,
        213,
        162,
        162,
        130
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "attestation",
          "writable": true
        },
        {
          "name": "consumer",
          "signer": true
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
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
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
          "name": "trusted_attester",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "transfer_trusted_attester",
      "discriminator": [
        233,
        218,
        40,
        132,
        236,
        57,
        83,
        155
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "trusted_attester",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "void_payment_attestation",
      "discriminator": [
        156,
        49,
        158,
        180,
        80,
        74,
        229,
        134
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "attestation",
          "writable": true
        },
        {
          "name": "attester",
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "PaymentAttestationAccount",
      "discriminator": [
        62,
        247,
        19,
        32,
        195,
        26,
        7,
        197
      ]
    },
    {
      "name": "PaymentConfigAccount",
      "discriminator": [
        208,
        240,
        157,
        153,
        186,
        223,
        191,
        16
      ]
    }
  ],
  "events": [
    {
      "name": "PaymentAttestationConsumed",
      "discriminator": [
        247,
        129,
        65,
        78,
        168,
        255,
        39,
        229
      ]
    },
    {
      "name": "PaymentAttestationVoided",
      "discriminator": [
        7,
        89,
        58,
        21,
        197,
        0,
        82,
        43
      ]
    },
    {
      "name": "PaymentAttested",
      "discriminator": [
        202,
        127,
        151,
        234,
        238,
        136,
        206,
        17
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Caller is not authorized for this payment attestation"
    },
    {
      "code": 6001,
      "name": "AlreadyConsumed",
      "msg": "Payment attestation has already been consumed"
    },
    {
      "code": 6002,
      "name": "AttestationExpired",
      "msg": "Payment attestation has expired"
    },
    {
      "code": 6003,
      "name": "AttestationVoided",
      "msg": "Payment attestation has been voided"
    },
    {
      "code": 6004,
      "name": "AlreadyVoided",
      "msg": "Payment attestation has already been voided"
    },
    {
      "code": 6005,
      "name": "InvalidAmount",
      "msg": "Payment amount must be greater than zero"
    },
    {
      "code": 6006,
      "name": "InvalidProviderEnvironment",
      "msg": "Provider environment is invalid"
    }
  ],
  "types": [
    {
      "name": "AttestPaymentParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "order_id_hash",
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
            "name": "tier",
            "type": "pubkey"
          },
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
            "name": "recipient_wallet",
            "type": "pubkey"
          },
          {
            "name": "amount_smallest_unit",
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
            "name": "provider_reference_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "provider_environment",
            "type": "string"
          },
          {
            "name": "expires_at_slot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "PaymentAttestationAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "order_id_hash",
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
            "name": "tier",
            "type": "pubkey"
          },
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
            "name": "recipient_wallet",
            "type": "pubkey"
          },
          {
            "name": "amount_smallest_unit",
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
            "name": "provider_reference_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "provider_environment",
            "type": "string"
          },
          {
            "name": "attester",
            "type": "pubkey"
          },
          {
            "name": "expires_at_slot",
            "type": "u64"
          },
          {
            "name": "consumed",
            "type": "bool"
          },
          {
            "name": "consumed_at_slot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "voided",
            "type": "bool"
          },
          {
            "name": "voided_at_slot",
            "type": {
              "option": "u64"
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
      "name": "PaymentAttestationConsumed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attestation",
            "type": "pubkey"
          },
          {
            "name": "consumer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "PaymentAttestationVoided",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attestation",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "PaymentAttested",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attestation",
            "type": "pubkey"
          },
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "tier",
            "type": "pubkey"
          },
          {
            "name": "recipient_wallet",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "PaymentConfigAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "trusted_attester",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
} as unknown as PaymentAttestation;
