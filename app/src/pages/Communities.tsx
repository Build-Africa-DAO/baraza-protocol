import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import Layout from '@/components/Layout';
import CommunityCard, { BROWSE_KINDS, browseKindOf } from '@/components/CommunityCard';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/field';
import { FilterChips } from '@/components/ui/filter-chips';
import { InlineError } from '@/components/ui/inline-error';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonCard } from '@/components/ui/skeletons';
import { useCommunities } from '@/hooks/useCommunities';
import { useSeo } from '@/lib/seo';

/**
 * §13.8 Browse Groups. Search, five member-word kind filters, cards with only
 * what is real. No slideshow, no featured panel, no stock photos.
 */
type Kind = 'all' | (typeof BROWSE_KINDS)[number]['key'];

const SEARCH_DEBOUNCE_MS = 300;

export default function Communities() {
  useSeo({
    title: 'Browse groups',
    description: 'Find a chama, SACCO, cooperative, welfare or investment group on Baraza and see how to join.',
    path: '/groups',
  });
  const { communities, isLoading, error } = useCommunities();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  // The list filters on every keystroke; the URL (shareable by WhatsApp or SMS)
  // is written 300 ms after typing stops so history is not flooded.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      const current = params.get('q') ?? '';
      if (search.trim() === current.trim()) return;
      if (search.trim()) params.set('q', search.trim());
      else params.delete('q');
      setSearchParams(params, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search, searchParams, setSearchParams]);
  // `?kind=` is what the sidebar's Browse sub-pages link to; the chips write it too.
  const kindParam = searchParams.get('kind');
  const kind: Kind = kindParam && BROWSE_KINDS.some((item) => item.key === kindParam) ? (kindParam as Kind) : 'all';
  const setKind = (next: Kind) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('kind');
    else params.set('kind', next);
    setSearchParams(params, { replace: true });
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return communities.filter((community) => {
      const matchesSearch = !term || community.name.toLowerCase().includes(term) || community.description.toLowerCase().includes(term);
      const matchesKind = kind === 'all' || browseKindOf(community.type) === kind;
      return matchesSearch && matchesKind;
    });
  }, [communities, search, kind]);

  const options = [
    { key: 'all' as Kind, label: 'All', count: communities.length },
    ...BROWSE_KINDS.map((item) => ({ key: item.key as Kind, label: item.label })),
  ];

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-5xl space-y-6 px-4">
          <PageHeader
            title="Browse Groups"
            subtitle="Find a group to join, or see how others run theirs."
            action={
              <Button asChild variant="outline">
                <Link to="/create">Start a Group</Link>
              </Button>
            }
          />

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name"
                aria-label="Search groups"
                className="pl-9"
              />
            </div>
            <FilterChips options={options} value={kind} onChange={setKind} aria-label="Kind of group" className="justify-center" />
          </div>

          {error ? <InlineError message="We could not load groups right now. Check your connection and try again." /> : null}

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} rows={4} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title={search.trim() ? `No Group Called “${search.trim()}” Yet` : kind !== 'all' ? 'No Groups of This Kind Yet' : 'No Groups Yet'}
              body={search.trim() ? 'Ready to start yours? The name is filled in for you.' : kind !== 'all' ? 'Try another kind, or start your own group.' : 'Be the first: start a group and invite your members.'}
              primary={{ label: search.trim() ? 'Start This Group' : 'Start a Group', to: search.trim() ? `/create?name=${encodeURIComponent(search.trim())}` : '/create' }}
              secondary={search.trim() || kind !== 'all' ? { label: 'Clear Search', onClick: () => { setSearch(''); setKind('all'); } } : undefined}
            />
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground" aria-live="polite">
                Showing {filtered.length} of {communities.length} {communities.length === 1 ? 'group' : 'groups'}
              </p>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((community) => (
                  <li key={community.id} className="h-full">
                    <CommunityCard
                      id={community.id}
                      name={community.name}
                      type={community.type}
                      description={community.description}
                      membershipFee={community.membershipFee}
                      memberCount={community.memberCount}
                      image={community.image}
                      currency={community.currency}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          <Button asChild fullWidth className="md:hidden">
            <Link to="/create">Start a Group</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
