import Image from "next/image";
import Link from "next/link";
import { DEFAULT_CONTENT, buildWhatsAppTurnos } from "@/lib/contenido";

const soloDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");

const mapasDestino = (direccion) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    direccion
  )}`;

const navegacion = [
  { label: "Inicio", href: "/" },
  { label: "Nosotros", href: "/#nosotros" },
  { label: "Tratamientos", href: "/#tratamientos" },
  { label: "Preguntas", href: "/#preguntas" },
  { label: "Contacto", href: "/#contacto" },
];

const tratamientos = [
  "Ortodoncia con brackets",
  "Implantes dentales",
  "Alineadores invisibles",
  "Carillas dentales",
  "Tratamiento de conducto",
  "Odontología digital",
];

function Icono({ path, className = "h-4 w-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {path}
    </svg>
  );
}

function LetrasGrandes() {
  const anio = new Date().getFullYear();
  return (
    <div className="pb-12 pt-3 text-center text-[11px] leading-5 text-slate-400 sm:pb-5 sm:text-xs">
      <ul className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 sm:gap-x-2.5">
        <li>© {anio} Integrum Odontología. Todos los derechos reservados.</li>
        <li aria-hidden="true">•</li>
        <li>Río Gallegos, Santa Cruz</li>
        <li aria-hidden="true">•</li>
        <li>
          <Link
            href="/aviso-legal"
            className="underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            Aviso Legal
          </Link>
        </li>
        <li aria-hidden="true">•</li>
        <li>
          <Link
            href="/politica-de-privacidad"
            className="underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            Privacidad
          </Link>
        </li>
        <li aria-hidden="true">•</li>
        <li>
          <Link
            href="/politica-de-cookies"
            className="underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            Cookies
          </Link>
        </li>
        <li aria-hidden="true">•</li>
        <li>
          <Link
            href="/admin/login"
            className="underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            Acceso admin
          </Link>
        </li>
      </ul>
      <p className="mt-2">
        Sitio desarrollado por{" "}
        <a
          href="https://www.leandrocalfin.com.ar"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          Leandro Calfin
        </a>
      </p>
    </div>
  );
}

export default function Footer({ contacto }) {
  const data = contacto ?? DEFAULT_CONTENT.contacto;
  const DIRECCION = data.direccion;
  const HORARIO = data.horario;
  const PHONE_DISPLAY = data.telefono_turnos;
  const telHref = `tel:+54${soloDigitos(data.telefono_turnos)}`;
  const waTurnos = buildWhatsAppTurnos(data);
  const mapa =
    typeof data.mapa_url === "string" && data.mapa_url.startsWith("http")
      ? data.mapa_url
      : mapasDestino(DIRECCION);

  return (
    <footer className="w-full bg-[#0b2233] text-slate-300">
      {/* ============ MOBILE: footer compacto centrado ============ */}
      <div className="flex w-full flex-col items-center px-4 pb-4 pt-8 text-center sm:hidden">
        <Link
          href="/"
          aria-label="Integrum Odontología — Inicio"
          className="flex items-center gap-2.5"
        >
          <Image
            src="/logo_prueba.png"
            alt=""
            width={48}
            height={48}
            className="h-11 w-auto object-contain"
          />
          <Image
            src="/logo_prueba2.png"
            alt="Integrum — Salud & Estética"
            width={168}
            height={56}
            className="h-9 w-auto object-contain"
          />
        </Link>
        <p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-slate-400">
          Odontología integral en Río Gallegos. Prevención, estética y
          rehabilitación con profesionales matriculados.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <a
            href={data.instagram ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white transition-transform hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" />
              <circle cx="12" cy="12" r="4.2" />
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href={data.facebook ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white transition-transform hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a
            href={waTurnos}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
          </a>
        </div>
      </div>

      {/* ============ DESKTOP/TABLET: footer completo 4 columnas ============ */}
      <div className="mx-auto hidden w-full max-w-7xl sm:block">
        <div className="grid gap-6 px-4 pt-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:gap-8 lg:px-8">
          {/* Marca */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3"
              aria-label="Integrum Odontología — Inicio"
            >
              <Image
                src="/logo_prueba.png"
                alt=""
                width={48}
                height={48}
                className="h-11 w-auto object-contain"
              />
              <Image
                src="/logo_prueba2.png"
                alt="Integrum — Salud & Estética"
                width={168}
                height={56}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
              Odontología integral para toda la familia en Río Gallegos.
              Prevención, estética y rehabilitación con profesionales
              matriculados.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href={data.instagram ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-slate-300 transition-colors hover:text-white"
              >
                <Icono
                  path={
                    <>
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </>
                  }
                />
              </a>
              <a
                href={data.facebook ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-slate-300 transition-colors hover:text-white"
              >
                <Icono
                  path={
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  }
                />
              </a>
              <a
                href={waTurnos}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-slate-300 transition-colors hover:text-white"
              >
                <Icono
                  path={
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  }
                />
              </a>
              <a
                href={mapa}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ubicación en Google Maps"
                className="text-slate-300 transition-colors hover:text-white"
              >
                <Icono
                  path={
                    <>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </>
                  }
                />
              </a>
            </div>
          </div>

          {/* Navegación */}
          <nav aria-label="Enlaces del sitio">
            <h3>
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white sm:text-sm">
                Navegación
              </span>
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-sm">
              {navegacion.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Tratamientos */}
          <div>
            <h3>
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white sm:text-sm">
                Tratamientos
              </span>
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-sm">
              {tratamientos.map((t) => (
                <li key={t}>
                  <Link
                    href="/#tratamientos"
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3>
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white sm:text-sm">
                Contacto
              </span>
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-sm">
              <li className="flex gap-2.5">
                <Icono
                  className="mt-0.5 h-4 w-4 shrink-0 text-sky-400"
                  path={
                    <>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </>
                  }
                />
                <a
                  href={mapa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  {DIRECCION}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Icono
                  className="mt-0.5 h-4 w-4 shrink-0 text-sky-400"
                  path={
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  }
                />
                <a
                  href={telHref}
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Icono
                  className="mt-0.5 h-4 w-4 shrink-0 text-sky-400"
                  path={
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </>
                  }
                />
                <span className="text-slate-400">{HORARIO}</span>
              </li>
              <li className="flex gap-2.5">
                <Icono
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]"
                  path={
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  }
                />
                <a
                  href={waTurnos}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 transition-colors hover:text-white"
                >
                  Turnos por WhatsApp
                </a>
              </li>
              <li className="flex gap-2.5">
                <Icono
                  className="mt-0.5 h-4 w-4 shrink-0 text-sky-400"
                  path={
                    <>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </>
                  }
                />
                <span className="text-slate-400">
                  Swiss Medical · OSDE · SanCor Salud
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Línea inferior compartida */}
      <div className="mx-auto w-full max-w-7xl px-4">
        <div
          aria-hidden="true"
          className="mt-4 border-t border-white/10 sm:mt-6"
        />
        <LetrasGrandes />
      </div>
    </footer>
  );
}
