import { ArrowLeft, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ReferralProgress } from '@/components/ReferralProgress';
import { useSeo } from '@/lib/seo';

export default function ProfileInvites() {
  useSeo({
    title: 'Members you invited',
    description: 'Review the membership progress of people you invited to Baraza communities.',
    path: '/profile/invites',
    noIndex: true,
  });

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-2xl px-4">
          <Link to="/profile" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to profile
          </Link>
          <header className="mt-5 border-b border-border pb-6">
            <div className="flex items-center gap-3">
              <HeartHandshake className="h-6 w-6 text-primary" />
              <h1 className="font-display text-2xl font-bold">Members you invited</h1>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Follow each member’s first three contribution months and see when their membership is confirmed.</p>
          </header>
          <div className="py-6">
            <ReferralProgress className="p-5" />
          </div>
        </div>
      </section>
    </Layout>
  );
}
