import { Navigate, useLocation, useParams } from 'react-router-dom';

/**
 * Redirect helpers for the §13.25 legacy-URL table.
 *
 * These exist as components rather than a router-level rewrite because the
 * targets depend on `:id` and on the query string, and because every redirect
 * must be `replace` — a member who taps an old SMS link should not have to press
 * Back twice to leave the app.
 */

interface ParamRedirectProps {
  /** Builds the destination from the matched params and the current search string. */
  build: (params: Record<string, string | undefined>, search: string) => string;
}

export function ParamRedirect({ build }: ParamRedirectProps) {
  const params = useParams();
  const location = useLocation();
  return <Navigate to={build(params, location.search)} replace />;
}

/** `/dashboard/:id/treasury` → `/dashboard/:id/money` and friends. */
export function groupRedirect(section: string) {
  return <ParamRedirect build={(params) => `/dashboard/${params.id ?? ''}/${section}`} />;
}
