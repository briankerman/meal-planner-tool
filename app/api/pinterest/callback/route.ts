import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangePinterestCode, PinterestClient } from '@/lib/pinterest/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Pinterest OAuth error:', error);
      return NextResponse.redirect(new URL('/settings?pinterest_error=denied', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?pinterest_error=missing_params', request.url));
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify state token
    const { data: authState, error: stateError } = await supabase
      .from('pinterest_auth_states')
      .select('*')
      .eq('user_id', user.id)
      .eq('state', state)
      .single();

    if (stateError || !authState) {
      return NextResponse.redirect(new URL('/settings?pinterest_error=invalid_state', request.url));
    }

    // Delete used state
    await supabase
      .from('pinterest_auth_states')
      .delete()
      .eq('user_id', user.id);

    // Exchange code for tokens
    const clientId = process.env.PINTEREST_CLIENT_ID!;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET!;
    const redirectUri = process.env.PINTEREST_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/pinterest/callback`;

    const tokens = await exchangePinterestCode(code, clientId, clientSecret, redirectUri);

    // Get Pinterest user info
    const pinterest = new PinterestClient(tokens.access_token);
    const pinterestUser = await pinterest.getUser();

    // Store tokens in database
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase
      .from('pinterest_connections')
      .upsert({
        user_id: user.id,
        pinterest_username: pinterestUser.username,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      });

    return NextResponse.redirect(new URL('/settings?pinterest_connected=true', request.url));
  } catch (error: any) {
    console.error('Pinterest callback error:', error);
    return NextResponse.redirect(new URL(`/settings?pinterest_error=${encodeURIComponent(error.message)}`, request.url));
  }
}
