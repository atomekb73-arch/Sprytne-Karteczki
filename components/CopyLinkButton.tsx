"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyLinkButtonProps {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}

export function CopyLinkButton({
  value,
  label = "Kopiuj link",
  copiedLabel = "Skopiowano!",
  className = "",
}: CopyLinkButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [announcement, setAnnouncement] = useState("");
  const lastAnnouncementRef = useRef("");
  const timerRef = useRef<number | null>(null);

  const announce = useCallback((msg: string) => {
    const nextMsg =
      msg === lastAnnouncementRef.current ? `${msg}\u00A0` : msg;
    lastAnnouncementRef.current = nextMsg;
    setAnnouncement(nextMsg);
  }, []);

  const handleCopy = useCallback(async () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
      announce(copiedLabel);
      timerRef.current = window.setTimeout(() => {
        setStatus("idle");
        setAnnouncement("");
      }, 2200);
    } catch {
      setStatus("error");
      announce("Nie udało się skopiować do schowka");
      timerRef.current = window.setTimeout(() => {
        setStatus("idle");
        setAnnouncement("");
      }, 2600);
    }
  }, [announce, copiedLabel, value]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-2xs transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${className}`}
      >
        {status === "copied" ? (
          <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-stone-600" aria-hidden="true" />
        )}
        <span>{status === "copied" ? copiedLabel : label}</span>
      </button>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
      >
        {announcement ? (
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium shadow-sm ${
              status === "error"
                ? "bg-rose-700 text-white"
                : "bg-stone-900 text-white"
            }`}
          >
            {announcement}
          </span>
        ) : null}
      </div>
    </div>
  );
}
