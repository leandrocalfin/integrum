"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  guardarObraSocial,
  eliminarObraSocial,
  reordenarObraSocial,
  cambiarVisibleObraSocial,
  subirLogoObraSocial,
  quitarLogoObraSocial,
} from "./actions";

const ICONOS = []; // el dropdown de logos predefinidos ya no se usa

function LogoOS({ icono, nombre, logoUrl }) {
  if (logoUrl) {
    return (
      <span className="inline-flex h-9 min-w-[72px] items-center justify-center rounded-lg bg-white px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={nombre}
          className="max-h-8 w-auto max-w-[110px] object-contain"
        />
      </span>
    );
  }
  if (icono === "swiss") {
    return (
      <span className="inline-flex h-9 min-w-[72px] items-center justify-center gap-1.5 rounded-lg bg-white px-2 text-[#263D83]">
        <span className="grid grid-cols-2 gap-[2px]" aria-hidden="true">
          <span className="h-2 w-2 rounded-[1px] bg-red-600" />
          <span className="h-2 w-2 rounded-[1px] bg-red-600" />
          <span className="h-2 w-2 rounded-[1px] bg-red-600" />
          <span className="h-2 w-2 rounded-[1px] bg-red-600" />
        </span>
        <span className="font-display text-[8px] font-extrabold leading-tight">SWISS<br />MEDICAL</span>
      </span>
    );
  }
  if (icono === "osde") {
    return (
      <span className="inline-flex h-9 min-w-[72px] items-center justify-center rounded-lg bg-[#0033A0] px-3 text-sm font-black lowercase tracking-tight text-white">
        osde
      </span>
    );
  }
  if (icono === "sancor") {
    return (
      <span className="inline-flex h-9 min-w-[72px] items-center justify-center gap-1 rounded-lg bg-white px-2">
        <Image src="/sancor-salud.svg" alt="" width={16} height={16} className="h-4 w-4" />
        <span className="font-display text-[9px] font-bold leading-tight text-[#263D83]">SanCor<br />Salud</span>
      </span>
    );
  }
  return (
    <span className="inline-flex h-9 min-w-[72px] items-center justify-center rounded-lg bg-[#0b2233] px-3 text-[10px] font-bold text-white">
      {nombre}
    </span>
  );
}

export default function ObrasSocialesAdmin({ obrasSociales, onSaved }) {
  const [form, setForm] = useState({ id: null, nombre: "", icono: "" });
  const [logoFile, setLogoFile] = useState(null);
  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : null),
    [logoFile]
  );
  useEffect(() => () => logoPreview && URL.revokeObjectURL(logoPreview), [logoPreview]);
  const inputLogoRef = useRef(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const original = form.id ? (obrasSociales ?? []).find((o) => o.id === form.id) : null;
  const previewSrc = logoPreview || (original?.logo_url ?? null);
  const abrirSelectorLogo = () => inputLogoRef.current?.click();

  const onPickLogo = (e) => {
    const file = e.target.files?.[0];
    if (inputLogoRef.current) inputLogoRef.current.value = "";
    if (!file) return;
    if (file.size > 4_000_000) {
      setError("La imagen pesa más de 4 MB");
      return;
    }
    setLogoFile(file);
    setError("");
  };

  const subirArchivo = async (id, e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 4_000_000) {
      setError("La imagen pesa más de 4 MB");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const datos = new FormData();
      datos.set("id", String(id));
      datos.set("file", file);
      const res = await subirLogoObraSocial(datos);
      if (res?.ok === true) onSaved("Logo actualizado");
      else setError(res?.error ?? "No se pudo subir el logo");
    } finally {
      setGuardando(false);
    }
  };

  const quitarLogo = async (o) => {
    if (!window.confirm(`¿Quitar el logo de ${o.nombre}?`)) return;
    setGuardando(true);
    setError("");
    try {
      const res = await quitarLogoObraSocial(o.id);
      if (res?.ok === true) onSaved("Logo quitado");
      else setError(res?.error ?? "No se pudo quitar el logo");
    } finally {
      setGuardando(false);
    }
  };

  const editar = (e) => {
    setForm({ id: e.id, nombre: e.nombre ?? "", icono: e.icono ?? "" });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setError("");
    try {
      const res = await guardarObraSocial(form);
      if (res?.ok !== true) {
        setError(res?.error ?? "No se pudo guardar");
        return;
      }
      // Si se eligió un logo nuevo para esta obra, subirlo ahora mismo.
      const destinoId = res?.datos?.id ?? form.id;
      if (logoFile && destinoId) {
        const datos = new FormData();
        datos.set("id", String(destinoId));
        datos.set("file", logoFile);
        const up = await subirLogoObraSocial(datos);
        if (up?.ok !== true) {
          // La obra ya se guardó; avisar del logo pero dejar el alta hecha.
          setError(up?.error ?? "La obra se guardó, pero el logo no se pudo subir");
          setForm({ id: null, nombre: "", icono: "" });
          setLogoFile(null);
          return;
        }
      }
      setForm({ id: null, nombre: "", icono: "" });
      setLogoFile(null);
      onSaved(form.id ? "Obra social actualizada" : "Obra social agregada");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#082F49]/60 p-4">
      <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-sky-400">
        Obras sociales y prepagas ({obrasSociales?.length ?? 0})
      </h3>
      <p className="mt-1 text-[11px] text-slate-500">
        Se muestran en la home, dentro de Nosotros. Visibles solo las que tengan el ojo abierto.
        Cada obra puede tener logo propio subido como imagen (sobrescribe el logo de la lista).
      </p>

      <form onSubmit={guardar} className="mt-3 flex flex-col gap-4 rounded-xl border border-white/10 bg-[#082F49]/80 p-4 sm:flex-row sm:items-center">
        {/* Vista previa del logo + botón de subir imagen */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative flex h-24 w-32 items-center justify-center overflow-hidden rounded-xl border-2 border-sky-500/40 bg-white p-1.5">
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Logo de la obra social"
                className="max-h-full w-auto object-contain"
              />
            ) : (
              <span className="text-center text-[10px] font-bold uppercase leading-tight text-slate-400">
                {form.nombre || "Vista previa"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={abrirSelectorLogo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            Adjuntar imagen
          </button>
          <input
            ref={inputLogoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onPickLogo}
            aria-label="Adjuntar imagen del logo"
          />
          {logoFile && (
            <p className="max-w-[140px] truncate text-center text-[10px] text-slate-400" title={logoFile.name}>
              {logoFile.name}
            </p>
          )}
        </div>

        {/* Campos */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            required
            value={form.nombre}
            onChange={(e) => {
              setForm({ ...form, nombre: e.target.value });
              setError("");
            }}
            placeholder="Nombre (ej.: Galeno, Medifé)"
            maxLength={60}
            className="h-11 rounded-xl border border-white/10 bg-[#082F49]/80 px-3 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            aria-label="Nombre de la obra social"
          />
          <select
            value={form.icono}
            onChange={(e) => {
              setForm({ ...form, icono: e.target.value });
              setError("");
            }}
            className="h-11 rounded-xl border border-white/10 bg-[#082F49]/80 px-3 text-[13px] text-white outline-none focus:border-sky-500"
            aria-label="Logo predefinido"
          >
            {ICONOS.map((i) => (
              <option key={i.valor} value={i.valor}>
                {i.label}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-500 px-5 text-[12px] font-bold text-[#082F49] hover:bg-sky-400 disabled:opacity-60"
            >
              {guardando ? "Guardando…" : form.id ? "Guardar cambios" : "Agregar"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => {
                  setForm({ id: null, nombre: "", icono: "" });
                  setLogoFile(null);
                }}
                className="inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-[12px] text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>
      {error && (
        <p role="alert" className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </p>
      )}

      {(obrasSociales?.length ?? 0) === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-white/10 bg-[#060E18] p-5 text-center text-[13px] text-slate-500">
          Todavía no hay obras sociales cargadas. Agregá la primera.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {obrasSociales.map((o, i) => {
            const oculta = o.visible === false;
            const alternarVisible = async () => {
              setGuardando(true);
              setError("");
              const res = await cambiarVisibleObraSocial(o.id, oculta);
              if (res?.ok === true) onSaved(oculta ? "Visible en el sitio" : "Oculta del sitio");
              else setError(res?.error ?? "No se pudo actualizar");
              setGuardando(false);
            };
            const mover = async (dir) => {
              setGuardando(true);
              const res = await reordenarObraSocial(o.id, dir);
              if (res?.ok === true) onSaved("Orden actualizado");
              else setError(res?.error ?? "No se pudo reordenar");
              setGuardando(false);
            };
            return (
              <li
                key={o.id}
                className={`flex items-center gap-3 rounded-xl border border-white/10 bg-[#082F49] p-3 ${
                  oculta ? "opacity-60" : ""
                }`}
              >
                <LogoOS icono={o.icono} nombre={o.nombre} logoUrl={o.logo_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-white">{o.nombre}</p>
                  {oculta && (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Oculta · no se muestra en el sitio
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => editar(o)}
                      className="rounded-md bg-sky-500/15 px-2.5 py-1 text-[10px] font-bold text-sky-300 hover:bg-sky-500/25"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={alternarVisible}
                      disabled={guardando}
                      aria-pressed={oculta}
                      title={oculta ? "Mostrar en el sitio" : "Ocultar del sitio"}
                      className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
                        oculta
                          ? "bg-slate-500/15 text-slate-400 hover:bg-slate-500/25"
                          : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      }`}
                    >
                      {oculta ? "Oculta" : "Visible"}
                    </button>
                    <label
                      className="cursor-pointer rounded-md bg-sky-500/15 px-2.5 py-1 text-[10px] font-bold text-sky-300 hover:bg-sky-500/25"
                      title="Sube un logo propio (JPG, PNG o WebP, máx. 4 MB)"
                    >
                      Logo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={guardando}
                        onChange={(e) => subirArchivo(o.id, e)}
                      />
                    </label>
                    {o.logo_url && (
                      <button
                        type="button"
                        onClick={() => quitarLogo(o)}
                        disabled={guardando}
                        title="Quitar el logo personalizado"
                        className="rounded-md bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/25"
                      >
                        Quitar logo
                      </button>
                    )}
                    <div className="ml-auto flex items-center gap-0.5">
                      <button
                        type="button"
                        aria-label="Subir"
                        onClick={() => mover("up")}
                        disabled={guardando || i === 0}
                        className="grid h-6 w-6 place-items-center rounded bg-white/5 text-slate-300 hover:text-white disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Bajar"
                        onClick={() => mover("down")}
                        disabled={guardando || i === obrasSociales.length - 1}
                        className="grid h-6 w-6 place-items-center rounded bg-white/5 text-slate-300 hover:text-white disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`¿Eliminar a ${o.nombre}?`)) return;
                    setGuardando(true);
                    const res = await eliminarObraSocial(o.id);
                    if (res?.ok === true) onSaved("Obra social eliminada");
                    else setError(res?.error ?? "No se pudo eliminar");
                    setGuardando(false);
                  }}
                  disabled={guardando}
                  className="rounded-md bg-red-500/15 px-2.5 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/25"
                >
                  Eliminar
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
