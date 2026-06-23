import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Share2, QrCode } from 'lucide-react';

interface InviteLinkProps {
  communityId: string;
  communityName: string;
}

function buildInviteUrl(communityId: string): string {
  return `${window.location.origin}/join/${communityId}?ref=invite`;
}

const InviteLink: React.FC<InviteLinkProps> = ({ communityId, communityName }) => {
  const inviteUrl = buildInviteUrl(communityId);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteUrl)}`;

  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrError, setQrError] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function openQr() {
    window.open(qrSrc, '_blank', 'noopener,noreferrer');
  }

  function share() {
    if (navigator.share) {
      navigator.share({
        title: `Join ${communityName} on Baraza`,
        url: inviteUrl,
      }).catch(() => {});
    } else {
      copyLink();
    }
  }

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="baraza-card p-5 space-y-5">
      {/* Heading */}
      <div className="flex items-center gap-2">
        <QrCode className="w-4 h-4 text-primary" />
        <h3 className="font-display text-base font-semibold text-foreground">
          Invite to {communityName}
        </h3>
      </div>

      {/* QR code */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-[180px] h-[180px] rounded-xl overflow-hidden bg-surface border border-border flex items-center justify-center">
          {!qrLoaded && !qrError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          {qrError ? (
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <QrCode className="w-8 h-8 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">QR requires internet</p>
            </div>
          ) : (
            <img
              src={qrSrc}
              alt={`QR code for joining ${communityName}`}
              width={180}
              height={180}
              className={`rounded-lg transition-opacity duration-300 ${qrLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setQrLoaded(true)}
              onError={() => { setQrError(true); setQrLoaded(false); }}
            />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">QR code requires an internet connection</p>
      </div>

      {/* Invite URL */}
      <div className="rounded-xl border border-border bg-surface p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Invite link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs text-foreground font-mono break-all leading-relaxed">
            {inviteUrl}
          </code>
          <button
            type="button"
            onClick={copyLink}
            title="Copy link"
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={share}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
        >
          {canShare ? (
            <>
              <Share2 className="w-4 h-4" />
              Share
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy link
            </>
          )}
        </button>
        {!qrError && (
          <button
            type="button"
            onClick={openQr}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Download QR
          </button>
        )}
      </div>
    </div>
  );
};

export default InviteLink;
