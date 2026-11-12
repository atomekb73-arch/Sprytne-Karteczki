"use client";

import { useState } from "react";
import { Clock, ShieldAlert, KeyRound, Check, RefreshCw } from "lucide-react";

interface PinRotationWidgetProps {
  boardId: string;
  currentPin: string | null;
  pinUpdatedAt: string | null;
  onPinChange?: (newPin: string) => void;
}

export function PinRotationWidget({
  boardId,
  currentPin,
  pinUpdatedAt,
  onPinChange,
}: PinRotationWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activePin, setActivePin] = useState(currentPin ?? "123456");

  // Calculate days remaining in 30-day cycle
  const lastUpdated = pinUpdatedAt ? new Date(pinUpdatedAt).getTime() : Date.now();
  const msElapsed = Date.now() - lastUpdated;
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 30 - daysElapsed);
  const isExpiringSoon = daysRemaining <= 10;
  const isExpired = daysRemaining === 0;

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6) return;

    setIsSaving(true);
    try {
      // In demo / production mode:
      setActivePin(newPin);
      onPinChange?.(newPin);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setIsOpen(false);
        setNewPin("");
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Alert banner for last 10 days or expired */}
      {isExpiringSoon && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs shadow-sm transition ${
            isExpired
              ? "border-red-300 bg-red-50 text-red-950"
              : "border-amber-300 bg-amber-50 text-amber-950"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert
              className={`h-4 w-4 shrink-0 ${isExpired ? "text-red-600" : "text-amber-600"}`}
            />
            <span>
              <strong>{isExpired ? "PIN wygasł!" : "Uwaga Zarząd:"}</strong>{" "}
              {isExpired
                ? "Minęło 30 dni od ostatniej zmiany. Wygeneruj lub ustaw nowy PIN dla członków koła."
                : `Zbliża się comiesięczna zmiana PIN-u dostępu. Pozostało ${daysRemaining} ${
                    daysRemaining === 1 ? "dzień" : "dni"
                  }.`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono font-semibold text-stone-700 bg-white/80 px-2 py-0.5 rounded border border-stone-200">
              PIN: {activePin}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="rounded-lg bg-stone-900 px-3 py-1 font-semibold text-white shadow-xs hover:bg-stone-800"
            >
              Zmień PIN teraz
            </button>
          </div>
        </div>
      )}

      {/* Normal status pill in header when > 10 days remaining */}
      {!isExpiringSoon && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/90 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 shadow-2xs"
          title="Zarządzaj 6-cyfrowym PIN-em tablicy"
        >
          <KeyRound className="h-3.5 w-3.5 text-stone-600" />
          <span>PIN: <strong className="font-mono">{activePin}</strong></span>
          <span className="text-2xs text-stone-400">({daysRemaining} dni do rotacji)</span>
        </button>
      )}

      {/* Change PIN Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-[#FEF08A]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Zmień 6-cyfrowy PIN</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-stone-600">
              Zgodnie z zasadami bezpieczeństwa WSKZ, PIN do tablicy koła powinien być zmieniany co 30 dni. Nowy kod przekaż członkom koła.
            </p>

            <form onSubmit={handleUpdatePin} className="mt-4 space-y-4">
              <div>
                <label htmlFor="new-pin-input" className="block text-2xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
                  Nowy 6-cyfrowy PIN
                </label>
                <div className="relative">
                  <input
                    id="new-pin-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Wpisz 6 cyfr"
                    autoFocus
                    className="w-full tracking-widest text-lg font-mono font-bold rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:border-stone-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
                      setNewPin(randomPin);
                    }}
                    className="absolute right-2 top-2 p-1 text-stone-400 hover:text-stone-800"
                    title="Wygeneruj losowy PIN"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {savedSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                  <Check className="h-4 w-4" />
                  <span>PIN został pomyślnie zmieniony!</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={newPin.length !== 6 || isSaving}
                  className="rounded-xl bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 disabled:opacity-40"
                >
                  {isSaving ? "Zapisywanie..." : "Zapisz nowy PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
