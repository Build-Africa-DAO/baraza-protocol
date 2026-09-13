import { Link } from 'react-router-dom';
import { Mail, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import { AskAkili } from '@/akili/AskAkili';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { useSeo } from '@/lib/seo';
import { SUPPORT_EMAIL } from '@/lib/support';

/**
 * §13.7 Help. Six practical answers as a native accordion (the landing FAQ
 * pattern), each with an Ask Akili chip for a longer answer, then one way to
 * reach a person.
 */
interface HelpTopic {
  id: string;
  question: string;
  answer: React.ReactNode;
  akili: string;
}

const TOPICS: HelpTopic[] = [
  {
    id: 'paying',
    question: 'How do I pay?',
    akili: 'How do I pay my dues, and what happens after I enter my M-Pesa PIN?',
    answer: (
      <>
        Open your group and tap <strong>Pay</strong>. Enter the phone number that holds your M-Pesa and confirm the amount. A
        payment only counts once the provider confirms it. Until then it shows as pending, and you should not pay twice.
      </>
    ),
  },
  {
    id: 'voting',
    question: 'How does voting work?',
    akili: 'Explain quorum and threshold in my group in plain words.',
    answer: (
      <>
        Spending needs a vote. Every decision has a quorum (how many members must vote) and a threshold (how many must agree).
        You either support or object. A vote that passes still has to be approved and sent by officers before money moves.
      </>
    ),
  },
  {
    id: 'starting',
    question: 'How do I start a group?',
    akili: 'What should I decide before starting a chama on Baraza?',
    answer: (
      <>
        Tap{' '}
        <Link to="/create" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Start a Group
        </Link>
        , choose the kind of group, set what you collect and how members vote, then invite people. You can change the
        description later; the voting rules lock once members join.
      </>
    ),
  },
  {
    id: 'records',
    question: 'What record does my group keep?',
    akili: 'What is in the group statement and who can see it?',
    answer: (
      <>
        Every contribution and every release is written to a shared record. Officers can download it as a CSV for any date
        range from Settings. Totals in the app come from that record; where a figure is not available yet, the app says so
        instead of estimating.
      </>
    ),
  },
  {
    id: 'lost-phone',
    question: 'I lost my phone. How do I get back in?',
    akili: 'I lost my phone. How do I get back into my Baraza groups?',
    answer: (
      <>
        Sign in again with the same phone number or email. Your membership belongs to your account, not the handset, and
        there is no recovery phrase to lose. If you no longer control that number, email us and an officer will confirm who
        you are.
      </>
    ),
  },
  {
    id: 'sacco',
    question: 'We are a SACCO. Is anything different?',
    akili: 'What changes for a SACCO on Baraza before the licence is verified?',
    answer: (
      <>
        Regulated lending and capital mobilisation stay off until an officer submits your statutory licence under Settings.
        Dues, voting and sends work the same way in the meantime.
      </>
    ),
  },
];

export default function Help() {
  useSeo({
    title: 'Help',
    description: 'How paying, voting, starting a group and group records work on Baraza.',
    path: '/help',
  });

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-3xl space-y-6 px-4">
          <PageHeader title="Help" subtitle="Short answers to the things people ask most. If yours is not here, email us." />

          <div className="divide-y divide-border border-y border-border">
            {TOPICS.map((topic) => (
              <details key={topic.id} id={topic.id} className="group scroll-mt-24 py-2">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-2 font-display text-base font-bold marker:content-none">
                  {topic.question}
                  <Plus className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-45" aria-hidden />
                </summary>
                <div className="space-y-3 pb-4">
                  <p className="text-sm leading-6 text-muted-foreground">{topic.answer}</p>
                  <AskAkili prompt={topic.akili} label="Ask Akili" variant="chip" />
                </div>
              </details>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild>
              <a href={`mailto:${SUPPORT_EMAIL}`}>
                <Mail className="h-4 w-4" aria-hidden />
                Email Help
              </a>
            </Button>
            <Link to="/status" className="inline-flex min-h-11 items-center text-sm font-semibold text-muted-foreground hover:text-foreground">
              System Status
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
