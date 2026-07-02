export interface MemberProfile {
  displayName: string;
  bio: string;
  avatarUrl: string;
  websiteUrl: string;
  xUrl: string;
  instagramUrl: string;
}

const STORAGE_PREFIX = 'baraza:member-profile:';

export function deriveMemberName(contact: string | null | undefined): string {
  if (!contact || contact.startsWith('+')) return 'Baraza member';

  const localPart = contact.split('@')[0] ?? '';
  const words = localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  return words.join(' ') || 'Baraza member';
}

export function createMemberProfile(contact?: string | null): MemberProfile {
  return {
    displayName: deriveMemberName(contact),
    bio: '',
    avatarUrl: '',
    websiteUrl: '',
    xUrl: '',
    instagramUrl: '',
  };
}

function normalizeUrl(value: unknown): string {
  const input = typeof value === 'string' ? value.trim() : '';
  if (!input) return '';
  if (/^data:image\/(jpeg|png|webp);base64,/i.test(input)) return input;

  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export function normalizeMemberProfile(
  value: Partial<MemberProfile>,
  contact?: string | null,
): MemberProfile {
  const fallback = createMemberProfile(contact);
  return {
    displayName: (typeof value.displayName === 'string' ? value.displayName.trim() : '').slice(0, 60)
      || fallback.displayName,
    bio: (typeof value.bio === 'string' ? value.bio.trim() : '').slice(0, 280),
    avatarUrl: normalizeUrl(value.avatarUrl),
    websiteUrl: normalizeUrl(value.websiteUrl),
    xUrl: normalizeUrl(value.xUrl),
    instagramUrl: normalizeUrl(value.instagramUrl),
  };
}

export function readMemberProfile(accountId: string, contact?: string | null): MemberProfile {
  if (typeof window === 'undefined') return createMemberProfile(contact);

  try {
    const saved = window.localStorage.getItem(`${STORAGE_PREFIX}${accountId}`);
    return saved
      ? normalizeMemberProfile(JSON.parse(saved) as Partial<MemberProfile>, contact)
      : createMemberProfile(contact);
  } catch {
    return createMemberProfile(contact);
  }
}

export function writeMemberProfile(accountId: string, profile: MemberProfile): MemberProfile {
  const normalized = normalizeMemberProfile(profile);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`${STORAGE_PREFIX}${accountId}`, JSON.stringify(normalized));
  }
  return normalized;
}

export async function prepareProfilePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('We could not read that image.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('We could not open that image.'));
    element.src = source;
  });

  const size = Math.min(512, Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('We could not prepare that image.');

  const crop = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - crop) / 2;
  const sourceY = (image.naturalHeight - crop) / 2;
  context.drawImage(image, sourceX, sourceY, crop, crop, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.84);
}
