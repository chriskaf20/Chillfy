// This file is deprecated - Authentication is now handled by Supabase exclusively
// This route should not be used anymore

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'This route is deprecated. Use Supabase authentication instead.' }, { status: 410 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'This route is deprecated. Use Supabase authentication instead.' }, { status: 410 });
}
