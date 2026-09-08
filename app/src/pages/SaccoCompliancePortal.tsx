import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import PageLoader from '@/components/PageLoader';
import { StatusScreen } from '@/components/StatusPage';
import CommunityBanner from '@/components/CommunityBanner';
import { SaccoComplianceBadge, type SaccoLicenseUiStatus } from '@/components/SaccoComplianceBadge';
import { useCommunity } from '@/hooks/useCommunities';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';
import { useSeo } from '@/lib/seo';
import { sessionHeaders } from '@/lib/sessionHeaders';

const LICENSE_RE = /^(CS\/[0-9]{1,7}|SASRA\/(DT|NWDT)\/[0-9]{2,5}\/[0-9]{2,4})$/i;

interface ComplianceStatus {
  ok?: boolean;
  status?: SaccoLicenseUiStatus;
  licenseNumber?: string | null;
  expiresAt?: string | null;
  verifiedAt?: string | null;
}

export default function SaccoCompliancePortal() {
  const { id } = useParams<{ id: string }>();
  const { community, isLoading, error, reload } = useCommunity(id);
  const account = useAccount();
  const { toast } = useToast();

  useSeo({
    title: community ? `${community.name} SACCO compliance` : 'SACCO compliance',
    description: 'Statutory SACCO license status and officer submission.',
    path: id ? `/dashboard/${id}/compliance` : undefined,
    noIndex: true,
  });

  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/compliance/status?communityId=${encodeURIComponent(id)}`)
      .then(async (res) => {
        const data = (await res.json()) as ComplianceStatus;
        if (!cancelled) setStatus(data);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [id]);

  const licenseOk = LICENSE_RE.test(licenseNumber.trim());
  const urlOk = !certificateUrl || certificateUrl.startsWith('https://');
  const expiryOk = !expiresAt || new Date(expiresAt).getTime() > Date.now();
  const verified = status?.status === 'VERIFIED';

  async function handleSubmit() {
    if (!id || !licenseOk || !certificateUrl.startsWith('https://') || !expiryOk) return;
    setBusy(true);
    try {
      const headers = await sessionHeaders(account.getAccessToken);
      const res = await fetch('/api/compliance/sacco-license-submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          communityId: id,
          licenseNumber: licenseNumber.trim(),
          certificateUrl: certificateUrl.trim(),
          documentType: 'cooperative_registration',
          expiresAt: expiresAt || undefined,
          wallet: account.accountId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; status?: string };
      if (!res.ok) {
        toast({ title: 'Could not submit license', description: data.message ?? 'Check the registration number and HTTPS certificate URL.', variant: 'destructive' });
        return;
      }
      setStatus((prev) => ({ ...prev, status: (data.status as SaccoLicenseUiStatus) ?? 'PENDING_REVIEW', licenseNumber: licenseNumber.trim(), expiresAt }));
      toast({ title: 'License submitted', description: 'Under SASRA audit review.' });
    } finally {
      setBusy(false);
    }
  }

  const gate = { title: 'Sign in to manage SACCO compliance', description: 'Officers submit statutory registration from this page.' };

  if (isLoading) {
    return <Layout gate={gate}><PageLoader label="Loading compliance" /></Layout>;
  }
  if (!community) {
    if (error) return <StatusScreen kind="server" gate={gate} onRetry={() => void reload()} />;
    return <StatusScreen kind="community" gate={gate} />;
  }

  return (
    <Layout gate={gate}>
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <Link to={`/dashboard/${community.id}`} className="mb-6 inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Group dashboard
          </Link>
          <CommunityBanner type={community.type} className="mb-6 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <SaccoComplianceBadge
                type={community.type}
                status={status?.status ?? community.saccoLicenseStatus}
                licenseNumber={status?.licenseNumber}
                expiresAt={status?.expiresAt}
              />
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold">SACCO compliance</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {status?.licenseNumber ? `Registration ${status.licenseNumber}` : 'Submit a CS/ or SASRA license for statutory review.'}
            </p>
          </CommunityBanner>

          <div className="baraza-card space-y-4 p-5">
            <h2 className="font-display text-base font-semibold">Officer license submission</h2>
            <label className="block text-xs font-semibold">
              Cooperative / SASRA number
              <input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="CS/12345 or SASRA/DT/102/2021"
                className="mt-2 w-full rounded-lg border px-3 py-3 text-sm outline-none"
              />
            </label>
            {!licenseOk && licenseNumber && <p className="text-xs text-destructive">Use CS/12345 or SASRA/DT or SASRA/NWDT format.</p>}
            <label className="block text-xs font-semibold">
              Certificate file (PDF or PNG)
              <input
                type="file"
                accept=".pdf,.png,application/pdf,image/png"
                className="mt-2 w-full text-xs"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
              />
            </label>
            {fileName && <p className="text-[11px] text-muted-foreground">Selected {fileName}. Paste the public HTTPS URL below to submit.</p>}
            <label className="block text-xs font-semibold">
              Certificate URL (HTTPS)
              <input
                value={certificateUrl}
                onChange={(e) => setCertificateUrl(e.target.value)}
                placeholder="https://"
                className="mt-2 w-full rounded-lg border px-3 py-3 text-sm outline-none"
              />
            </label>
            {!urlOk && <p className="text-xs text-destructive">Certificate URL must be public HTTPS.</p>}
            <label className="block text-xs font-semibold">
              Expiration date
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-2 w-full rounded-lg border px-3 py-3 text-sm outline-none"
              />
            </label>
            {!expiryOk && <p className="text-xs text-destructive">Expiration must be in the future.</p>}
            <button
              type="button"
              disabled={busy || !licenseOk || !certificateUrl.startsWith('https://') || !expiryOk}
              onClick={() => void handleSubmit()}
              className="btn-warm w-full justify-center gap-2 py-3 text-sm"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit for SASRA review
            </button>
          </div>

          <div className="mt-4 rounded-lg border p-4">
            <p className="text-sm font-semibold">Peer lending and capital mobilization</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {verified
                ? 'This SACCO is verified. Lending controls can be enabled by officers.'
                : 'Peer lending and capital mobilization are restricted under SASRA 2020 Regulations until this SACCO verifies its statutory license.'}
            </p>
            <button
              type="button"
              disabled={!verified}
              title={!verified ? 'Peer lending and capital mobilization are restricted under SASRA 2020 Regulations until this SACCO verifies its statutory license.' : undefined}
              className="btn-wipe-outline mt-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              Open lending desk
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
