"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Activa los bloques con `data-reveal` cuando entran en pantalla (y al
// cargar la página). El IntersectionObserver cubre el scroll normal; además
// se hace un barrido manual al montar y al hacer scroll para los saltos
// instantáneos (anchors tipo /#tratamientos, `scrollIntoView`, fin de
// página), donde los elementos que quedan por encima nunca "intersectan".
// Se re-escanea en cada cambio de ruta porque el layout no se desmonta.
export default function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    const items = Array.from(document.querySelectorAll("[data-reveal]:not(.is-visible)"));
    if (!items.length) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const pendiente = new Set(items);
    const observer = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) mostrar(entrada.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );

    const mostrar = (el) => {
      el.classList.add("is-visible");
      pendiente.delete(el);
      observer.unobserve(el);
      if (pendiente.size === 0) {
        window.removeEventListener("scroll", comprobar);
      }
    };

    const comprobar = () => {
      for (const el of Array.from(pendiente)) {
        const r = el.getBoundingClientRect();
        // 8% de margen por debajo de la línea de corte visual
        if (r.top < window.innerHeight * 0.92) mostrar(el);
      }
    };

    items.forEach((el) => observer.observe(el));
    comprobar();
    window.addEventListener("scroll", comprobar, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", comprobar);
    };
  }, [pathname]);

  return null;
}
