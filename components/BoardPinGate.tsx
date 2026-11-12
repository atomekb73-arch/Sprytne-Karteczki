"use client";

import { useEffect, useState } from "react";
import { KeyRound, ShieldAlert, ArrowRight, Lock } from "lucide-react";

interface BoardPinGateProps {
  boardId: string;
  boardTitle: string;
  expectedPin: string | null;
  pinUpdatedAt: string | null;
  isAdmin: boolean;
  children: React.ReactNode;
}

export function BoardPinGate({
  boardId,
  boardTitle,
  expectedPin,
  pinUpdatedAt,
  isAdmin,
  children,
}: BoardPinGateProps) {
  const [pinInput, setPinInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const storageKey = `wskz_board_pin_unlocked_${boardId}`;

  useEffect(() => {
    setMounted(true);
    // Admins bypass PIN gate
    if (isAdmin) {
      setIsUnlocked(true);
      return;
    }
    // If no pin configured, allow access
    if (!expectedPin) {
      setIsUnlocked(true);
      return;
    }
    // Check session unlock
    const cached = sessionStorage.getItem(storageKey);
    if (cached === expectedPin) {
      setIsUnlocked(true);
    }
  }, [boardId, expectedPin, isAdmin, storageKey]);

  if (!mounted) {
    return null;
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedPin) {
      setIsUnlocked(true);
      return;
    }

    if (pinInput.trim() === expectedPin.trim()) {
      sessionStorage.setItem(storageKey, expectedPin.trim());
      setIsUnlocked(true);
      setErrorMessage(null);
    } else {
      setErrorMessage("Nieprawidłowy 6-cyfrowy kod PIN. Zapytaj Zarząd Koła o aktualny PIN.");
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white/95 p-8 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-[#FEF08A] shadow-md">
          <Lock className="h-7 w-7" aria-hidden="true" />
        </div>

        <div className="mt-5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            Tablica zabezpieczona kodem PIN
          </span>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
            {boardTitle}
          </h2>
          <p className="mt-2 text-xs text-stone-600 sm:text-sm">
            Ta tablica jest prywatną przestrzenią koła. Aby dołączyć do burzy mózgów i zobaczyć pomysły, wpisz 6-cyfrowy PIN przekazany przez Zarząd.
          </p>
        </div>

        <form onSubmit={handleVerifyPin} className="mt-6 space-y-4">
          <div>
            <label htmlFor="pin-input" className="sr-only">
              6-cyfrowy kod PIN
            </label>
            <input
              id="pin-input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPinInput(val);
                setErrorMessage(null);
              }}
              placeholder="••••••"
              autoFocus
              className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 placeholder:text-stone-300 focus:border-stone-900 focus:bg-white focus:outline-none"
            />
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pinInput.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Odblokuj tablicę</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-6 border-t border-stone-100 pt-4 text-center">
          <p className="text-2xs text-stone-500">
            Jesteś członkiem Zarządu lub moderatorem?{" "}
            <a href="/login" className="font-semibold text-stone-800 underline hover:text-black">
              Zaloguj się z uprawnieniami Zarządu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
