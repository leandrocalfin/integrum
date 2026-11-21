"use client";

import { useEffect, useRef, useState } from "react";

// Curva de la diagonal, relativa AL RECTÁNGULO DE LA FOTO (no al hero entero).
// Es la misma curva del sitio desplazada al origen de la caja de la imagen.
const CLIP_PATH =
  "M0 1 C 0.0772 0.578, 0.1602 0.333, 0.2537 0.178 C 0.2938 0.111, 0.3353 0.033, 0.4125 0 L1 0 L1 1 Z";

// Proporción del recorte real de la foto en el hero (ancho/alto aproximados).
// Así lo que se ve acá es lo mismo que se ve en el sitio.
const ASPECTO_FOTO = 1.184;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
// Sobrante máximo por lado para un zoom dado: nunca deja huecos.
const maxPan = (escala) => (escala - 1) * 50;

export default function HeroEditor({
  source,
  initialPos,
  initialScale,
  onCancel,
  onSelect,
}) {
  const [px, setPx] = useState(initialPos?.x ?? 0);
  const [py, setPy] = useState(initialPos?.y ?? 0);
  const [escala, setEscala] = useState(initialScale ?? 1);

  const areaRef = useRef(null);
  const pointers = useRef(new Map());
  const dragRef = useRef(null);
  const pinchRef = useRef(null);

  // Zoom con rueda del mouse (React lo escucha pasivo; lo manejamos con ref).
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setEscala((s) => clamp(Math.round((s + delta) * 100) / 100, 1, 4));
    };
    area.addEventListener("wheel", onWheel, { passive: false });
    return () => area.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e) => {
    e.preventDefault();
    const area = areaRef.current;
    if (!area) return;
    area.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      const rect = area.getBoundingClientRect();
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        px,
        py,
        ancho: Math.max(1, rect.width),
        alto: Math.max(1, rect.height),
        escala,
      };
      pinchRef.current = null;
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current = { dist, escala };
      dragRef.current = null;
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Pinch (dos dedos)
    if (pinchRef.current && pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (dist > 0 && pinchRef.current.dist > 0) {
        const factor = dist / pinchRef.current.dist;
        const nueva = clamp(
          Math.round(pinchRef.current.escala * factor * 100) / 100,
          1,
          4
        );
        setEscala(nueva);
        const limite = maxPan(nueva);
        setPx((v) => clamp(v, -limite, limite));
        setPy((v) => clamp(v, -limite, limite));
      }
      return;
    }

    // Arrastrar (un dedo / mouse): la foto sigue al cursor.
    if (dragRef.current) {
      const a = dragRef.current;
      const limite = maxPan(a.escala);
      const dx = ((e.clientX - a.x) / a.ancho) * 100;
      const dy = ((e.clientY - a.y) / a.alto) * 100;
      setPx(clamp(Math.round(a.px + dx), -limite, limite));
      setPy(clamp(Math.round(a.py + dy), -limite, limite));
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    pinchRef.current = null;
    const restante = [...pointers.current.values()][0];
    if (restante && areaRef.current) {
      const rect = areaRef.current.getBoundingClientRect();
      dragRef.current = {
        x: restante.x,
        y: restante.y,
        px,
        py,
        ancho: Math.max(1, rect.width),
        alto: Math.max(1, rect.height),
        escala,
      };
    } else {
      dragRef.current = null;
    }
  };

  const cambiarZoom = (nueva) => {
    const z = clamp(Math.round(nueva * 100) / 100, 1, 4);
    setEscala(z);
    const limite = maxPan(z);
    setPx((v) => clamp(v, -limite, limite));
    setPy((v) => clamp(v, -limite, limite));
  };

  const limite = maxPan(escala);
  const panX = clamp(px, -limite, limite);
  const panY = clamp(py, -limite, limite);
  const puedeMover = limite > 0.5;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mover y redimensionar la imagen"
      className="fixed inset-0 z-[70] flex flex-col bg-black"
    >
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <clipPath id="hero-editor-clip" clipPathUnits="objectBoundingBox">
            <path d={CLIP_PATH} />
          </clipPath>
        </defs>
      </svg>

      {/* Barra superior */}
      <div className="flex items-center justify-center border-b border-white/10 px-4 pb-3 pt-5">
        <p className="font-display text-[16px] font-semibold tracking-tight text-white">
          Mover y redimensionar
        </p>
      </div>

      {/* Solo el rectángulo de la foto (a partir de la diagonal) */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-5">
        <div
          ref={areaRef}
          className="relative touch-none select-none overflow-hidden rounded-xl bg-[#0b2233] shadow-2xl ring-1 ring-white/10"
          style={{
            width: "min(92vw, calc(58vh * 1.184), 640px)",
            aspectRatio: String(ASPECTO_FOTO),
            cursor: puedeMover ? "grab" : "default",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="absolute inset-0"
            style={{ clipPath: "url(#hero-editor-clip)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={source}
              alt="Vista previa de la portada"
              draggable={false}
              className="pointer-events-none h-full w-full object-cover"
              style={{
                transform: `translate(${panX}%, ${panY}%) scale(${escala})`,
                transformOrigin: "center",
              }}
            />
          </div>
          {/* Etiqueta de ayuda */}
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white/85">
            {puedeMover
              ? "Arrastrá para encuadrar"
              : "Acercá (rueda o +) para mover"}
          </span>
        </div>
      </div>

      {/* Zoom: botones + slider */}
      <div className="flex items-center gap-3 px-6">
        <button
          type="button"
          onClick={() => cambiarZoom(escala - 0.1)}
          aria-label="Alejar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-300 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path d="M19 13H5v-2h14v2z" />
          </svg>
        </button>
        <input
          type="range"
          min={1}
          max={4}
          step={0.02}
          value={escala}
          onChange={(e) => cambiarZoom(Number(e.target.value))}
          aria-label="Zoom de la imagen"
          className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-white/10 accent-sky-400"
        />
        <button
          type="button"
          onClick={() => cambiarZoom(escala + 0.1)}
          aria-label="Acercar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-300 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
      </div>
      <p className="px-6 pt-2 text-center text-[11px] text-slate-500">
        Zoom {Math.round(escala * 100)}% · la foto nunca deja espacios vacíos
      </p>

      {/* Barra inferior: Cancelar / Seleccionar */}
      <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-[15px] font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onSelect({ px: panX, py: panY, escala })}
          className="rounded-lg px-4 py-2 text-[15px] font-bold text-sky-400 transition-colors hover:text-sky-300"
        >
          Seleccionar
        </button>
      </div>
    </div>
  );
}
