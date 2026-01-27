import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PinterestClient, refreshPinterestToken } from '@/lib/pinterest/client';

async function getValidPinterestClient(supabase: any, userId: string): Promise<PinterestClient | null> {
  const { data: connection, error } = await supabase
    .from('pinterest_connections')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !connection) {
    return null;
  }

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(connection.expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000;

  if (expiresAt.getTime() - bufferMs <= now.getTime()) {
    try {
      const clientId = process.env.PINTEREST_CLIENT_ID!;
      const clientSecret = process.env.PINTEREST_CLIENT_SECRET!;

      const tokens = await refreshPinterestToken(connection.refresh_token, clientId, clientSecret);
      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      await supabase
        .from('pinterest_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return new PinterestClient(tokens.access_token);
    } catch {
      await supabase
        .from('pinterest_connections')
        .delete()
        .eq('user_id', userId);
      return null;
    }
  }

  return new PinterestClient(connection.access_token);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pinterest = await getValidPinterestClient(supabase, user.id);
    if (!pinterest) {
      return NextResponse.json({ error: 'Pinterest not connected' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('board_id');
    const query = searchParams.get('query');
    const bookmark = searchParams.get('bookmark') || undefined;

    let result;

    if (query) {
      // Search user's pins
      result = await pinterest.searchUserPins(query, 25, bookmark);
    } else if (boardId) {
      // Get pins from specific board
      result = await pinterest.getBoardPins(boardId, 25, bookmark);
    } else {
      return NextResponse.json({ error: 'board_id or query required' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching Pinterest pins:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pins' },
      { status: 500 }
    );
  }
}
