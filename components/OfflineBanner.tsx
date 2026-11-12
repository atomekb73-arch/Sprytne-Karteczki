"use client";

import Link from "next/link";
import { useOffline } from "next/offline";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print sticky top-0 z-50 border-b border-amber-300 bg-amber-50/95 px-4 py-2 text-sm text-amber-950 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
          <span>
            Tryb offline — przeglądasz ostatnio zapisane karteczki. Dodawanie i popieranie wróci po odzyskaniu sieci.
          </span>
        </div>
        <Link
          href="/offline"
          className="inline-flex items-center rounded-md border border-amber-400 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-2xs transition hover:bg-amber-100"
        >
          Zapisane tablice
        </Link>
      </div>
    </div>
  );
}
