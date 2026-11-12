import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function BoardNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cork-dots px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
        <SearchX className="mx-auto mb-3 h-10 w-10 text-stone-400" aria-hidden="true" />
        <h1 className="text-lg font-bold text-stone-950">
          Nie znaleziono tej tablicy karteczek
        </h1>
        <p className="mt-1.5 text-sm text-stone-600">
          Link mógł wygasnąć po wygenerowaniu nowego adresu przez Zarząd albo zawiera literówkę.
        </p>
        <div className="mt-5 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Wróć do listy tablic WSKZ</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
