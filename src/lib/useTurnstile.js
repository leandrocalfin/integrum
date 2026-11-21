"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Carga el widget de Turnstile de forma confiable en la primera visita.
// `next/script` onLoad no se dispara si el script ya estaba cargado por una
// navegación previa, así que también sondeamos window.turnstile unos segundos.
export function useTurnstile(siteKey) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [token, setToken] = useState("");

  const renderWidget = useCallback(() => {
    if (
      !siteKey ||
      typeof window === "undefined" ||
      !window.turnstile ||
      !containerRef.current ||
      widgetIdRef.current !== null
    ) {
      return;
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: setToken,
      "error-callback": () => setToken(""),
      "expired-callback": () => setToken(""),
    });
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) return;
    renderWidget();
    let intentos = 0;
    const timer = setInterval(() => {
      renderWidget();
      if (++intentos >= 40) clearInterval(timer);
    }, 200);
    return () => clearInterval(timer);
  }, [siteKey, renderWidget]);

  const resetWidget = useCallback(() => {
    setToken("");
    if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current !== null) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // El widget ya expiró o fue removido; el token ya se limpió arriba.
      }
    }
  }, []);

  return { containerRef, token, onReady: renderWidget, resetWidget };
}
