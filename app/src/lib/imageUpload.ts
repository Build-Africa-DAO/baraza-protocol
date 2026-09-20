import { useCallback, useEffect, useState } from 'react';
import { patchUserProfile } from '@/lib/userProfile';

const USER_AVATAR_KEY = 'baraza.userAvatar.v1';
const COMMUNITY_IMAGE_PREFIX = 'baraza.communityImage.';

/**
 * Optimizes an uploaded image file into a lightweight base64 data URL
 * (max 400x400, JPEG 85% quality) to fit smoothly in storage and sync quickly.
 */
export async function fileToOptimizedDataUrl(file: File, maxDim = 400, quality = 0.85): Promise<string> {
  // If not an image or running in SSR, fallback to plain FileReader
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return fileToDataUrlFallback(file);
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        // Fallback to raw data URL if image parsing fails (e.g. SVG)
        resolve(reader.result as string);
      };
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // For transparent PNGs or SVGs, preserve PNG; otherwise convert to JPEG for compact size
          const outputType = file.type === 'image/png' || file.type === 'image/svg+xml' ? 'image/png' : 'image/jpeg';
          const optimized = canvas.toDataURL(outputType, quality);
          resolve(optimized);
        } catch {
          resolve(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function fileToDataUrlFallback(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// User Avatar Storage & Reactive Hook
// ---------------------------------------------------------------------------

export function getStoredUserAvatar(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(USER_AVATAR_KEY);
  } catch {
    return null;
  }
}

export function setStoredUserAvatar(avatarUrl: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (avatarUrl) {
      window.localStorage.setItem(USER_AVATAR_KEY, avatarUrl);
    } else {
      window.localStorage.removeItem(USER_AVATAR_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
  window.dispatchEvent(new CustomEvent('baraza:userAvatarChanged', { detail: avatarUrl }));
}

/**
 * Hook to read and update the current user's profile avatar.
 * Changes sync reactively across all listening components and persist to localStorage + backend.
 */
export function useUserAvatar(initialUrl?: string | null) {
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(() => {
    return getStoredUserAvatar() || initialUrl || null;
  });

  useEffect(() => {
    if (initialUrl && !getStoredUserAvatar()) {
      setAvatarUrlState(initialUrl);
    }
  }, [initialUrl]);

  useEffect(() => {
    const onAvatarChange = (event: Event) => {
      const customEvent = event as CustomEvent<string | null>;
      setAvatarUrlState(customEvent.detail ?? null);
    };

    window.addEventListener('baraza:userAvatarChanged', onAvatarChange);
    return () => {
      window.removeEventListener('baraza:userAvatarChanged', onAvatarChange);
    };
  }, []);

  const updateAvatar = useCallback((newUrl: string | null, getAccessToken?: () => Promise<string | null>) => {
    setAvatarUrlState(newUrl);
    setStoredUserAvatar(newUrl);

    // Also attempt backend profile patch asynchronously
    void patchUserProfile({ avatarUrl: newUrl ?? '' }, getAccessToken).catch(() => {
      // Backend may be offline or mock in dev mode; local cache already updated
    });
  }, []);

  return {
    avatarUrl,
    setAvatarUrl: updateAvatar,
    removeAvatar: useCallback((getAccessToken?: () => Promise<string | null>) => {
      updateAvatar(null, getAccessToken);
    }, [updateAvatar]),
  };
}

// ---------------------------------------------------------------------------
// Community / Chama Image Storage & Reactive Hook
// ---------------------------------------------------------------------------

export function getStoredCommunityImage(communityId: string | undefined): string | null {
  if (typeof window === 'undefined' || !communityId) return null;
  try {
    return window.localStorage.getItem(`${COMMUNITY_IMAGE_PREFIX}${communityId}`);
  } catch {
    return null;
  }
}

export function setStoredCommunityImage(communityId: string, imageUrl: string | null): void {
  if (typeof window === 'undefined' || !communityId) return;
  try {
    const key = `${COMMUNITY_IMAGE_PREFIX}${communityId}`;
    if (imageUrl) {
      window.localStorage.setItem(key, imageUrl);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage quota
  }
  window.dispatchEvent(
    new CustomEvent('baraza:communityUpdated', {
      detail: { id: communityId, image: imageUrl },
    }),
  );
}

/**
 * Hook to get and update a group's custom logo/image across the frontend.
 */
export function useCommunityImage(communityId: string | undefined, defaultImage?: string | null) {
  const [image, setImageState] = useState<string | null>(() => {
    return getStoredCommunityImage(communityId) || defaultImage || null;
  });

  useEffect(() => {
    const stored = getStoredCommunityImage(communityId);
    setImageState(stored || defaultImage || null);
  }, [communityId, defaultImage]);

  useEffect(() => {
    if (!communityId) return;

    const onCommunityUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string; image?: string | null }>;
      if (customEvent.detail?.id === communityId) {
        setImageState(customEvent.detail.image ?? null);
      }
    };

    window.addEventListener('baraza:communityUpdated', onCommunityUpdate);
    return () => {
      window.removeEventListener('baraza:communityUpdated', onCommunityUpdate);
    };
  }, [communityId]);

  const updateImage = useCallback(
    (newImage: string | null) => {
      if (!communityId) return;
      setImageState(newImage);
      setStoredCommunityImage(communityId, newImage);
    },
    [communityId],
  );

  return {
    image,
    setImage: updateImage,
    removeImage: useCallback(() => updateImage(null), [updateImage]),
  };
}
