import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';

const requireFromRoot = createRequire(import.meta.url);
const anchor = requireFromRoot('@coral-xyz/anchor');
const { Connection, Keypair, PublicKey, SystemProgram } = requireFromRoot('@solana/web3.js');

const anchorToml = readFileSync(new URL('../Anchor.toml', import.meta.url), 'utf8');
const localnetMatch = anchorToml.match(/\[programs\.localnet\]([\s\S]*?)(?=\n\[|$)/);

if (!localnetMatch) {
  throw new Error('Missing [programs.localnet] in Anchor.toml');
}

const programs = [...localnetMatch[1].matchAll(/^\s*([a-z_]+)\s*=\s*"([^"]+)"/gm)]
  .map(([, name, id]) => [name, new PublicKey(id)]);
const programIds = Object.fromEntries(programs);

if (programs.length === 0) {
  throw new Error('No localnet programs configured in Anchor.toml');
}

function pda(seeds, programId) {
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

function u16Le(value) {
  const bytes = Buffer.alloc(2);
  bytes.writeUInt16LE(value);
  return bytes;
}

function u64Le(value) {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
}

function hash32(value) {
  return [...createHash('sha256').update(value).digest()];
}

function accountDiscriminator(accountName) {
  return [...createHash('sha256').update(`account:${accountName}`).digest().subarray(0, 8)];
}

function bytesEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function extractByteArray(source, constName) {
  const match = source.match(new RegExp(`pub const ${constName}: [^=]+ = (?:Pubkey::new_from_array\\()?\\[([\\s\\S]*?)\\]\\)?;`));
  if (!match) {
    throw new Error(`Missing ${constName} in source`);
  }
  return match[1]
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number);
}

function extractStructFields(source, structName) {
  const match = source.match(new RegExp(`pub struct ${structName} \\{([\\s\\S]*?)\\n\\}`));
  if (!match) {
    throw new Error(`Missing ${structName} struct in source`);
  }
  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('pub '))
    .map((line) => line.replace(/^pub\s+/, '').replace(/,$/, '').trim());
}

function assertDriftGuards() {
  const normalise = (s) => s.replace(/\r\n/g, '\n');
  const governanceSource = normalise(readFileSync(new URL('../programs/governance/src/lib.rs', import.meta.url), 'utf8'));
  const membershipSource = normalise(readFileSync(new URL('../programs/membership/src/lib.rs', import.meta.url), 'utf8'));
  const paymentSource = normalise(readFileSync(new URL('../programs/payment_attestation/src/lib.rs', import.meta.url), 'utf8'));
  const treasurySource = normalise(readFileSync(new URL('../programs/treasury_vault/src/lib.rs', import.meta.url), 'utf8'));

  const membershipProgramBytes = extractByteArray(governanceSource, 'MEMBERSHIP_PROGRAM_ID');
  if (!bytesEqual(membershipProgramBytes, [...programIds.membership.toBytes()])) {
    throw new Error('governance MEMBERSHIP_PROGRAM_ID drifted from Anchor.toml membership id');
  }

  const paymentProgramBytes = extractByteArray(membershipSource, 'PAYMENT_ATTESTATION_PROGRAM_ID');
  if (!bytesEqual(paymentProgramBytes, [...programIds.payment_attestation.toBytes()])) {
    throw new Error('membership PAYMENT_ATTESTATION_PROGRAM_ID drifted from Anchor.toml payment_attestation id');
  }

  const governanceProgramBytes = extractByteArray(treasurySource, 'GOVERNANCE_PROGRAM_ID');
  if (!bytesEqual(governanceProgramBytes, [...programIds.governance.toBytes()])) {
    throw new Error('treasury_vault GOVERNANCE_PROGRAM_ID drifted from Anchor.toml governance id');
  }

  const memberDiscriminator = extractByteArray(governanceSource, 'MEMBER_ACCOUNT_DISCRIMINATOR');
  if (!bytesEqual(memberDiscriminator, accountDiscriminator('MemberAccount'))) {
    throw new Error('governance MEMBER_ACCOUNT_DISCRIMINATOR drifted from Anchor account discriminator');
  }

  const paymentDiscriminator = extractByteArray(membershipSource, 'PAYMENT_ATTESTATION_DISCRIMINATOR');
  if (!bytesEqual(paymentDiscriminator, accountDiscriminator('PaymentAttestationAccount'))) {
    throw new Error('membership PAYMENT_ATTESTATION_DISCRIMINATOR drifted from Anchor account discriminator');
  }

  const proposalDiscriminator = extractByteArray(treasurySource, 'PROPOSAL_ACCOUNT_DISCRIMINATOR');
  if (!bytesEqual(proposalDiscriminator, accountDiscriminator('ProposalAccount'))) {
    throw new Error('treasury_vault PROPOSAL_ACCOUNT_DISCRIMINATOR drifted from Anchor account discriminator');
  }

  const governanceMemberFields = extractStructFields(governanceSource, 'MemberAccount');
  const membershipMemberFields = extractStructFields(membershipSource, 'MemberAccount');
  if (governanceMemberFields.join('\n') !== membershipMemberFields.join('\n')) {
    throw new Error('governance MemberAccount mirror drifted from membership MemberAccount');
  }

  const membershipPaymentFields = extractStructFields(membershipSource, 'PaymentAttestationAccount');
  const paymentFields = extractStructFields(paymentSource, 'PaymentAttestationAccount');
  if (membershipPaymentFields.join('\n') !== paymentFields.join('\n')) {
    throw new Error('membership PaymentAttestationAccount mirror drifted from payment_attestation account');
  }

  const governanceProposalFields = extractStructFields(governanceSource, 'ProposalAccount');
  const treasuryProposalFields = extractStructFields(treasurySource, 'ProposalAccount');
  if (governanceProposalFields.join('\n') !== treasuryProposalFields.join('\n')) {
    throw new Error('treasury_vault ProposalAccount mirror drifted from governance ProposalAccount');
  }
  if (!governanceSource.includes('treasury_vault::cpi::release_sol')) {
    throw new Error('governance execute_proposal no longer dispatches treasury releases by CPI');
  }
  if (!governanceSource.includes('prop.exit(ctx.program_id)?')) {
    throw new Error('governance treasury dispatch must persist Executed status before CPI');
  }
  if (!treasurySource.includes('ctx.accounts.executor.key(),\n            vault.release_authority')) {
    throw new Error('treasury releases must require the configured multisig release authority');
  }

  console.log('cross-program validation constants match source programs');
}

async function confirmAirdrop(publicKey, sol = 2) {
  const signature = await connection.requestAirdrop(publicKey, sol * anchor.web3.LAMPORTS_PER_SOL);
  const blockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({ signature, ...blockhash }, 'confirmed');
}

function errorDetails(error) {
  const anchorCode = error?.error?.errorCode?.code;
  const logs = Array.isArray(error?.logs) ? error.logs.join('\n') : '';
  const message = String(error?.message || error);
  return { anchorCode, text: `${anchorCode || ''}\n${message}\n${logs}` };
}

async function expectReject(label, expected, fn) {
  try {
    await fn();
  } catch (error) {
    const { anchorCode, text } = errorDetails(error);
    const expectedCodes = expected.codes || [];
    const expectedText = expected.text || [];
    const matchedCode = expectedCodes.includes(anchorCode);
    const matchedText = expectedText.some((fragment) => text.includes(fragment));
    if (matchedCode || matchedText) {
      console.log(`negative check: ${label} rejected as expected (${anchorCode || expectedText.find((fragment) => text.includes(fragment))})`);
      return;
    }
    throw new Error(`${label} rejected with unexpected error:\n${text}`);
  }
  throw new Error(`${label} should have rejected with ${[...(expected.codes || []), ...(expected.text || [])].join(' or ')}`);
}

async function ensurePaymentConfig() {
  const existing = await paymentAttestation.account.paymentConfigAccount.fetchNullable(paymentConfig);
  if (!existing) {
    await paymentAttestation.methods
      .initializeConfig(payer.publicKey)
      .accounts({
        config: paymentConfig,
        authority: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return;
  }

  if (!existing.trustedAttester.equals(payer.publicKey)) {
    throw new Error(`payment_config already exists with trusted_attester ${existing.trustedAttester.toBase58()}, expected ${payer.publicKey.toBase58()}`);
  }
  if (!existing.authority.equals(payer.publicKey)) {
    throw new Error(`payment_config already exists with authority ${existing.authority.toBase58()}, expected ${payer.publicKey.toBase58()}`);
  }
  console.log(`payment_config already initialized at ${paymentConfig.toBase58()}`);
}

assertDriftGuards();
if (process.env.ANCHOR_SMOKE_DRIFT_ONLY === '1' || process.argv.includes('--drift-only')) {
  console.log('drift-only smoke checks passed');
  process.exit(0);
}

const connection = new Connection(process.env.ANCHOR_PROVIDER_URL || 'http://127.0.0.1:8899', 'confirmed');

for (const [name, programId] of programs) {
  const account = await connection.getAccountInfo(programId);
  if (!account) {
    throw new Error(`${name} is not deployed at ${programId.toBase58()}`);
  }
  if (!account.executable) {
    throw new Error(`${name} is not executable at ${programId.toBase58()}`);
  }
  console.log(`${name}: ${programId.toBase58()} executable`);
}

const walletPath = process.env.ANCHOR_WALLET
  || `${homedir()}/.config/solana/id.json`;
if (!existsSync(walletPath)) {
  throw new Error(`Missing Anchor wallet at ${walletPath}`);
}

const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(walletPath, 'utf8'))));
const wallet = new anchor.Wallet(payer);
const provider = new anchor.AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
  preflightCommitment: 'confirmed',
});
anchor.setProvider(provider);

function loadProgram(idlName) {
  const idl = JSON.parse(readFileSync(new URL(`../target/idl/${idlName}.json`, import.meta.url), 'utf8'));
  return new anchor.Program(idl, provider);
}

const communityRegistry = loadProgram('community_registry');
const paymentAttestation = loadProgram('payment_attestation');
const membership = loadProgram('membership');
const governance = loadProgram('governance');
const treasuryVault = loadProgram('treasury_vault');

const runId = Date.now().toString(36);
const slug = `baraza-${runId}`;
const tierId = 1;
const proposalId = 1n;
const voter = Keypair.generate();
const pendingVoter = Keypair.generate();
const badSigner = Keypair.generate();
await confirmAirdrop(payer.publicKey);
await confirmAirdrop(voter.publicKey);
await confirmAirdrop(pendingVoter.publicKey);
await confirmAirdrop(badSigner.publicKey);

const community = pda(
  [Buffer.from('community'), Buffer.from(slug)],
  communityRegistry.programId,
);
const paymentConfig = pda(
  [Buffer.from('payment_config')],
  paymentAttestation.programId,
);
const tier = pda(
  [Buffer.from('membership_tier'), community.toBuffer(), u16Le(tierId)],
  membership.programId,
);
const memberIdHash = hash32(`member:${runId}`);
const userIdHash = hash32(`user:${runId}`);
const orderIdHash = hash32(`order:${runId}`);
const providerReferenceHash = hash32(`mpesa:${runId}`);
const pendingMemberIdHash = hash32(`member:pending:${runId}`);
const pendingUserIdHash = hash32(`user:pending:${runId}`);
const pendingOrderIdHash = hash32(`order:pending:${runId}`);
const unauthorizedOrderIdHash = hash32(`order:unauthorized:${runId}`);
const member = pda(
  [Buffer.from('member'), community.toBuffer(), Buffer.from(memberIdHash)],
  membership.programId,
);
const pendingMember = pda(
  [Buffer.from('member'), community.toBuffer(), Buffer.from(pendingMemberIdHash)],
  membership.programId,
);
const attestation = pda(
  [Buffer.from('payment'), Buffer.from(orderIdHash)],
  paymentAttestation.programId,
);
const unauthorizedAttestation = pda(
  [Buffer.from('payment'), Buffer.from(unauthorizedOrderIdHash)],
  paymentAttestation.programId,
);
const govConfig = pda(
  [Buffer.from('config'), community.toBuffer()],
  governance.programId,
);
const proposal = pda(
  [Buffer.from('proposal'), community.toBuffer(), u64Le(proposalId)],
  governance.programId,
);
const pendingMemberProposal = pda(
  [Buffer.from('proposal'), community.toBuffer(), u64Le(2n)],
  governance.programId,
);
const voteReceipt = pda(
  [Buffer.from('vote'), proposal.toBuffer(), member.toBuffer()],
  governance.programId,
);
const vault = pda(
  [Buffer.from('treasury'), community.toBuffer()],
  treasuryVault.programId,
);
const releaseReceipt = pda(
  [Buffer.from('release'), proposal.toBuffer()],
  treasuryVault.programId,
);

await communityRegistry.methods
  .createCommunity(slug, `Baraza ${runId}`, `ipfs://baraza/${runId}`)
  .accounts({
    community,
    admin: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

await ensurePaymentConfig();

await membership.methods
  .createTier({
    tierId,
    name: 'Member',
    descriptionUri: 'ipfs://tier/member',
    votingWeight: new anchor.BN(10),
    duesSmallestUnit: new anchor.BN(0),
    joinFeeSmallestUnit: new anchor.BN(1000),
    currencyCode: [...Buffer.from('KES')],
    maxSeats: 100,
  })
  .accounts({
    community,
    tier,
    admin: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

await membership.methods
  .registerMember({
    memberIdHash,
    userIdHash,
    paymentOrderIdHash: orderIdHash,
    expiresAtSlot: null,
    metadataUri: 'ipfs://member',
  })
  .accounts({
    community,
    tier,
    member,
    wallet: voter.publicKey,
    registrar: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

await membership.methods
  .registerMember({
    memberIdHash: pendingMemberIdHash,
    userIdHash: pendingUserIdHash,
    paymentOrderIdHash: pendingOrderIdHash,
    expiresAtSlot: null,
    metadataUri: 'ipfs://member/pending',
  })
  .accounts({
    community,
    tier,
    member: pendingMember,
    wallet: pendingVoter.publicKey,
    registrar: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

const currentSlot = await connection.getSlot('confirmed');
await expectReject('unauthorized payment attester', { codes: ['Unauthorized'] }, () => paymentAttestation.methods
  .attestPayment({
    orderIdHash: unauthorizedOrderIdHash,
    community,
    tier,
    memberIdHash,
    recipientWallet: voter.publicKey,
    amountSmallestUnit: new anchor.BN(1000),
    currencyCode: [...Buffer.from('KES')],
    providerReferenceHash: hash32(`mpesa:unauthorized:${runId}`),
    providerEnvironment: 'sandbox',
    expiresAtSlot: new anchor.BN(currentSlot + 10_000),
  })
  .accounts({
    config: paymentConfig,
    attestation: unauthorizedAttestation,
    attester: badSigner.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([badSigner])
  .rpc());

await paymentAttestation.methods
  .attestPayment({
    orderIdHash,
    community,
    tier,
    memberIdHash,
    recipientWallet: voter.publicKey,
    amountSmallestUnit: new anchor.BN(1000),
    currencyCode: [...Buffer.from('KES')],
    providerReferenceHash,
    providerEnvironment: 'sandbox',
    expiresAtSlot: new anchor.BN(currentSlot + 10_000),
  })
  .accounts({
    config: paymentConfig,
    attestation,
    attester: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

await paymentAttestation.methods
  .consumePaymentForMint()
  .accounts({
    config: paymentConfig,
    attestation,
    consumer: payer.publicKey,
  })
  .rpc();

await expectReject('mismatched payment attestation activation', { codes: ['PaymentAttestationMismatch'] }, () => membership.methods
  .activateMember(null, null)
  .accounts({
    member: pendingMember,
    tier,
    paymentAttestation: attestation,
    minter: payer.publicKey,
  })
  .rpc());

await membership.methods
  .activateMember(null, null)
  .accounts({
    member,
    tier,
    paymentAttestation: attestation,
    minter: payer.publicKey,
  })
  .rpc();

await governance.methods
  .initializeConfig({
    votingDelaySlots: new anchor.BN(0),
    votingPeriodSlots: new anchor.BN(108_000),
    timelockDelaySlots: new anchor.BN(0),
    gracePeriodSlots: new anchor.BN(216_000),
    quorumBps: 500,
    approvalThresholdBps: 5001,
    proposalThresholdWeight: new anchor.BN(1),
    vetoerAuthority: null,
  })
  .accounts({
    community,
    config: govConfig,
    admin: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

await expectReject('inactive member proposal creation', { codes: ['MemberNotActive'] }, () => governance.methods
  .createProposal(new anchor.BN(2), { text: {} }, 'ipfs://proposal/pending-member')
  .accounts({
    community,
    config: govConfig,
    creatorMember: pendingMember,
    proposal: pendingMemberProposal,
    creator: pendingVoter.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([pendingVoter])
  .rpc());

await governance.methods
  .createProposal(new anchor.BN(proposalId.toString()), { text: {} }, 'ipfs://proposal')
  .accounts({
    community,
    config: govConfig,
    creatorMember: member,
    proposal,
    creator: voter.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([voter])
  .rpc();

await expectReject('vote before proposal activation', { codes: ['ProposalNotActive'] }, () => governance.methods
  .castVote({ for: {} }, null)
  .accounts({
    proposal,
    voterMember: member,
    receipt: voteReceipt,
    voter: voter.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([voter])
  .rpc());

await expectReject('queue pending proposal', { codes: ['InvalidStateTransition'] }, () => governance.methods
  .queueProposal()
  .accounts({
    config: govConfig,
    proposal,
  })
  .rpc());

await governance.methods
  .activateProposal(new anchor.BN(10), 1)
  .accounts({
    config: govConfig,
    proposal,
    admin: payer.publicKey,
  })
  .rpc();

await expectReject('activate already active proposal', { codes: ['InvalidStateTransition'] }, () => governance.methods
  .activateProposal(new anchor.BN(10), 1)
  .accounts({
    config: govConfig,
    proposal,
    admin: payer.publicKey,
  })
  .rpc());

await governance.methods
  .castVote({ for: {} }, null)
  .accounts({
    proposal,
    voterMember: member,
    receipt: voteReceipt,
    voter: voter.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([voter])
  .rpc();

await expectReject('double voting', { text: ['already in use', 'account already in use', 'already been processed'] }, () => governance.methods
  .castVote({ against: {} }, null)
  .accounts({
    proposal,
    voterMember: member,
    receipt: voteReceipt,
    voter: voter.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([voter])
  .rpc());

await treasuryVault.methods
  .initializeVault()
  .accounts({
    community,
    vault,
    admin: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

await treasuryVault.methods
  .depositSol(new anchor.BN(50_000_000))
  .accounts({
    vault,
    depositor: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

await treasuryVault.methods
  .recordSplDeposit(Keypair.generate().publicKey, new anchor.BN(1000))
  .accounts({
    vault,
    depositor: payer.publicKey,
  })
  .rpc();

const recipient = Keypair.generate();
await expectReject('treasury release while withdrawals disabled', { codes: ['WithdrawalsDisabled'] }, () => treasuryVault.methods
  .releaseSol(new anchor.BN(10_000_000))
  .accounts({
    vault,
    proposal,
    releaseReceipt,
    recipient: recipient.publicKey,
    executor: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc());

await treasuryVault.methods
  .enableWithdrawals()
  .accounts({
    vault,
    admin: payer.publicKey,
  })
  .rpc();

await expectReject('treasury release from unauthorized executor', { codes: ['UnauthorizedReleaseAuthority'] }, () => treasuryVault.methods
  .releaseSol(new anchor.BN(10_000_000))
  .accounts({
    vault,
    proposal,
    releaseReceipt,
    recipient: recipient.publicKey,
    executor: badSigner.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([badSigner])
  .rpc());

await expectReject('treasury release without executed proposal', { codes: ['ProposalNotExecuted'] }, () => treasuryVault.methods
  .releaseSol(new anchor.BN(10_000_000))
  .accounts({
    vault,
    proposal,
    releaseReceipt,
    recipient: recipient.publicKey,
    executor: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc());

const communityAccount = await communityRegistry.account.communityAccount.fetch(community);
const memberAccount = await membership.account.memberAccount.fetch(member);
const proposalAccount = await governance.account.proposalAccount.fetch(proposal);
const receiptAccount = await governance.account.voteReceiptAccount.fetch(voteReceipt);
const vaultAccount = await treasuryVault.account.treasuryVaultAccount.fetch(vault);

if (communityAccount.slug !== slug) throw new Error('community slug mismatch');
if (!memberAccount.status.active) throw new Error('member was not activated');
if (!proposalAccount.status.active) throw new Error('proposal was not activated');
if (!proposalAccount.forWeight.eq(new anchor.BN(10))) throw new Error('proposal for_weight mismatch');
if (!receiptAccount.weight.eq(new anchor.BN(10))) throw new Error('vote receipt weight mismatch');
if (!vaultAccount.withdrawalsEnabled) throw new Error('vault withdrawals were not enabled');
if (!vaultAccount.totalSolDeposited.eq(new anchor.BN(50_000_000))) throw new Error('vault deposit total mismatch');
if (!vaultAccount.totalSolReleased.eq(new anchor.BN(0))) throw new Error('vault release total mismatch');
if (!vaultAccount.depositCount.eq(new anchor.BN(2))) throw new Error('vault deposit count mismatch');
if (!vaultAccount.releaseCount.eq(new anchor.BN(0))) throw new Error('vault release count mismatch');

console.log(`integration flow: community -> member activation -> proposal -> vote -> treasury proposal gate passed (${slug})`);
