"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AlertCircle, ArrowLeft, KeyRound, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "/";
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    callbackError ? "Sesja logowania wygasła lub link jest nieprawidłowy." : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const supabaseReady = isSupabasePublicConfigured();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabaseReady) {
      setErrorMessage("Najpierw uzupełnij konfigurację Supabase w .env.local.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage("Nieprawidłowy adres e-mail lub hasło Zarządu.");
        return;
      }

      router.push(safeNext);
      router.refresh();
    } catch {
      setErrorMessage("Wystąpił błąd podczas logowania.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white/95 p-6 shadow-sm sm:p-7">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Wróć na stronę główną</span>
      </Link>

      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-[#FEF08A]">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-lg font-extrabold text-stone-950">
            Logowanie Zarządu WSKZ
          </h1>
          <p className="text-xs text-stone-600">
            Dostęp do Multi-Tenant Switchera, przypinania i wysyłki do CRM
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="mb-1 block text-xs font-semibold text-stone-700"
          >
            Adres e-mail
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="zarzad@wskz.example"
            className="w-full rounded-xl border border-stone-300 bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1 block text-xs font-semibold text-stone-700"
          >
            Hasło
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-stone-300 bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:bg-white focus:outline-none"
          />
        </div>

        {errorMessage ? (
          <p
            role="alert"
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading || !supabaseReady}
          className="w-full rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Logowanie..." : "Zaloguj się jako Zarząd"}
        </button>
      </form>

      <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs leading-relaxed text-stone-600">
        <p className="flex items-center gap-1.5 font-semibold text-stone-800">
          <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Tryb awaryjny bez konta</span>
        </p>
        <p className="mt-1">
          Podczas spotkań online możesz też otworzyć konkretną tablicę z parametrem{" "}
          <code className="rounded bg-stone-200/70 px-1 py-0.5 font-mono text-[11px]">
            ?admin=KLUCZ_ZARZADU
          </code>
          .
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cork-dots px-4 py-10">
      <Suspense
        fallback={
          <div className="h-80 w-full max-w-md animate-pulse rounded-2xl bg-white/80" />
        }
      >
        <LoginFormContent />
      </Suspense>
    </main>
  );
}
