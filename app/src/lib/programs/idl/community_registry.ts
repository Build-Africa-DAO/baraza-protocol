// IDL for the community_registry Anchor program.
// Generated source: programs/community_registry/src/lib.rs
// Program ID: CmnZpkH1Y9d5oh4PNqRTYAyMRhFqLkXq2fJh6cN6jPbm
//
// Replace this file with `target/types/community_registry.ts` after `anchor build`.

export type CommunityRegistry = {
  version: '0.1.0';
  name: 'community_registry';
  instructions: [
    {
      name: 'createCommunity';
      accounts: [
        { name: 'community'; isMut: true; isSigner: false },
        { name: 'admin'; isMut: true; isSigner: true },
        { name: 'systemProgram'; isMut: false; isSigner: false },
      ];
      args: [
        { name: 'slug'; type: 'string' },
        { name: 'name'; type: 'string' },
        { name: 'metadataUri'; type: 'string' },
      ];
    },
    {
      name: 'updateMetadata';
      accounts: [
        { name: 'community'; isMut: true; isSigner: false },
        { name: 'admin'; isMut: false; isSigner: true },
      ];
      args: [
        { name: 'newName'; type: { option: 'string' } },
        { name: 'newMetadataUri'; type: { option: 'string' } },
      ];
    },
    {
      name: 'nominateAdmin';
      accounts: [
        { name: 'community'; isMut: true; isSigner: false },
        { name: 'admin'; isMut: false; isSigner: true },
      ];
      args: [{ name: 'newAdmin'; type: 'publicKey' }];
    },
    {
      name: 'acceptAdmin';
      accounts: [
        { name: 'community'; isMut: true; isSigner: false },
        { name: 'nominee'; isMut: false; isSigner: true },
      ];
      args: [];
    },
    {
      name: 'archiveCommunity';
      accounts: [
        { name: 'community'; isMut: true; isSigner: false },
        { name: 'admin'; isMut: false; isSigner: true },
      ];
      args: [];
    },
  ];
  accounts: [
    {
      name: 'CommunityAccount';
      type: {
        kind: 'struct';
        fields: [
          { name: 'slug'; type: 'string' },
          { name: 'name'; type: 'string' },
          { name: 'metadataUri'; type: 'string' },
          { name: 'adminAuthority'; type: 'publicKey' },
          { name: 'pendingAdmin'; type: { option: 'publicKey' } },
          { name: 'status'; type: { defined: 'CommunityStatus' } },
          { name: 'createdAtSlot'; type: 'u64' },
          { name: 'memberCount'; type: 'u32' },
          { name: 'bump'; type: 'u8' },
        ];
      };
    },
  ];
  types: [
    {
      name: 'CommunityStatus';
      type: {
        kind: 'enum';
        variants: [{ name: 'Active' }, { name: 'Archived' }, { name: 'Suspended' }];
      };
    },
  ];
  errors: [
    { code: 6000; name: 'InvalidSlug'; msg: 'Community slug is invalid or too long' },
    { code: 6001; name: 'InvalidName'; msg: 'Community name is invalid or too long' },
    { code: 6002; name: 'MetadataUriTooLong'; msg: 'Metadata URI exceeds maximum length' },
    { code: 6003; name: 'Unauthorized'; msg: 'Caller is not authorized' },
    { code: 6004; name: 'CommunityNotActive'; msg: 'Community is not in Active status' },
    { code: 6005; name: 'NoPendingAdmin'; msg: 'No pending admin transfer' },
    { code: 6006; name: 'NotPendingAdmin'; msg: 'Caller is not the pending admin' },
  ];
};

export const IDL: CommunityRegistry = {
  version: '0.1.0',
  name: 'community_registry',
  instructions: [
    {
      name: 'createCommunity',
      accounts: [
        { name: 'community', isMut: true, isSigner: false },
        { name: 'admin', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'slug', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'metadataUri', type: 'string' },
      ],
    },
    {
      name: 'updateMetadata',
      accounts: [
        { name: 'community', isMut: true, isSigner: false },
        { name: 'admin', isMut: false, isSigner: true },
      ],
      args: [
        { name: 'newName', type: { option: 'string' } },
        { name: 'newMetadataUri', type: { option: 'string' } },
      ],
    },
    {
      name: 'nominateAdmin',
      accounts: [
        { name: 'community', isMut: true, isSigner: false },
        { name: 'admin', isMut: false, isSigner: true },
      ],
      args: [{ name: 'newAdmin', type: 'publicKey' }],
    },
    {
      name: 'acceptAdmin',
      accounts: [
        { name: 'community', isMut: true, isSigner: false },
        { name: 'nominee', isMut: false, isSigner: true },
      ],
      args: [],
    },
    {
      name: 'archiveCommunity',
      accounts: [
        { name: 'community', isMut: true, isSigner: false },
        { name: 'admin', isMut: false, isSigner: true },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'CommunityAccount',
      type: {
        kind: 'struct',
        fields: [
          { name: 'slug', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'metadataUri', type: 'string' },
          { name: 'adminAuthority', type: 'publicKey' },
          { name: 'pendingAdmin', type: { option: 'publicKey' } },
          { name: 'status', type: { defined: 'CommunityStatus' } },
          { name: 'createdAtSlot', type: 'u64' },
          { name: 'memberCount', type: 'u32' },
          { name: 'bump', type: 'u8' },
        ],
      },
    },
  ],
  types: [
    {
      name: 'CommunityStatus',
      type: {
        kind: 'enum',
        variants: [{ name: 'Active' }, { name: 'Archived' }, { name: 'Suspended' }],
      },
    },
  ],
  errors: [
    { code: 6000, name: 'InvalidSlug', msg: 'Community slug is invalid or too long' },
    { code: 6001, name: 'InvalidName', msg: 'Community name is invalid or too long' },
    { code: 6002, name: 'MetadataUriTooLong', msg: 'Metadata URI exceeds maximum length' },
    { code: 6003, name: 'Unauthorized', msg: 'Caller is not authorized' },
    { code: 6004, name: 'CommunityNotActive', msg: 'Community is not in Active status' },
    { code: 6005, name: 'NoPendingAdmin', msg: 'No pending admin transfer' },
    { code: 6006, name: 'NotPendingAdmin', msg: 'Caller is not the pending admin' },
  ],
};
