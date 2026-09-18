// app/api/communities/logo.ts
// Production Community Logo Storage (POST/DELETE /api/communities/:id/logo)
// S&P 500 Enterprise Fintech Standard — Zero-Any TypeScript

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../_lib/supabase';
import { resolveCallerIdentity } from '../_lib/auth-session';
import { assertValidSlug } from '../_lib/validation';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB maximum

interface LogoPostJsonBody {
  communityId?: string;
  dataUrl?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, x-wallet-address, x-wallet-signature, x-wallet-message, x-test-wallet-address, x-test-privy-did, x-test-user-profile-id',
      },
    });
  }

  const identity = await resolveCallerIdentity(req, 'community-logo');
  if (!identity || (!identity.walletAddress && !identity.privyDid && !identity.userProfileId)) {
    return jsonResponse(
      { error: 'unauthorized', message: 'Authentication required via session token or Web3 wallet proof.' },
      { status: 401 },
    );
  }

  // Extract communityId from URL path or query params
  const url = new URL(req.url);
  let communityId = url.searchParams.get('communityId');

  // Match /api/communities/:id/logo pattern
  const pathMatch = url.pathname.match(/\/api\/communities\/([^/]+)\/logo/);
  if (pathMatch) {
    communityId = decodeURIComponent(pathMatch[1]);
  }

  // Fallback to body for POST if not in URL
  let parsedBody: LogoPostJsonBody | null = null;
  const contentTypeHeader = req.headers.get('content-type') || '';
  if (req.method === 'POST' && contentTypeHeader.includes('application/json')) {
    try {
      parsedBody = (await req.json()) as LogoPostJsonBody;
      if (!communityId && parsedBody.communityId) {
        communityId = parsedBody.communityId;
      }
    } catch {
      return jsonResponse({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
    }
  }

  if (!communityId) {
    return jsonResponse({ error: 'invalid_request', message: 'communityId parameter is required.' }, { status: 400 });
  }

  try {
    assertValidSlug(communityId, 'communityId');
  } catch (err: unknown) {
    return jsonResponse({ error: 'invalid_parameter', message: (err as Error).message }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 1. Verify community exists
  const { data: community, error: commErr } = await supabase
    .from('communities')
    .select('id, name')
    .eq('id', communityId)
    .maybeSingle();

  if (commErr || !community) {
    return jsonResponse({ error: 'not_found', message: 'Community not found.' }, { status: 404 });
  }

  // 2. Enforce Officer Authorization Gate
  let memberQuery = supabase.from('members').select('role, activation_status').eq('community_id', communityId);
  if (identity.walletAddress) {
    memberQuery = memberQuery.eq('wallet_address', identity.walletAddress);
  } else if (identity.privyDid) {
    memberQuery = memberQuery.eq('auth_user_id', identity.privyDid);
  } else if (identity.userProfileId) {
    memberQuery = memberQuery.or(`auth_user_id.eq.${identity.userProfileId},wallet_address.eq.${identity.userProfileId}`);
  }

  const { data: member } = await memberQuery.maybeSingle();
  if (!member || !['founder', 'admin', 'chairperson', 'treasurer', 'secretary'].includes(member.role)) {
    return jsonResponse(
      { error: 'forbidden', message: 'Only community officers can update or remove the group logo.' },
      { status: 403 },
    );
  }

  if (member.activation_status !== 'active') {
    return jsonResponse(
      { error: 'forbidden', message: 'Officer membership is suspended or pending activation.' },
      { status: 403 },
    );
  }

  // --- DELETE: Clear Community Logo ---
  if (req.method === 'DELETE') {
    await supabase.from('communities').update({ image_url: null }).eq('id', communityId);

    try {
      await supabase.storage.from('community-logos').remove([
        `${communityId}.jpg`,
        `${communityId}.png`,
        `${communityId}.webp`,
      ]);
    } catch {
      // Non-fatal
    }

    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // --- POST: Upload Community Logo ---
  if (req.method === 'POST') {
    let buffer: Uint8Array;
    let mimeType: string;

    if (parsedBody && parsedBody.dataUrl) {
      const match = parsedBody.dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        return jsonResponse(
          { error: 'invalid_image', message: 'dataUrl must be a valid base64 data URI.' },
          { status: 400 },
        );
      }
      mimeType = match[1].toLowerCase();
      try {
        const binaryStr = atob(match[2]);
        buffer = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          buffer[i] = binaryStr.charCodeAt(i);
        }
      } catch {
        return jsonResponse({ error: 'invalid_base64', message: 'Failed to decode base64 image data.' }, { status: 400 });
      }
    } else if (contentTypeHeader.includes('multipart/form-data')) {
      try {
        const formData = await req.formData();
        const file = formData.get('file');
        if (!file || !(file instanceof Blob)) {
          return jsonResponse({ error: 'invalid_file', message: 'Multipart file field is required.' }, { status: 400 });
        }
        mimeType = file.type.toLowerCase();
        const arrayBuf = await file.arrayBuffer();
        buffer = new Uint8Array(arrayBuf);
      } catch (err: unknown) {
        return jsonResponse(
          { error: 'form_data_error', message: (err as Error).message || 'Failed to parse multipart form data.' },
          { status: 400 },
        );
      }
    } else {
      return jsonResponse(
        { error: 'unsupported_media_type', message: 'Content-Type must be application/json or multipart/form-data.' },
        { status: 415 },
      );
    }

    const extension = ALLOWED_MIME_TYPES[mimeType];
    if (!extension) {
      return jsonResponse(
        {
          error: 'unsupported_image_type',
          message: `Supported formats are JPEG, PNG, and WebP. Received: ${mimeType}`,
        },
        { status: 400 },
      );
    }

    if (buffer.byteLength > MAX_FILE_SIZE) {
      return jsonResponse(
        {
          error: 'file_too_large',
          message: `Image exceeds maximum allowed size of 2 MB. Received: ${Math.round(buffer.byteLength / 1024)} KB.`,
        },
        { status: 400 },
      );
    }

    const fileName = `${communityId}.${extension}`;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    let publicUrl: string;

    try {
      const { error: uploadErr } = await supabase.storage
        .from('community-logos')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('community-logos').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      } else {
        publicUrl = `${supabaseUrl}/storage/v1/object/public/community-logos/${fileName}`;
      }
    } catch {
      publicUrl = `${supabaseUrl}/storage/v1/object/public/community-logos/${fileName}`;
    }

    // Update community table
    const { error: updateErr } = await supabase
      .from('communities')
      .update({ image_url: publicUrl })
      .eq('id', communityId);

    if (updateErr) {
      return jsonResponse({ error: 'database_error', message: updateErr.message }, { status: 500 });
    }

    return jsonResponse({
      ok: true,
      imageUrl: publicUrl,
    });
  }

  return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
}
