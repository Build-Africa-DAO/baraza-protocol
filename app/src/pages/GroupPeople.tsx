import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { InviteSheet } from '@/components/app/InviteSheet';
import MemberDirectory from '@/components/community/MemberDirectory';
import { Button } from '@/components/ui/button';

/**
 * §13.17 People. The directory does the work; inviting is an officer action
 * behind a sheet, and it is the only place an invite link is made.
 */
export default function GroupPeople() {
  const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <GroupWorkspace title="People" subtitle="Who belongs to this group." hideBanner>
      {({ community, isOfficer }) => (
        <div className="space-y-5">
          {isOfficer ? (
            <>
              <div className="hidden justify-end sm:flex">
                <Button type="button" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="h-4 w-4" aria-hidden />
                  Invite People
                </Button>
              </div>
              <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} communityId={community.id} communityName={community.name} />
            </>
          ) : null}

          <MemberDirectory communityId={community.id} currency={community.currency} isOfficer={isOfficer} />

          {isOfficer ? (
            <Button type="button" fullWidth className="sm:hidden" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" aria-hidden />
              Invite People
            </Button>
          ) : null}
        </div>
      )}
    </GroupWorkspace>
  );
}
