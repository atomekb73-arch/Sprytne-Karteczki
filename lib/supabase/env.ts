export function getSupabasePublicEnv(): {
  url: string;
  publishableKey: string;
} {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  ).trim();

  if (!url || !publishableKey) {
    throw new Error(
      "Brak zmiennych środowiskowych Supabase (NEXT_PUBLIC_SUPABASE_URL oraz NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }

  return { url, publishableKey };
}

export function isSupabasePublicConfigured(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  ).trim();

  return (
    url.length > 0 &&
    publishableKey.length > 0 &&
    !url.includes("YOUR_PROJECT_REF") &&
    !publishableKey.includes("YOUR_KEY")
  );
}

export function getSupabaseServiceEnv(): {
  url: string;
  secretKey: string;
} {
  const { url } = getSupabasePublicEnv();
  const secretKey = (
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    ""
  ).trim();

  if (!secretKey) {
    throw new Error(
      "Brak serwerowego klucza Supabase (SUPABASE_SECRET_KEY lub SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return { url, secretKey };
}
