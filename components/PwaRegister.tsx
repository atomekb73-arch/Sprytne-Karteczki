"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
      } catch {
        // Sw rejestruje sie cicho; w srodowisku deweloperskim lub iframe bez HTTPS moze byc pominiety
      }
    };

    void register();
  }, []);

  return null;
}
