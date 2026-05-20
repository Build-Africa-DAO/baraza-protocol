// IDL for the governance Anchor program.
// Generated source: programs/governance/src/lib.rs
// Program ID: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
//
// Replace this file with `target/types/governance.ts` after `anchor build`.

export type Governance = {
  version: '0.1.0';
  name: 'governance';
  instructions: [
    {
      name: 'initializeConfig';
      accounts: [
        { name: 'community'; isMut: false; isSigner: false },
        { name: 'config'; isMut: true; isSigner: false },
        { name: 'admin'; isMut: true; isSigner: true },
        { name: 'systemProgram'; isMut: false; isSigner: false },
      ];
      args: [{ name: 'params'; type: { defined: 'InitializeConfigParams' } }];
    },
    {
      name: 'createProposal';
      accounts: [
        { name: 'community'; isMut: false; isSigner: false },
        { name: 'config'; isMut: false; isSigner: false },
        { name: 'creatorMember'; isMut: false; isSigner: false },
        { name: 'proposal'; isMut: true; isSigner: false },
        { name: 'creator'; isMut: true; isSigner: true },
        { name: 'systemProgram'; isMut: false; isSigner: false },
      ];
      args: [
        { name: 'proposalId'; type: 'u64' },
        { name: 'kind'; type: { defined: 'ProposalKind' } },
        { name: 'metadataUri'; type: 'string' },
      ];
    },
    {
      name: 'activateProposal';
      accounts: [
        { name: 'config'; isMut: false; isSigner: false },
        { name: 'proposal'; isMut: true; isSigner: false },
        { name: 'admin'; isMut: false; isSigner: true },
      ];
      args: [
        { name: 'totalEligibleWeight'; type: 'u64' },
        { name: 'totalEligibleMembers'; type: 'u32' },
      ];
    },
    {
      name: 'castVote';
      accounts: [
        { name: 'proposal'; isMut: true; isSigner: false },
        { name: 'voterMember'; isMut: false; isSigner: false },
        { name: 'receipt'; isMut: true; isSigner: false },
        { name: 'voter'; isMut: true; isSigner: true },
        { name: 'systemProgram'; isMut: false; isSigner: false },
      ];
      args: [
        { name: 'support'; type: { defined: 'VoteSupport' } },
        { name: 'reasonUri'; type: { option: 'string' } },
      ];
    },
    {
      name: 'finalizeProposal';
      accounts: [
        { name: 'config'; isMut: false; isSigner: false },
        { name: 'proposal'; isMut: true; isSigner: false },
      ];
      args: [];
    },
    {
      name: 'queueProposal';
      accounts: [
        { name: 'config'; isMut: false; isSigner: false },
        { name: 'proposal'; isMut: true; isSigner: false },
      ];
      args: [];
    },
    {
      name: 'cancelProposal';
      accounts: [
        { name: 'config'; isMut: false; isSigner: false },
        { name: 'proposal'; isMut: true; isSigner: false },
        { name: 'creatorMember'; isMut: false; isSigner: false },
        { name: 'canceler'; isMut: false; isSigner: true },
      ];
      args: [];
    },
    {
      name: 'vetoProposal';
      accounts: [
        { name: 'config'; isMut: false; isSigner: false },
        { name: 'proposal'; isMut: true; isSigner: false },
        { name: 'vetoer'; isMut: false; isSigner: true },
      ];
      args: [];
    },
  ];
  accounts: [
    {
      name: 'CommunityConfigAccount';
      type: {
        kind: 'struct';
        fields: [
          { name: 'community'; type: 'publicKey' },
          { name: 'votingDelaySlots'; type: 'u64' },
          { name: 'votingPeriodSlots'; type: 'u64' },
          { name: 'timelockDelaySlots'; type: 'u64' },
          { name: 'gracePeriodSlots'; type: 'u64' },
          { name: 'quorumBps'; type: 'u16' },
          { name: 'approvalThresholdBps'; type: 'u16' },
          { name: 'proposalThresholdWeight'; type: 'u64' },
          { name: 'vetoerAuthority'; type: { option: 'publicKey' } },
          { name: 'adminAuthority'; type: 'publicKey' },
          { name: 'paused'; type: 'bool' },
          { name: 'bump'; type: 'u8' },
        ];
      };
    },
    {
      name: 'ProposalAccount';
      type: {
        kind: 'struct';
        fields: [
          { name: 'community'; type: 'publicKey' },
          { name: 'proposalId'; type: 'u64' },
          { name: 'creatorMember'; type: 'publicKey' },
          { name: 'kind'; type: { defined: 'ProposalKind' } },
          { name: 'metadataUri'; type: 'string' },
          { name: 'status'; type: { defined: 'ProposalStatus' } },
          { name: 'createdAtSlot'; type: 'u64' },
          { name: 'votingStartsAtSlot'; type: 'u64' },
          { name: 'votingEndsAtSlot'; type: 'u64' },
          { name: 'etaSlot'; type: { option: 'u64' } },
          { name: 'executedAtSlot'; type: { option: 'u64' } },
          { name: 'canceledAtSlot'; type: { option: 'u64' } },
          { name: 'vetoedAtSlot'; type: { option: 'u64' } },
          { name: 'snapshotSlot'; type: 'u64' },
          { name: 'eligibleMemberCount'; type: 'u32' },
          { name: 'eligibleVotingWeight'; type: 'u64' },
          { name: 'quorumRequired'; type: 'u64' },
          { name: 'forWeight'; type: 'u64' },
          { name: 'againstWeight'; type: 'u64' },
          { name: 'abstainWeight'; type: 'u64' },
          { name: 'voterCount'; type: 'u32' },
          { name: 'bump'; type: 'u8' },
        ];
      };
    },
    {
      name: 'VoteReceiptAccount';
      type: {
        kind: 'struct';
        fields: [
          { name: 'proposal'; type: 'publicKey' },
          { name: 'voterMember'; type: 'publicKey' },
          { name: 'voterWallet'; type: 'publicKey' },
          { name: 'support'; type: { defined: 'VoteSupport' } },
          { name: 'weight'; type: 'u64' },
          { name: 'castAtSlot'; type: 'u64' },
          { name: 'reasonUri'; type: { option: 'string' } },
          { name: 'bump'; type: 'u8' },
        ];
      };
    },
  ];
  types: [
    {
      name: 'InitializeConfigParams';
      type: {
        kind: 'struct';
        fields: [
          { name: 'votingDelaySlots'; type: 'u64' },
          { name: 'votingPeriodSlots'; type: 'u64' },
          { name: 'timelockDelaySlots'; type: 'u64' },
          { name: 'gracePeriodSlots'; type: 'u64' },
          { name: 'quorumBps'; type: 'u16' },
          { name: 'approvalThresholdBps'; type: 'u16' },
          { name: 'proposalThresholdWeight'; type: 'u64' },
          { name: 'vetoerAuthority'; type: { option: 'publicKey' } },
        ];
      };
    },
    {
      name: 'ProposalKind';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'TreasuryRelease';
            fields: [
              { name: 'recipient'; type: 'publicKey' },
              { name: 'amount'; type: 'u64' },
              { name: 'tokenMint'; type: { option: 'publicKey' } },
              { name: 'purposeTag'; type: 'u8' },
            ];
          },
          {
            name: 'RuleChange';
            fields: [
              { name: 'targetField'; type: { defined: 'ConfigField' } },
              { name: 'newValueRaw'; type: { array: ['u8', 32] } },
            ];
          },
          {
            name: 'MembershipAction';
            fields: [
              { name: 'targetMember'; type: 'publicKey' },
              { name: 'action'; type: { defined: 'MemberActionKind' } },
            ];
          },
          { name: 'Text'; fields: [] },
        ];
      };
    },
    {
      name: 'ProposalStatus';
      type: {
        kind: 'enum';
        variants: [
          { name: 'Pending' },
          { name: 'Active' },
          { name: 'Defeated' },
          { name: 'Succeeded' },
          { name: 'Queued' },
          { name: 'Executed' },
          { name: 'Expired' },
          { name: 'Canceled' },
          { name: 'Vetoed' },
        ];
      };
    },
    {
      name: 'VoteSupport';
      type: {
        kind: 'enum';
        variants: [{ name: 'Against' }, { name: 'For' }, { name: 'Abstain' }];
      };
    },
    {
      name: 'ConfigField';
      type: {
        kind: 'enum';
        variants: [
          { name: 'VotingDelay' },
          { name: 'VotingPeriod' },
          { name: 'TimelockDelay' },
          { name: 'GracePeriod' },
          { name: 'QuorumBps' },
          { name: 'ApprovalThresholdBps' },
          { name: 'ProposalThresholdWeight' },
          { name: 'VetoerAuthority' },
        ];
      };
    },
    {
      name: 'MemberActionKind';
      type: {
        kind: 'enum';
        variants: [{ name: 'Suspend' }, { name: 'Reinstate' }, { name: 'Revoke' }];
      };
    },
  ];
  errors: [
    { code: 6000; name: 'ProgramPaused'; msg: 'Program is paused' },
    { code: 6001; name: 'MetadataUriTooLong'; msg: 'Metadata URI exceeds maximum length' },
    { code: 6002; name: 'InvalidProposalPayload'; msg: 'Proposal payload is invalid' },
    { code: 6003; name: 'MemberNotActive'; msg: 'Member is not active' },
    { code: 6004; name: 'MemberMismatch'; msg: 'Member does not match community or wallet' },
    { code: 6005; name: 'ProposalThresholdNotMet'; msg: 'Below proposal threshold weight' },
    { code: 6006; name: 'InvalidStateTransition'; msg: 'Invalid proposal state transition' },
    { code: 6007; name: 'TooEarly'; msg: 'Action is too early' },
    { code: 6008; name: 'OutsideVotingWindow'; msg: 'Outside the voting window' },
    { code: 6009; name: 'ProposalNotActive'; msg: 'Proposal is not active' },
    { code: 6010; name: 'ZeroWeightVote'; msg: 'Voter has zero voting weight' },
    { code: 6011; name: 'Unauthorized'; msg: 'Caller is not authorized' },
    { code: 6012; name: 'CommunityMismatch'; msg: 'Community mismatch' },
    { code: 6013; name: 'ParamOutOfBounds'; msg: 'Parameter out of allowed bounds' },
    { code: 6014; name: 'VetoNotConfigured'; msg: 'No vetoer configured' },
    { code: 6015; name: 'MissingEta'; msg: 'ETA slot not set' },
    { code: 6016; name: 'TimelockNotElapsed'; msg: 'Timelock has not elapsed' },
    { code: 6017; name: 'GraceExpired'; msg: 'Grace period has expired' },
    { code: 6018; name: 'Overflow'; msg: 'Arithmetic overflow' },
  ];
};

export const IDL: Governance = {
  version: '0.1.0',
  name: 'governance',
  instructions: [
    {
      name: 'initializeConfig',
      accounts: [
        { name: 'community', isMut: false, isSigner: false },
        { name: 'config', isMut: true, isSigner: false },
        { name: 'admin', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [{ name: 'params', type: { defined: 'InitializeConfigParams' } }],
    },
    {
      name: 'createProposal',
      accounts: [
        { name: 'community', isMut: false, isSigner: false },
        { name: 'config', isMut: false, isSigner: false },
        { name: 'creatorMember', isMut: false, isSigner: false },
        { name: 'proposal', isMut: true, isSigner: false },
        { name: 'creator', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'proposalId', type: 'u64' },
        { name: 'kind', type: { defined: 'ProposalKind' } },
        { name: 'metadataUri', type: 'string' },
      ],
    },
    {
      name: 'activateProposal',
      accounts: [
        { name: 'config', isMut: false, isSigner: false },
        { name: 'proposal', isMut: true, isSigner: false },
        { name: 'admin', isMut: false, isSigner: true },
      ],
      args: [
        { name: 'totalEligibleWeight', type: 'u64' },
        { name: 'totalEligibleMembers', type: 'u32' },
      ],
    },
    {
      name: 'castVote',
      accounts: [
        { name: 'proposal', isMut: true, isSigner: false },
        { name: 'voterMember', isMut: false, isSigner: false },
        { name: 'receipt', isMut: true, isSigner: false },
        { name: 'voter', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'support', type: { defined: 'VoteSupport' } },
        { name: 'reasonUri', type: { option: 'string' } },
      ],
    },
    {
      name: 'finalizeProposal',
      accounts: [
        { name: 'config', isMut: false, isSigner: false },
        { name: 'proposal', isMut: true, isSigner: false },
      ],
      args: [],
    },
    {
      name: 'queueProposal',
      accounts: [
        { name: 'config', isMut: false, isSigner: false },
        { name: 'proposal', isMut: true, isSigner: false },
      ],
      args: [],
    },
    {
      name: 'cancelProposal',
      accounts: [
        { name: 'config', isMut: false, isSigner: false },
        { name: 'proposal', isMut: true, isSigner: false },
        { name: 'creatorMember', isMut: false, isSigner: false },
        { name: 'canceler', isMut: false, isSigner: true },
      ],
      args: [],
    },
    {
      name: 'vetoProposal',
      accounts: [
        { name: 'config', isMut: false, isSigner: false },
        { name: 'proposal', isMut: true, isSigner: false },
        { name: 'vetoer', isMut: false, isSigner: true },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'CommunityConfigAccount',
      type: {
        kind: 'struct',
        fields: [
          { name: 'community', type: 'publicKey' },
          { name: 'votingDelaySlots', type: 'u64' },
          { name: 'votingPeriodSlots', type: 'u64' },
          { name: 'timelockDelaySlots', type: 'u64' },
          { name: 'gracePeriodSlots', type: 'u64' },
          { name: 'quorumBps', type: 'u16' },
          { name: 'approvalThresholdBps', type: 'u16' },
          { name: 'proposalThresholdWeight', type: 'u64' },
          { name: 'vetoerAuthority', type: { option: 'publicKey' } },
          { name: 'adminAuthority', type: 'publicKey' },
          { name: 'paused', type: 'bool' },
          { name: 'bump', type: 'u8' },
        ],
      },
    },
    {
      name: 'ProposalAccount',
      type: {
        kind: 'struct',
        fields: [
          { name: 'community', type: 'publicKey' },
          { name: 'proposalId', type: 'u64' },
          { name: 'creatorMember', type: 'publicKey' },
          { name: 'kind', type: { defined: 'ProposalKind' } },
          { name: 'metadataUri', type: 'string' },
          { name: 'status', type: { defined: 'ProposalStatus' } },
          { name: 'createdAtSlot', type: 'u64' },
          { name: 'votingStartsAtSlot', type: 'u64' },
          { name: 'votingEndsAtSlot', type: 'u64' },
          { name: 'etaSlot', type: { option: 'u64' } },
          { name: 'executedAtSlot', type: { option: 'u64' } },
          { name: 'canceledAtSlot', type: { option: 'u64' } },
          { name: 'vetoedAtSlot', type: { option: 'u64' } },
          { name: 'snapshotSlot', type: 'u64' },
          { name: 'eligibleMemberCount', type: 'u32' },
          { name: 'eligibleVotingWeight', type: 'u64' },
          { name: 'quorumRequired', type: 'u64' },
          { name: 'forWeight', type: 'u64' },
          { name: 'againstWeight', type: 'u64' },
          { name: 'abstainWeight', type: 'u64' },
          { name: 'voterCount', type: 'u32' },
          { name: 'bump', type: 'u8' },
        ],
      },
    },
    {
      name: 'VoteReceiptAccount',
      type: {
        kind: 'struct',
        fields: [
          { name: 'proposal', type: 'publicKey' },
          { name: 'voterMember', type: 'publicKey' },
          { name: 'voterWallet', type: 'publicKey' },
          { name: 'support', type: { defined: 'VoteSupport' } },
          { name: 'weight', type: 'u64' },
          { name: 'castAtSlot', type: 'u64' },
          { name: 'reasonUri', type: { option: 'string' } },
          { name: 'bump', type: 'u8' },
        ],
      },
    },
  ],
  types: [
    {
      name: 'InitializeConfigParams',
      type: {
        kind: 'struct',
        fields: [
          { name: 'votingDelaySlots', type: 'u64' },
          { name: 'votingPeriodSlots', type: 'u64' },
          { name: 'timelockDelaySlots', type: 'u64' },
          { name: 'gracePeriodSlots', type: 'u64' },
          { name: 'quorumBps', type: 'u16' },
          { name: 'approvalThresholdBps', type: 'u16' },
          { name: 'proposalThresholdWeight', type: 'u64' },
          { name: 'vetoerAuthority', type: { option: 'publicKey' } },
        ],
      },
    },
    {
      name: 'ProposalKind',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'TreasuryRelease',
            fields: [
              { name: 'recipient', type: 'publicKey' },
              { name: 'amount', type: 'u64' },
              { name: 'tokenMint', type: { option: 'publicKey' } },
              { name: 'purposeTag', type: 'u8' },
            ],
          },
          {
            name: 'RuleChange',
            fields: [
              { name: 'targetField', type: { defined: 'ConfigField' } },
              { name: 'newValueRaw', type: { array: ['u8', 32] } },
            ],
          },
          {
            name: 'MembershipAction',
            fields: [
              { name: 'targetMember', type: 'publicKey' },
              { name: 'action', type: { defined: 'MemberActionKind' } },
            ],
          },
          { name: 'Text', fields: [] },
        ],
      },
    },
    {
      name: 'ProposalStatus',
      type: {
        kind: 'enum',
        variants: [
          { name: 'Pending' },
          { name: 'Active' },
          { name: 'Defeated' },
          { name: 'Succeeded' },
          { name: 'Queued' },
          { name: 'Executed' },
          { name: 'Expired' },
          { name: 'Canceled' },
          { name: 'Vetoed' },
        ],
      },
    },
    {
      name: 'VoteSupport',
      type: {
        kind: 'enum',
        variants: [{ name: 'Against' }, { name: 'For' }, { name: 'Abstain' }],
      },
    },
    {
      name: 'ConfigField',
      type: {
        kind: 'enum',
        variants: [
          { name: 'VotingDelay' },
          { name: 'VotingPeriod' },
          { name: 'TimelockDelay' },
          { name: 'GracePeriod' },
          { name: 'QuorumBps' },
          { name: 'ApprovalThresholdBps' },
          { name: 'ProposalThresholdWeight' },
          { name: 'VetoerAuthority' },
        ],
      },
    },
    {
      name: 'MemberActionKind',
      type: {
        kind: 'enum',
        variants: [{ name: 'Suspend' }, { name: 'Reinstate' }, { name: 'Revoke' }],
      },
    },
  ],
  errors: [
    { code: 6000, name: 'ProgramPaused', msg: 'Program is paused' },
    { code: 6001, name: 'MetadataUriTooLong', msg: 'Metadata URI exceeds maximum length' },
    { code: 6002, name: 'InvalidProposalPayload', msg: 'Proposal payload is invalid' },
    { code: 6003, name: 'MemberNotActive', msg: 'Member is not active' },
    { code: 6004, name: 'MemberMismatch', msg: 'Member does not match community or wallet' },
    { code: 6005, name: 'ProposalThresholdNotMet', msg: 'Below proposal threshold weight' },
    { code: 6006, name: 'InvalidStateTransition', msg: 'Invalid proposal state transition' },
    { code: 6007, name: 'TooEarly', msg: 'Action is too early' },
    { code: 6008, name: 'OutsideVotingWindow', msg: 'Outside the voting window' },
    { code: 6009, name: 'ProposalNotActive', msg: 'Proposal is not active' },
    { code: 6010, name: 'ZeroWeightVote', msg: 'Voter has zero voting weight' },
    { code: 6011, name: 'Unauthorized', msg: 'Caller is not authorized' },
    { code: 6012, name: 'CommunityMismatch', msg: 'Community mismatch' },
    { code: 6013, name: 'ParamOutOfBounds', msg: 'Parameter out of allowed bounds' },
    { code: 6014, name: 'VetoNotConfigured', msg: 'No vetoer configured' },
    { code: 6015, name: 'MissingEta', msg: 'ETA slot not set' },
    { code: 6016, name: 'TimelockNotElapsed', msg: 'Timelock has not elapsed' },
    { code: 6017, name: 'GraceExpired', msg: 'Grace period has expired' },
    { code: 6018, name: 'Overflow', msg: 'Arithmetic overflow' },
  ],
};
