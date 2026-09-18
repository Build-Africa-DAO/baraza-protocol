// app/api/user/avatar.ts
// Production User Profile Avatar Storage (POST /api/user/avatar, DELETE /api/user/avatar)
// S&P 500 Enterprise Fintech Standard — Zero-Any TypeScript

export const config = { runtime: 'nodejs' };

import { getSupabaseAdmin, jsonResponse } from '../_lib/supabase';
import { resolveCallerIdentity } from '../_lib/auth-session';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB maximum

interface AvatarPostJsonBody {
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

  const identity = await resolveCallerIdentity(req, 'user-avatar');
  if (!identity || (!identity.walletAddress && !identity.privyDid && !identity.userProfileId)) {
    return jsonResponse(
      { error: 'unauthorized', message: 'Authentication required via session token or Web3 wallet proof.' },
      { status: 401 },
    );
  }

  const userId = identity.userProfileId || identity.walletAddress || identity.privyDid;
  if (!userId) {
    return jsonResponse({ error: 'unauthorized', message: 'Caller identity not resolved.' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // --- DELETE: Clear Avatar ---
  if (req.method === 'DELETE') {
    let updateQuery = supabase.from('user_profiles').update({ avatar_url: '', updated_at: new Date().toISOString() });
    if (identity.userProfileId) {
      updateQuery = updateQuery.eq('id', identity.userProfileId);
    } else if (identity.walletAddress) {
      updateQuery = updateQuery.eq('wallet_address', identity.walletAddress);
    } else {
      updateQuery = updateQuery.eq('privy_did', identity.privyDid);
    }
    await updateQuery;

    // Attempt to remove from Supabase Storage
    try {
      const sanitizedId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
      await supabase.storage.from('avatars').remove([
        `${sanitizedId}.jpg`,
        `${sanitizedId}.png`,
        `${sanitizedId}.webp`,
      ]);
    } catch {
      // Non-fatal if storage cleanup fails
    }

    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // --- POST: Upload Avatar ---
  if (req.method === 'POST') {
    let buffer: Uint8Array;
    let mimeType = '';

    const contentTypeHeader = req.headers.get('content-type') || '';

    if (contentTypeHeader.includes('application/json')) {
      let body: AvatarPostJsonBody;
      try {
        body = (await req.json()) as AvatarPostJsonBody;
      } catch {
        return jsonResponse({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
      }

      if (!body.dataUrl || typeof body.dataUrl !== 'string') {
        return jsonResponse(
          { error: 'invalid_input', message: 'Field dataUrl is required.' },
          { status: 400 },
        );
      }

      const match = body.dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        return jsonResponse(
          { error: 'invalid_image', message: 'dataUrl must be a valid base64 data URI (e.g. data:image/png;base64,...).' },
          { status: 400 },
        );
      }

      mimeType = match[1].toLowerCase();
      const base64Data = match[2];
      try {
        const binaryStr = atob(base64Data);
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
          message: `Supported image formats are JPEG, PNG, and WebP. Received: ${mimeType}`,
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

    const sanitizedId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${sanitizedId}.${extension}`;

    // Upload to Supabase Storage 'avatars' bucket
    let publicUrl = '';
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321';

    try {
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      } else {
        // Fallback to canonical public storage endpoint
        publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${fileName}`;
      }
    } catch {
      publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${fileName}`;
    }

    // Persist to user_profiles table
    let profileQuery = supabase.from('user_profiles').select('id');
    if (identity.userProfileId) {
      profileQuery = profileQuery.eq('id', identity.userProfileId);
    } else if (identity.walletAddress) {
      profileQuery = profileQuery.eq('wallet_address', identity.walletAddress);
    } else {
      profileQuery = profileQuery.eq('privy_did', identity.privyDid);
    }

    const { data: existingProfile } = await profileQuery.maybeSingle();

    if (existingProfile) {
      await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', existingProfile.id);
    } else {
      await supabase.from('user_profiles').insert({
        wallet_address: identity.walletAddress || null,
        privy_did: identity.privyDid || null,
        avatar_url: publicUrl,
        display_name: '',
        bio: '',
        locale: 'en',
        country: 'KE',
        default_currency: 'KES',
      });
    }

    return jsonResponse({
      ok: true,
      avatarUrl: publicUrl,
    });
  }

  return jsonResponse({ error: 'method_not_allowed' }, { status: 405 });
}
