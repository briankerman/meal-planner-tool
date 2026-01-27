import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: connection, error } = await supabase
      .from('pinterest_connections')
      .select('pinterest_username, expires_at, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error || !connection) {
      return NextResponse.json({ connected: false });
    }

    // Check if expired
    const expiresAt = new Date(connection.expires_at);
    const isExpired = expiresAt <= new Date();

    return NextResponse.json({
      connected: !isExpired,
      username: connection.pinterest_username,
      expiresAt: connection.expires_at,
    });
  } catch (error: any) {
    console.error('Error checking Pinterest status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await supabase
      .from('pinterest_connections')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting Pinterest:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
