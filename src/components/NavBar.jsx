"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { buildWhatsAppTurnos, DEFAULT_CONTENT } from "@/lib/contenido";
import { logoutAction } from "@/app/admin/actions";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const navItems = [
  { label: "Inicio", href: "/", id: "inicio" },
  { label: "Nosotros", href: "/#nosotros", id: "nosotros" },
  { label: "Tratamientos", href: "/#tratamientos", id: "tratamientos" },
  { label: "Preguntas", href: "/#preguntas", id: "preguntas" },
  { label: "Contacto", href: "/#contacto", id: "contacto" },
];

function CalendarIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function AvatarImg({ src }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Administrador Integrum"
      className="h-full w-full object-cover object-[center_18%]"
      onError={(e) => {
        const el = e.currentTarget;
        // Si la foto guardada no carga (bucket privado/borrado), se usa la
        // foto por defecto en vez de mostrar una imagen rota.
        if (!el.dataset.fallback) {
          el.dataset.fallback = "1";
          el.src = "/Mena.jpg";
        }
      }}
    />
  );
}

export default function NavBar({ contacto }) {
  const pathname = usePathname();
  const waHref = buildWhatsAppTurnos(contacto ?? DEFAULT_CONTENT.contacto);
  // Avatar configurable desde el panel; si no hay, se mantiene el actual.
  const avatarUrl = contacto?.avatar_url || "/Mena.jpg";
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [seccion, setSeccion] = useState("inicio");
  const [scrolled, setScrolled] = useState(false);
  const [adminMenu, setAdminMenu] = useState(false);
  // Detección de sesión de administrador en el cliente: el sitio público
  // queda estático (ISR) y solo quien navega con sesión ve el avatar.
  // Se consulta al servidor (lee las cookies de la petición, es confiable en
  // cada navegación) y se usa la sesión del navegador como respaldo.
  const [esAdmin, setEsAdmin] = useState(false);
  useEffect(() => {
    let vivo = true;
    const consultar = async () => {
      try {
        const r = await fetch("/api/sesion", { cache: "no-store" });
        if (!r.ok) throw new Error("sesion");
        const datos = await r.json();
        if (!vivo) return;
        if (datos?.autenticado && datos?.esAdmin === true) {
          setEsAdmin(true);
          return;
        }
      } catch {
        // sin conexión o endpoint caído: se prueba con la sesión local
      }
      if (!supabaseBrowser) return;
      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();
        if (!session || !vivo) return;
        const { data, error } = await supabaseBrowser.rpc("is_admin");
        if (!error && data === true) setEsAdmin(true);
      } catch {
        // sin sesión: no se muestra el avatar de administrador
      }
    };

    consultar();
    // Por si recién se refrescaron las cookies en /admin/login
    const t = setTimeout(consultar, 900);

    const sub = supabaseBrowser?.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_IN" || evento === "TOKEN_REFRESHED") consultar();
    });

    const onVisibilidad = () => {
      if (document.visibilityState === "visible") consultar();
    };
    document.addEventListener("visibilitychange", onVisibilidad);

    return () => {
      vivo = false;
      clearTimeout(t);
      sub?.subscription?.unsubscribe?.();
      document.removeEventListener("visibilitychange", onVisibilidad);
    };
  }, [pathname]);

  // Cerrar el menú de administrador con Escape (al navegar lo cierran los links)
  useEffect(() => {
    if (!adminMenu) return;
    const onKey = (e) => { if (e.key === "Escape") setAdminMenu(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adminMenu]);

  // Al scrollear, la barra flotante se vuelve esmerilada oscura
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll spy: marca la sección visible (Inicio / Nosotros / Tratamientos / Preguntas / Contacto)
  useEffect(() => {
    const ids = ["nosotros", "tratamientos", "preguntas", "contacto"];
    const onScroll = () => {
      // Al final de la página, marcar Contacto (escroll máximo alcanzado)
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 80;
      if (nearBottom) {
        setSeccion("contacto");
        return;
      }
      const offset = 150; // navbar + margen de la sección (scroll-mt-30 = 120px)
      let actual = "inicio";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) actual = id;
      }
      setSeccion(actual);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const raf = requestAnimationFrame(onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  const isActive = (href) => {
    if (href === "/") return pathname === "/" && seccion === "inicio";
    if (href.startsWith("/#")) return pathname === "/" && seccion === href.slice(2);
    return pathname === href;
  };

  // Si ya estamos en el inicio, evitamos la navegación de Next para que el
  // scroll suave no se corte y llegue hasta arriba de todo.
  const irAlInicio = (e) => {
    if (pathname !== "/") return;
    e.preventDefault();
    if (window.location.hash) {
      window.history.replaceState(null, "", "/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDesktopLinkClasses = (active) => `
                  relative
                  px-4
                  py-2.5
                  text-base
                  font-semibold
                  transition-colors
                  duration-300
                  ${
                    active
                      ? "text-white after:opacity-100"
                      : "text-white/75 hover:text-white after:opacity-0 hover:after:opacity-100"
                  }
                  after:absolute
                  after:bottom-1
                  after:left-4
                  after:right-4
                  after:h-[2px]
                  after:rounded-full
                  after:bg-gradient-to-r
                  after:from-sky-300
                  after:to-sky-600
                  after:transition-opacity
                  after:duration-300
                `;

  const closeMenu = () => setNavbarOpen(false);

  // En el home el navbar flota sobre el hero oscuro; en el resto de las páginas
  // (/admin, /admin/login) pasa a ser sticky sólido para no taparle el texto.
  const home = pathname === "/";

  return (
    <nav
      className={`${home ? "fixed left-0 right-0 top-0" : "sticky top-0"} z-50 w-full border-b px-4 py-4 transition-all duration-300 sm:px-6 md:py-5 lg:px-10 ${
        scrolled || !home
          ? "border-white/10 bg-[#0b2233]/70 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      {/* Barra flotante, SIN recuadro: logo + links + CTA directamente sobre el hero */}
      <div className="flex h-14 w-full items-center justify-between">
        {/* LOGO */}
        <Link
          href="/"
          onClick={(e) => {
            closeMenu();
            irAlInicio(e);
          }}
          aria-label="Integrum Odontología — Inicio"
          className="flex items-center transition-transform duration-300 hover:scale-105"
        >
          <span className="flex items-center gap-2.5">
            <Image
              src="/logo_prueba.png"
              alt=""
              width={48}
              height={48}
              priority
              className="h-12 w-auto object-contain drop-shadow-[0_0_14px_rgba(56,189,248,0.6)]"
            />
            <Image
              src="/logo_prueba2.png"
              alt="inteGrum — Salud & Estética"
              width={168}
              height={56}
              priority
              className="h-10 w-auto object-contain sm:h-11"
            />
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={item.href === "/" ? irAlInicio : closeMenu}
              aria-current={isActive(item.href) ? "true" : undefined}
              className={getDesktopLinkClasses(isActive(item.href))}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA desktop + avatar de administrador (solo con sesión), igual que Javier Vera */}
        <div className="hidden items-center gap-3 xl:flex">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-950/30 transition-all duration-300 hover:scale-105 hover:brightness-110"
          >
            <CalendarIcon className="h-4 w-4" />
            Solicitar turno
          </a>

          {esAdmin && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setAdminMenu((v) => !v)}
                aria-label="Menú de administrador"
                aria-haspopup="true"
                aria-expanded={adminMenu}
                className="block h-11 w-11 overflow-hidden rounded-full border-2 border-sky-500 shadow-sm transition hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              >
                <AvatarImg src={avatarUrl} />
              </button>
              {adminMenu && (
                <>
                  <button
                    type="button"
                    aria-label="Cerrar menú"
                    tabIndex={-1}
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setAdminMenu(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0b2233] py-1 shadow-xl"
                  >
                    <p className="border-b border-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                      Administrador
                    </p>
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => setAdminMenu(false)}
                      className="block px-4 py-2.5 text-[13px] font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Ir al panel
                    </Link>
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        role="menuitem"
                        className="block w-full px-4 py-2.5 text-left text-[13px] font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        Cerrar sesión
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* MOBILE: imagen de perfil con su propio menú, FUERA del menú hamburguesa */}
        {esAdmin && (
          <div className="relative ml-auto mr-2 xl:hidden">
            <button
              type="button"
              onClick={() => setAdminMenu((v) => !v)}
              aria-label="Menú de administrador"
              aria-haspopup="true"
              aria-expanded={adminMenu}
              className="block h-9 w-9 overflow-hidden rounded-full border-2 border-sky-500 shadow-sm transition hover:border-sky-400"
            >
              <AvatarImg src={avatarUrl} />
            </button>
            {adminMenu && (
              <>
                <button
                  type="button"
                  aria-label="Cerrar menú"
                  tabIndex={-1}
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setAdminMenu(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0b2233] py-1 shadow-xl"
                >
                  <p className="border-b border-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                    Administrador
                  </p>
                  <Link
                    href="/admin"
                    role="menuitem"
                    onClick={() => setAdminMenu(false)}
                    className="block px-4 py-2.5 text-[13px] font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Ir al panel
                  </Link>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      role="menuitem"
                      className="block w-full px-4 py-2.5 text-left text-[13px] font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}

        {/* MOBILE: hamburguesa */}
        <button
          type="button"
          onClick={() => setNavbarOpen((v) => !v)}
          aria-label="Abrir menú"
          aria-expanded={navbarOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-all duration-300 hover:bg-white/10 xl:hidden"
        >
          {navbarOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* DROPDOWN MENU - mobile: panel a todo el ancho, como el sitio de referencia */}
      <div
        className={`absolute left-0 right-0 top-full w-full border-b border-white/10 bg-[#0b2233]/95 backdrop-blur-xl transition-all duration-300 xl:hidden ${
          navbarOpen ? "max-h-[36rem] opacity-100" : "max-h-0 overflow-hidden opacity-0"
        }`}
      >
        <div className="px-4 py-2 sm:px-6">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  closeMenu();
                  if (item.href === "/") irAlInicio(e);
                }}
                aria-current={active ? "true" : undefined}
                className={`
                  block
                  text-center
                  px-3
                  py-2.5
                  text-sm
                  font-medium
                  transition-colors
                  duration-300
                  ${
                    active
                      ? "text-white"
                      : "text-white/75 hover:text-white"
                  }
                  ${
                    index < navItems.length - 1
                      ? "border-b border-white/10"
                      : ""
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:brightness-110"
          >
            <CalendarIcon className="h-4 w-4" />
            Solicitar turno
          </a>
        </div>
      </div>
    </nav>
  );
}
