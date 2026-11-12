import { NextResponse } from "next/server";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/";
  }

  if (isSupabasePublicConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}${next}`, { status: 303 });
}
