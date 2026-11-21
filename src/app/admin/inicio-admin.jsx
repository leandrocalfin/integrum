"use client";

import { useRef, useState } from "react";
import { guardarHero, subirImagenHero, guardarEncadreHero } from "./actions";
import HeroEditor from "./hero-editor";

// Curva de la diagonal, relativa al rectángulo de la foto (igual que en el sitio).
const CLIP_PATH =
  "M0 1 C 0.0772 0.578, 0.1602 0.333, 0.2537 0.178 C 0.2938 0.111, 0.3353 0.033, 0.4125 0 L1 0 L1 1 Z";
const ASPECTO_FOTO = 1.184;

export default function InicioAdmin({ hero, onSaved }) {
  const [form, setForm] = useState(() => {
    const posicion = hero?.image_position ?? "0% 0%";
    const [px = 0, py = 0] = (
      posicion.match(/-?\d+(?:\.\d+)?/g) ?? ["0", "0"]
    ).map(Number);
    return {
      titulo: hero?.titulo ?? "",
      subtitulo: hero?.subtitulo ?? "",
      descripcion: hero?.descripcion ?? "",
      image_url: hero?.image_url ?? "",
      posX: Number.isFinite(px) ? px : 0,
      posY: Number.isFinite(py) ? py : 0,
      escala: Math.min(4, Math.max(1, Number(hero?.image_scale ?? 1) || 1)),
    };
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const inputRef = useRef(null);

  const limite = (form.escala - 1) * 50;
  const panX = Math.min(limite, Math.max(-limite, form.posX));
  const panY = Math.min(limite, Math.max(-limite, form.posY));
  const transform = `translate(${panX}%, ${panY}%) scale(${form.escala})`;

  const onChange = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setError("");
  };

  const elegirArchivo = (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    if (file.size > 4_000_000) {
      setError("La imagen pesa más de 4 MB");
      return;
    }
    setError("");
    setEditor({
      tipo: "nueva",
      file,
      source: URL.createObjectURL(file),
      posX: form.posX,
      posY: form.posY,
      escala: form.escala,
    });
  };

  const alSeleccionar = async ({ px, py, escala }) => {
    setGuardando(true);
    setError("");
    try {
      if (editor?.tipo === "nueva" && editor?.file) {
        // Una sola acción: sube el archivo Y guarda el encuadre elegido.
        const datos = new FormData();
        datos.set("file", editor.file);
        datos.set("image_position", `${px}% ${py}%`);
        datos.set("image_scale", String(escala));
        const res = await subirImagenHero(datos);
        if (res?.ok !== true) throw new Error(res?.error ?? "No se pudo subir la imagen");
        setForm((f) => ({
          ...f,
          image_url: res?.datos?.url ?? f.image_url,
          posX: px,
          posY: py,
          escala,
        }));
        onSaved("Imagen actualizada");
      } else {
        // Solo el encuadre de la imagen actual.
        const res = await guardarEncadreHero({
          image_position: `${px}% ${py}%`,
          image_scale: String(escala),
        });
        if (res?.ok !== true) throw new Error(res?.error ?? "No se pudo guardar el encuadre");
        setForm((f) => ({ ...f, posX: px, posY: py, escala }));
        onSaved("Encuadre actualizado");
      }
      setEditor(null);
    } catch (err) {
      setError(err.message ?? "No se pudo guardar");
      setEditor(null);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarEditor = () => setEditor(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setError("");
    const res = await guardarHero({
      titulo: form.titulo,
      subtitulo: form.subtitulo,
      descripcion: form.descripcion,
      image_position: `${panX}% ${panY}%`,
      image_scale: String(form.escala),
    });
    if (res?.ok === true) onSaved("Portada guardada");
    else setError(res?.error ?? "No se pudo guardar");
    setGuardando(false);
  };

  return (
    <>
      {editor && (
        <HeroEditor
          source={editor.source}
          initialPos={{ x: editor.posX, y: editor.posY }}
          initialScale={editor.escala}
          onCancel={() => {
            if (editor.source?.startsWith("blob:")) URL.revokeObjectURL(editor.source);
            cerrarEditor();
          }}
          onSelect={alSeleccionar}
        />
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="hero-image" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Imagen
          </label>

          {/* Vista previa: exactamente el rectángulo de la foto que se ve en la web
              (desde la diagonal hasta el borde), con el mismo encuadre. */}
          <svg aria-hidden="true" className="absolute h-0 w-0">
            <defs>
              <clipPath id="hero-preview-clip" clipPathUnits="objectBoundingBox">
                <path d={CLIP_PATH} />
              </clipPath>
            </defs>
          </svg>
          <div
            className="relative max-w-[360px] overflow-hidden rounded-xl border border-white/10 bg-[#0b2233]"
            style={{ width: "100%", aspectRatio: String(ASPECTO_FOTO) }}
          >
            {form.image_url ? (
              <div
                className="absolute inset-0"
                style={{ clipPath: "url(#hero-preview-clip)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.image_url}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                  style={{ transform, transformOrigin: "center" }}
                  onError={(e) => { e.currentTarget.style.opacity = "0.25"; }}
                />
              </div>
            ) : (
              <div className="grid h-full w-full place-items-center text-[12px] text-slate-500">
                Sin imagen seleccionada
              </div>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={guardando}
              className="absolute bottom-2 right-2 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-[12px] font-semibold text-white backdrop-blur-sm transition hover:bg-slate-950/95 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              Adjuntar imagen
            </button>
            {form.image_url && (
              <button
                type="button"
                onClick={() => {
                  setEditor({
                    tipo: "actual",
                    source: form.image_url,
                    posX: form.posX,
                    posY: form.posY,
                    escala: form.escala,
                  });
                }}
                disabled={guardando}
                className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-sky-500/90 px-3 py-2 text-[12px] font-semibold text-[#082F49] backdrop-blur-sm transition hover:bg-sky-400 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="5 9 2 12 5 15" />
                  <polyline points="19 9 22 12 19 15" />
                  <line x1="2" x2="22" y1="12" y2="12" />
                </svg>
                Editar encuadre
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={elegirArchivo}
              disabled={guardando}
              aria-label="Adjuntar imagen de portada"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            JPG, PNG o WebP. Máximo 4 MB. Se abre una vista previa para mover y
            redimensionar la foto como prefieras.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="hero-titulo" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Título (un salto de línea = dos líneas en el hero)
            </label>
            <textarea
              id="hero-titulo"
              required
              rows={2}
              maxLength={100}
              value={form.titulo}
              onChange={onChange("titulo")}
              className="h-16 w-full resize-none rounded-xl border border-white/10 bg-[#082F49]/70 px-3 py-2 text-[13px] leading-6 text-white outline-none placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
          <div>
            <label htmlFor="hero-subtitulo" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Subtítulo
            </label>
            <input
              id="hero-subtitulo"
              type="text"
              required
              maxLength={150}
              value={form.subtitulo}
              onChange={onChange("subtitulo")}
              className="h-10 w-full rounded-xl border border-white/10 bg-[#082F49]/70 px-3 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
        </div>

        <div>
          <label htmlFor="hero-descripcion" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Descripción
          </label>
          <textarea
            id="hero-descripcion"
            required
            rows={3}
            maxLength={500}
            value={form.descripcion}
            onChange={onChange("descripcion")}
            className="w-full rounded-xl border border-white/10 bg-[#082F49]/70 px-3 py-2 text-[13px] leading-6 text-white outline-none placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
          />
          <p className="mt-1 text-right text-[10px] text-slate-500">{form.descripcion.length}/500</p>
        </div>
        {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex h-10 items-center rounded-xl bg-sky-500 px-6 text-[13px] font-bold text-[#082F49] transition hover:bg-sky-400 disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </>
  );
}
