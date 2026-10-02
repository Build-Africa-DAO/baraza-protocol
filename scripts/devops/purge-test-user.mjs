import pg from 'pg';

const DB_PW = 'AShZA?hh!Qf9*L8';
const DB_URL = `postgresql://postgres.jwoibelpyvemhzazccym:${encodeURIComponent(DB_PW)}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`;
const pool = new pg.Pool({ connectionString: DB_URL });

async function purgeTestUser() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const targetDid = 'did:privy:cmur1l8y600970cl5edecb3vj';
    const targetCommId = '19e12764-5255-4a20-b1e8-4d8f16f2b8ab';

    console.log(`Starting purge for User ${targetDid} and Community ${targetCommId}...`);

    // 1. Delete invites
    const delInvites = await client.query('DELETE FROM public.community_invites WHERE community_id = $1', [targetCommId]);
    console.log('Deleted invites count:', delInvites.rowCount);

    // 2. Delete memberships
    const delMemberships = await client.query('DELETE FROM public.memberships WHERE community_id = $1 OR wallet_address = $2', [targetCommId, targetDid]);
    console.log('Deleted memberships count:', delMemberships.rowCount);

    // 3. Delete community FIRST so check_sole_admin_before_demotion can see community is gone
    const delComms = await client.query('DELETE FROM public.communities WHERE id = $1', [targetCommId]);
    console.log('Deleted communities count:', delComms.rowCount);

    // 4. Delete members
    const delMembers = await client.query('DELETE FROM public.members WHERE community_id = $1 OR wallet_address = $2', [targetCommId, targetDid]);
    console.log('Deleted members count:', delMembers.rowCount);

    // 5. Delete user profiles
    const delUsers = await client.query('DELETE FROM public.user_profiles WHERE privy_did = $1', [targetDid]);
    console.log('Deleted user profiles count:', delUsers.rowCount);

    await client.query('COMMIT');
    console.log('SUCCESS: All test user and community records purged cleanly.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('FAILED to purge records:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

purgeTestUser();
