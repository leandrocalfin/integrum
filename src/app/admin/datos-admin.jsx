"use client";

import { useState } from "react";
import { guardarContacto } from "./actions";

const CAMPOS = [
  { nombre: "direccion", etiqueta: "Dirección", placeholder: "Comodoro Py 528, Río Gallegos, Santa Cruz", max: 255 },
  { nombre: "horario", etiqueta: "Horario de atención", placeholder: "Lunes a viernes: 9 a 12 y 14 a 18 hs", max: 100 },
  { nombre: "telefono_turnos", etiqueta: "Teléfono de turnos (recepción)", placeholder: "2966-306555", max: 30 },
  { nombre: "instagram", etiqueta: "Instagram (URL https://...)", placeholder: "https://www.instagram.com/...", max: 500 },
  { nombre: "facebook", etiqueta: "Facebook (URL)", placeholder: "https://www.facebook.com/...", max: 500 },
];

const inputCls =
  "h-10 w-full rounded-xl border border-white/10 bg-[#082F49]/80 px-3 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40";

// Acepta la URL del embed o el HTML completo del iframe que da Google Maps.
function extraerUrlMapa(valor) {
  let t = String(valor ?? "").trim();
  const src = t.match(/<iframe[^>]*\bsrc=["']([^"']+)["']/i);
  if (src) t = src[1];
  return t.replace(/&amp;/g, "&").trim();
}

export default function DatosAdmin({ contacto, onSaved }) {
  const [form, setForm] = useState({
    direccion: contacto?.direccion ?? "",
    mapa_url: contacto?.mapa_url ?? "",
    horario: contacto?.horario ?? "",
    telefono_turnos: contacto?.telefono_turnos ?? "",
    instagram: contacto?.instagram ?? "",
    facebook: contacto?.facebook ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const onChange = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setError("");
  };

  // Al pegar el iframe completo, guardamos solo el src.
  const onChangeMapa = (e) => {
    setForm((f) => ({ ...f, mapa_url: extraerUrlMapa(e.target.value) }));
    setError("");
  };

  const generarMapa = () => {
    const q = encodeURIComponent(form.direccion.trim());
    setForm((f) => ({
      ...f,
      mapa_url: `https://www.google.com/maps?q=${q}&output=embed`,
    }));
    setError("");
  };

  const mapaValido = /^https:\/\/www\.google\.com\/maps/.test(form.mapa_url.trim());
  const mapaEmbebible =
    mapaValido && /(output=embed|\/maps\/embed)/.test(form.mapa_url);

  const guardar = async (ev) => {
    ev.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setError("");
    const res = await guardarContacto(form);
    if (res?.ok === true) onSaved("Datos guardados");
    else setError(res?.error ?? "No se pudo guardar");
    setGuardando(false);
  };

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4">
      <p className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-2.5 text-[12px] leading-5 text-sky-200">
        Los datos de contacto se usan en el inicio, en el pie de página, en la
        sección Contacto y para el botón de WhatsApp del sitio (que usa el
        teléfono de turnos).
      </p>

      <div>
        <label htmlFor="datos-direccion" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Dirección
        </label>
        <input
          id="datos-direccion"
          type="text"
          value={form.direccion}
          onChange={onChange("direccion")}
          placeholder={CAMPOS[0].placeholder}
          maxLength={255}
          className={inputCls}
        />
      </div>

      {/* ==================== MAPA ==================== */}
      <div className="rounded-xl border border-white/10 bg-[#082F49]/40 p-3">
        <label htmlFor="datos-mapa" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          URL del mapa (Google Maps embed)
        </label>
        <input
          id="datos-mapa"
          type="text"
          value={form.mapa_url}
          onChange={onChangeMapa}
          onPaste={(e) => {
            const pegado = e.clipboardData?.getData("text") ?? "";
            if (/<iframe/i.test(pegado)) {
              e.preventDefault();
              setForm((f) => ({ ...f, mapa_url: extraerUrlMapa(pegado) }));
              setError("");
            }
          }}
          placeholder="https://www.google.com/maps?q=...&output=embed"
          maxLength={500}
          className={inputCls}
        />

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={generarMapa}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-[11px] font-bold text-sky-300 transition-colors hover:bg-sky-500/20"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Generar desde la dirección
          </button>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.direccion || "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-white/25 hover:text-white"
          >
            Abrir en Google Maps
          </a>
        </div>

        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          Opción rápida: <span className="text-slate-400">Generar desde la dirección</span>.
          Para el pin exacto: en Google Maps buscá el consultorio →{" "}
          <span className="text-slate-400">Compartir → Insertar un mapa → Copiar HTML</span>{" "}
          y pegá el código completo acá (se extrae la URL solo).
        </p>

        {mapaValido && mapaEmbebible && (
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            <iframe
              title="Vista previa del mapa"
              src={form.mapa_url}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-48 w-full border-0 bg-slate-950"
            />
          </div>
        )}
        {mapaValido && !mapaEmbebible && (
          <p className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-1.5 text-[11px] text-amber-200">
            Esa URL no es de tipo embed. Usá el código de “Insertar un mapa” o el
            botón “Generar desde la dirección”.
          </p>
        )}
      </div>

      {CAMPOS.filter((c) => c.nombre !== "direccion").map((c) => (
        <div key={c.nombre}>
          <label htmlFor={`datos-${c.nombre}`} className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            {c.etiqueta}
          </label>
          <input
            id={`datos-${c.nombre}`}
            type="text"
            value={form[c.nombre]}
            onChange={onChange(c.nombre)}
            placeholder={c.placeholder}
            maxLength={c.max}
            className={inputCls}
          />
        </div>
      ))}

      {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="inline-flex h-10 w-fit items-center rounded-xl bg-sky-500 px-6 text-[13px] font-bold text-[#082F49] hover:bg-sky-400 disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar datos y redes"}
      </button>
    </form>
  );
}
