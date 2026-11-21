"use client";

import Image from "next/image";
import { useState } from "react";

// Imagen del hero con respaldo automático: si la URL guardada en Supabase
// está rota (por ejemplo, un archivo que ya no existe en el bucket), en vez
// de mostrar una imagen rota se usa la foto local por defecto.
export default function HeroImage({ src, fallback, alt, ...props }) {
  const original = src || fallback;
  const [estado, setEstado] = useState({ src: original, fallo: false });

  // Si cambia la imagen desde el panel, se reinicia el estado de error.
  // (Patrón de React para ajustar estado durante el render, sin useEffect.)
  if (estado.src !== original) {
    setEstado({ src: original, fallo: false });
  }

  const actual = estado.fallo ? fallback : original;

  return (
    <Image
      src={actual}
      alt={alt}
      onError={() => {
        if (!estado.fallo) setEstado({ src: original, fallo: true });
      }}
      {...props}
    />
  );
}
