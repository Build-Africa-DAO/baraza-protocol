import { useState, useRef, type ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fileToOptimizedDataUrl } from '@/lib/imageUpload';

/**
 * One line in a list: a vote, a member, a movement, a group. Leading tile or
 * icon, title, one meta line, trailing amount and/or chip. The whole row is
 * the target when `to` or `onClick` is set. Replaces the card grids that made
 * every list a wall of equal boxes.
 */
export interface ListRowProps {
  title: string;
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  to?: string;
  onClick?: () => void;
  /** Spoken name for the row when the title alone is ambiguous. */
  'aria-label'?: string;
  className?: string;
}

export function ListRow({ title, meta, leading, trailing, to, onClick, className, ...rest }: ListRowProps) {
  const interactive = Boolean(to || onClick);
  const body = (
    <>
      {leading ? <span className="shrink-0">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        {meta ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{meta}</span> : null}
      </span>
      {trailing ? <span className="flex shrink-0 items-center gap-2">{trailing}</span> : null}
      {interactive ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
    </>
  );
  const classes = cn(
    'baraza-row flex min-h-14 w-full items-center gap-3 rounded-lg px-4 py-3 text-left',
    interactive && 'baraza-row-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    className,
  );

  if (to) {
    return (
      <Link to={to} aria-label={rest['aria-label']} className={classes}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={rest['aria-label']} className={classes}>
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
}

export interface InitialsTileProps {
  initials?: string;
  image?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onImageChange?: (dataUrl: string) => void;
  className?: string;
}

/** Bordered initials tile used as a row's leading element or a group/profile avatar. Supports custom logos/images with editable upload mode. */
export function InitialsTile({
  initials = 'GP',
  image,
  size = 'md',
  editable = false,
  onImageChange,
  className,
}: InitialsTileProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUrlLike = typeof initials === 'string' && (initials.startsWith('data:') || initials.startsWith('http') || initials.startsWith('/') || initials.startsWith('blob:'));
  const candidateImage = image || (isUrlLike ? initials : null);
  // A failed load only hides that one image. A new upload or a new URL gets a fresh try,
  // otherwise one broken picture would stop every later change from showing.
  useEffect(() => {
    setImgFailed(false);
  }, [candidateImage]);
  const showImage = candidateImage && !imgFailed;
  const letters = !isUrlLike && initials ? initials.slice(0, 2).toUpperCase() : 'GP';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      setImgFailed(false);
      onImageChange?.(dataUrl);
    } catch {
      // Ignore file read failure
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const tileContent = (
    <span
      className={cn(
        'baraza-tile relative grid shrink-0 place-items-center overflow-hidden rounded-md font-display font-bold text-foreground transition-transform',
        size === 'sm' && 'h-8 w-8 text-xs',
        size === 'md' && 'h-10 w-10 text-sm',
        size === 'lg' && 'h-14 w-14 text-lg',
        size === 'xl' && 'h-20 w-20 text-2xl',
        editable && 'cursor-pointer hover:opacity-90 group',
        className,
      )}
      aria-hidden={!editable}
    >
      {showImage ? (
        <img
          src={candidateImage}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        letters
      )}

      {editable && (
        <span
          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </span>
      )}
    </span>
  );

  if (editable) {
    return (
      <label
        className="relative inline-block cursor-pointer shrink-0"
        title="Click to change image"
        aria-label="Click to change image"
      >
        {tileContent}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    );
  }

  return tileContent;
}

export default ListRow;
