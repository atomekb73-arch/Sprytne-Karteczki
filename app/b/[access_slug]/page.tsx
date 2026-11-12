import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BoardWorkspace } from "@/components/BoardWorkspace";
import { BoardPinGate } from "@/components/BoardPinGate";
import { fetchBoardBundleBySlug } from "@/lib/board-data";

interface BoardPageProps {
  params: Promise<{ access_slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}

export async function generateMetadata({ params }: Pick<BoardPageProps, "params">) {
  const { access_slug } = await params;
  return {
    title: `Tablica ${access_slug}`,
  };
}

async function BoardRouteLoader({ params, searchParams }: BoardPageProps) {
  const [{ access_slug }, resolvedSearch] = await Promise.all([params, searchParams]);
  const isEmbed = resolvedSearch.embed === "true";

  const bundle = await fetchBoardBundleBySlug(access_slug);
  if (!bundle) {
    notFound();
  }

  return (
    <BoardPinGate
      boardId={bundle.board.id}
      boardTitle={bundle.board.title}
      expectedPin={bundle.board.pin_code ?? "123456"}
      pinUpdatedAt={bundle.board.pin_updated_at ?? null}
      isAdmin={bundle.isAuthenticatedAdmin}
    >
      <BoardWorkspace initialBundle={bundle} isEmbed={isEmbed} />
    </BoardPinGate>
  );
}

function BoardSkeleton() {
  return (
    <div className="min-h-screen bg-cork-dots">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <div className="h-14 w-2/3 animate-pulse rounded-xl bg-white/80" />
        <div className="h-36 animate-pulse rounded-2xl bg-white/85" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-52 animate-pulse rounded-sm bg-[#FEF08A]/70" />
          <div className="h-52 animate-pulse rounded-sm bg-[#BAE6FD]/70" />
          <div className="h-52 animate-pulse rounded-sm bg-[#BBF7D0]/70" />
          <div className="h-52 animate-pulse rounded-sm bg-[#FBCFE8]/70" />
        </div>
      </div>
    </div>
  );
}

export default function BoardPage({ params, searchParams }: BoardPageProps) {
  return (
    <Suspense fallback={<BoardSkeleton />}>
      <BoardRouteLoader params={params} searchParams={searchParams} />
    </Suspense>
  );
}
