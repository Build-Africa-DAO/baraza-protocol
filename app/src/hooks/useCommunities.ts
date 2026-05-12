import { useCallback, useEffect, useState } from 'react';
import { type Community } from '@/lib/constants';
import { getCommunity, listCommunities } from '@/lib/communities';

interface CommunityState {
  community: Community | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

interface CommunitiesState {
  communities: Community[];
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export function useCommunities(): CommunitiesState {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setCommunities(await listCommunities());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load communities'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { communities, isLoading, error, reload };
}

export function useCommunity(id: string | undefined): CommunityState {
  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!id) {
      setCommunity(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setCommunity(await getCommunity(id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load community'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { community, isLoading, error, reload };
}
