"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

const CLAVE_SESSION = "integrum-avisos-cerrados";

// useSyncExternalStore: en el servidor devuelve null (no renderiza ningún
// cartel, evitando el parpadeo), y en el cliente lee la sesión real apenas
// termina la hidratación.
function suscribirStorage(onChange) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function leerStorage() {
  try {
    return sessionStorage.getItem(CLAVE_SESSION) ?? "[]";
  } catch {
    return "[]";
  }
}

function storageServidor() {
  return null;
}

// Cartel flotante que se muestra al ingresar al sitio. El visitante debe
// cerrarlo para poder navegar; una vez cerrado no vuelve a aparecer en la
// misma sesión del navegador (y se pasa al siguiente aviso pendiente).
export default function FloatingBanner({ banners }) {
  const lista = Array.isArray(banners) ? banners : [];
  const [cerradosAqui, setCerradosAqui] = useState([]);
  const pathname = usePathname();
  const dialogo = useRef(null);
  const botonCerrar = useRef(null);

  const almacenado = useSyncExternalStore(
    suscribirStorage,
    leerStorage,
    storageServidor
  );
  const cerradosGuardados = useMemo(() => {
    if (almacenado === null) return [];
    try {
      const parsed = JSON.parse(almacenado);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }, [almacenado]);
  const cerrados = useMemo(
    () => Array.from(new Set([...cerradosGuardados, ...cerradosAqui])),
    [cerradosGuardados, cerradosAqui]
  );

  const aviso =
    almacenado !== null && !pathname?.startsWith("/admin")
      ? lista.find(
          (b) => b && !cerrados.includes(String(b.id))
        ) ?? null
      : null;

  const cerrar = useCallback(() => {
    if (!aviso) return;
    const id = String(aviso.id);
    setCerradosAqui((actual) => (actual.includes(id) ? actual : [...actual, id]));
    try {
      const actuales = new Set(cerrados);
      actuales.add(id);
      sessionStorage.setItem(CLAVE_SESSION, JSON.stringify([...actuales]));
    } catch {
      // Si falla el almacenamiento, el aviso igual se cierra en esta pestaña.
    }
  }, [aviso, cerrados]);

  useEffect(() => {
    if (!aviso) return;
    botonCerrar.current?.focus();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const alTeclear = (event) => {
      if (event.key === "Escape") {
        cerrar();
        return;
      }
      if (event.key !== "Tab") return;
      // Mantener el foco dentro del cartel mientras esté abierto.
      const focos = dialogo.current?.querySelectorAll(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focos?.length) return;
      const primero = focos[0];
      const ultimo = focos[focos.length - 1];
      if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primero.focus();
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", alTeclear);
    };
  }, [aviso, cerrar]);

  if (!aviso) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="aviso-flotante-titulo"
      aria-describedby="aviso-flotante-descripcion"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
    >
      <div
        ref={dialogo}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-sky-950 p-6 shadow-2xl sm:p-8"
      >
        <button
          ref={botonCerrar}
          type="button"
          onClick={cerrar}
          aria-label="Cerrar aviso"
          className="absolute right-3 top-3 z-10 rounded-xl bg-sky-950/70 p-1.5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {aviso.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={aviso.imagen_url}
            alt={aviso.titulo}
            className="h-36 w-full rounded-2xl object-cover"
          />
        ) : null}
        <div className="mt-4">
          <h2 id="aviso-flotante-titulo" className="font-display text-lg font-bold text-white">
            {aviso.titulo}
          </h2>
          {aviso.descripcion ? (
            <p id="aviso-flotante-descripcion" className="mt-2 whitespace-pre-line text-[13px] leading-6 text-slate-300">
              {aviso.descripcion}
            </p>
          ) : null}
          <button
            type="button"
            onClick={cerrar}
            className="mt-6 w-full rounded-full bg-sky-500 px-6 py-3 text-[13px] font-bold text-[#082F49] transition-colors hover:bg-sky-400"
          >
            Entendido, seguir navegando
          </button>
        </div>
      </div>
    </div>
  );
}
