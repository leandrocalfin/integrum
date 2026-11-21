"use client";

import { useRef, useState } from "react";
import { guardarBanner, eliminarBanner } from "./actions";

const VACIO = { id: null, titulo: "", descripcion: "", imagen_url: "" };

export default function BannersAdmin({ banners, onSaved }) {
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const palabras = form.descripcion.trim()
    ? form.descripcion.trim().split(/\s+/).length
    : 0;
  const excede = palabras > 30;

  const limpiar = () => {
    setForm(VACIO);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editar = (b) => {
    setForm({
      id: b.id,
      titulo: b.titulo ?? "",
      descripcion: b.descripcion ?? "",
      imagen_url: b.imagen_url ?? "",
    });
    setError("");
    if (fileRef.current) fileRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (guardando || excede) return;
    setGuardando(true);
    setError("");
    const datos = new FormData();
    datos.set("id", form.id ?? "");
    datos.set("titulo", form.titulo);
    datos.set("descripcion", form.descripcion);
    const imagen = fileRef.current?.files?.[0];
    if (imagen) datos.set("imagen", imagen);
    const res = await guardarBanner(datos);
    if (res?.ok === true) {
      const mensaje = form.id ? "Aviso actualizado" : "Aviso agregado";
      limpiar();
      onSaved(mensaje);
    } else {
      setError(res?.error ?? "No se pudo guardar");
    }
    setGuardando(false);
  };

  const quitar = async (b) => {
    if (!window.confirm("¿Eliminar este aviso?")) return;
    setGuardando(true);
    setError("");
    const res = await eliminarBanner(b.id);
    if (res?.ok === true) {
      if (form.id === b.id) limpiar();
      onSaved("Aviso eliminado");
    } else {
      setError(res?.error ?? "No se pudo eliminar");
    }
    setGuardando(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={guardar} className="rounded-xl border border-white/10 bg-[#082F49]/60 p-4">
        <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-sky-400">
          {form.id ? "Editar aviso" : "Agregar aviso"}
        </h3>
        <input
          required
          value={form.titulo}
          onChange={(e) => { setForm({ ...form, titulo: e.target.value }); setError(""); }}
          placeholder="Título"
          maxLength={100}
          className="mt-3 h-10 w-full rounded-xl border border-white/10 bg-[#082F49]/80 px-3 text-[13px] text-white"
        />
        <textarea
          required
          rows={3}
          value={form.descripcion}
          onChange={(e) => { setForm({ ...form, descripcion: e.target.value }); setError(""); }}
          placeholder="Descripción"
          maxLength={300}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#082F49]/80 px-3 py-2 text-[13px] leading-6 text-white"
        />
        <p className={`mt-1 text-[11px] ${excede ? "text-red-300" : "text-slate-400"}`}>
          {palabras}/30 palabras
        </p>
        <div className="mt-3">
          <label className="text-[11px] font-semibold text-slate-300" htmlFor="aviso-imagen">
            Imagen
          </label>
          <input
            id="aviso-imagen"
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={() => setError("")}
            className="mt-1 block w-full text-[12px] text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500/15 file:px-3 file:py-2 file:text-[11px] file:font-bold file:text-sky-300 hover:file:bg-sky-500/25"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            JPG, PNG o WebP · hasta 4 MB{form.id && form.imagen_url ? " · vacío conserva la imagen actual" : ""}
          </p>
          {form.imagen_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imagen_url} alt="Imagen actual del aviso" className="mt-2 h-20 w-32 rounded-lg object-cover" />
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="submit"
            disabled={guardando || excede}
            className="inline-flex h-10 items-center rounded-xl bg-sky-500 px-5 text-[12px] font-bold text-[#082F49] hover:bg-sky-400 disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          {form.id && (
            <button type="button" onClick={limpiar} className="inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-[12px] text-slate-300 hover:text-white">
              Nuevo
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
            {error}
          </p>
        )}
      </form>

      <ul className="flex flex-col gap-2">
        {(banners ?? []).map((b) => (
          <li key={b.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#082F49] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.imagen_url} alt={b.titulo} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{b.titulo}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-slate-300">{b.descripcion}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => editar(b)} className="rounded-md bg-sky-500/15 px-3 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500/25">
                Editar
              </button>
              <button type="button" onClick={() => quitar(b)} disabled={guardando} className="rounded-md bg-red-500/15 px-3 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-500/25">
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {banners?.length === 0 && (
        <p className="text-[12px] text-slate-400">Aún no hay avisos cargados.</p>
      )}
    </div>
  );
}
