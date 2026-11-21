"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

const FOTOS_DEFAULT = [
  {
    src: "/Nosotros1.png",
    alt: "Fachada del Centro Odontológico Integrum",
    caption: "Centro Odontológico Integrum",
    sub: "Río Gallegos, Santa Cruz",
  },
  {
    src: "/Nosotros3.png",
    alt: "Consultorio completo con sillón, escritorio y puerta con nombre del odontólogo",
    caption: "Consultorio principal",
    sub: "Cirugía, implantes y prótesis",
  },
  {
    src: "/Nosotros4.png",
    alt: "Consultorio con sillón odontológico y gabinetes blancos",
    caption: "Consultorio de diagnóstico",
    sub: "Equipamiento de última generación",
  },
  {
    src: "/Nosotros5.png",
    alt: "Consultorio privado del Integrum con área de atención y sillones",
    caption: "Consultorio privado",
    sub: "Un ambiente cálido para tu consulta",
  },
  {
    src: "/Nosotros6.png",
    alt: "Consultorio con sillón odontológico, gabinetes blancos y espacio de atención",
    caption: "Consultorio equipado",
    sub: "Tecnología y comodidad en cada consulta",
  },
  {
    src: "/Nosotros7.png",
    alt: "Sala de espera con butacas azules y puerta del Consultorio 2",
    caption: "Sala de espera",
    sub: "Consultorio 2 · Atención por turno",
  },
  {
    src: "/Nosotros8.png",
    alt: "Hall principal del Integrum con butacas, consultorios y piso decorativo",
    caption: "Hall principal",
    sub: "Bienvenidos al Integrum",
  },
];

export default function GalleryCarousel({ fotos }) {
  const FOTOS =
    Array.isArray(fotos) && fotos.length > 0
      ? fotos.map((f) => ({
          src: f.src,
          alt: f.alt || "Foto del consultorio",
          caption: f.caption || f.alt || "Foto del consultorio",
          sub: f.sub || "",
        }))
      : FOTOS_DEFAULT;
  const [index, setIndex] = useState(0);
  const total = FOTOS.length;

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + total) % total),
    [total]
  );
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);

  // Navegación con flechas del teclado
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const foto = FOTOS[index];

  return (
    <div className="w-full">
      {/* Visor principal */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-xl ring-1 ring-slate-900/10">
        <Image
          key={foto.src}
          src={foto.src}
          alt={foto.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-center"
          priority={index === 0}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sky-950/85 via-sky-950/10 to-transparent"
        />
        {/* Flechas */}
        <button
          type="button"
          onClick={prev}
          aria-label="Foto anterior"
          className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Foto siguiente"
          className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        {/* Contador + epígrafe */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 px-5 pb-5">
          <div>
            <p className="font-display text-lg font-semibold leading-tight text-white">
              {foto.caption}
            </p>
            <p className="text-xs text-sky-100">{foto.sub}</p>
          </div>
          <span className="rounded-full bg-sky-950/70 px-3 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur-sm">
            {index + 1} / {total}
          </span>
        </div>
      </div>

      {/* Miniaturas */}
      <div className="mt-3 grid grid-cols-7 gap-2">
        {FOTOS.map((f, i) => {
          const activa = i === index;
          return (
            <button
              key={f.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}: ${f.caption}`}
              aria-pressed={activa}
              className={`relative h-16 overflow-hidden rounded-2xl transition-all duration-200 sm:h-20 ${
                activa
                  ? "ring-2 ring-sky-950 ring-offset-2 ring-offset-white"
                  : "opacity-55 hover:opacity-90"
              }`}
            >
              <Image
                src={f.src}
                alt={f.alt}
                fill
                sizes="120px"
                className="object-cover object-center"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
