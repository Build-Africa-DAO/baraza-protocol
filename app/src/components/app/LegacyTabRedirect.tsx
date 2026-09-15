import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { legacyTabDestination } from '@/lib/legacyRoutes';

/**
 * `/dashboard/:id?tab=governance` and its twelve siblings used to be the whole
 * member product. Those URLs are in people's browser history, in emails and in
 * WhatsApp threads, so they resolve to wherever that section lives now instead
 * of silently rendering the group home.
 */
export default function LegacyTabRedirect({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const destination = id ? legacyTabDestination(id, searchParams.get('tab')) : null;
  if (destination) return <Navigate to={destination} replace />;

  return <>{children}</>;
}
