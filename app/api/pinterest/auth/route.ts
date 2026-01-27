import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPinterestAuthUrl } from '@/lib/pinterest/client';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.PINTEREST_CLIENT_ID;
    const redirectUri = process.env.PINTEREST_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/pinterest/callback`;

    if (!clientId) {
      return NextResponse.json({ error: 'Pinterest not configured' }, { status: 500 });
    }

    // Generate state token for CSRF protection
    const state = randomBytes(32).toString('hex');

    // Store state in database to verify on callback
    await supabase
      .from('pinterest_auth_states')
      .upsert({
        user_id: user.id,
        state,
        created_at: new Date().toISOString(),
      });

    const authUrl = getPinterestAuthUrl(clientId, redirectUri, state);

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Pinterest auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Pinterest auth' },
      { status: 500 }
    );
  }
}
