import { redirect } from "next/navigation";
import { Suspense } from "react";

interface BoardRedirectIndexProps {
  searchParams: Promise<{ slug?: string }>;
}

function sanitizeSlugInput(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/\/b\/([a-zA-Z0-9-]+)/);
  if (match?.[1]) {
    return match[1].toLowerCase();
  }
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function BoardRedirectLoader({ searchParams }: BoardRedirectIndexProps) {
  const { slug } = await searchParams;
  const cleaned = slug ? sanitizeSlugInput(slug) : "";
  if (cleaned) {
    redirect(`/b/${cleaned}`);
  }
  redirect("/");
  return null;
}

export default function BoardRedirectIndex({ searchParams }: BoardRedirectIndexProps) {
  return (
    <Suspense fallback={null}>
      <BoardRedirectLoader searchParams={searchParams} />
    </Suspense>
  );
}
