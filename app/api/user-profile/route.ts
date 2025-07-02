import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/user-profile?username=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Profile not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}

// POST /api/user-profile
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, bio, avatar_url, native_language, learning_languages } = body;
  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  }
  // Upsert profile
  const { data, error } = await supabase
    .from('profiles')
    .upsert([
      {
        username,
        bio,
        avatar_url,
        native_language,
        learning_languages: Array.isArray(learning_languages) ? learning_languages.join(',') : learning_languages,
      }
    ], { onConflict: 'username' })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}