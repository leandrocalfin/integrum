"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Images,
  Users,
  Stethoscope,
  MessageCircleQuestion,
  PhoneCall,
  ShieldCheck,
  Megaphone,
  LogOut,
} from "lucide-react";
import { useTransition } from "react";
import { logoutAction } from "./actions";
import InicioAdmin from "./inicio-admin";
import NosotrosAdmin from "./nosotros-admin";
import ObrasSocialesAdmin from "./obras-admin";
import EquipoAdmin from "./equipo-admin";
import TratamientosAdmin from "./tratamientos-admin";
import PreguntasAdmin from "./preguntas-admin";
import DatosAdmin from "./datos-admin";
import BannersAdmin from "./banners-admin";
import PerfilAdmin from "./perfil-admin";

const SECCIONES = [
  { id: "inicio", label: "Inicio", icon: LayoutDashboard, desc: "Imagen, título, subtítulo y texto de la portada del sitio" },
  { id: "nosotros", label: "Nosotros", icon: Images, desc: "Descripción de la sección Nosotros, galería de fotos/videos y obras sociales" },
  { id: "equipo", label: "Equipo", icon: Users, desc: "Profesionales: nombre, foto, matrícula y orden" },
  { id: "tratamientos", label: "Tratamientos", icon: Stethoscope, desc: "Tarjetas de servicio: imagen, nombre, descripción, orden" },
  { id: "preguntas", label: "Preguntas", icon: MessageCircleQuestion, desc: "Preguntas frecuentes del sitio" },
  { id: "avisos", label: "Avisos", icon: Megaphone, desc: "Carteles flotantes: título, descripción (hasta 30 palabras) e imagen" },
  { id: "datos", label: "Datos y redes", icon: PhoneCall, desc: "Dirección, horario, teléfono de turnos y redes sociales" },
  { id: "perfil", label: "Perfil y seguridad", icon: ShieldCheck, desc: "Foto de perfil del administrador y cambio de contraseña" },
];

export default function Panel({ contenido, email }) {
  const router = useRouter();
  const [tab, setTab] = useState("inicio");
  const [toast, setToast] = useState(null);
  const [pending, start] = useTransition();

  // Cierre por inactividad: 5 min sin mover el mouse/teclado = logout.
  useEffect(() => {
    let t;
    const LIMITE = 5 * 60 * 1000;
    const salir = async () => {
      try {
        await logoutAction();
      } catch {
        window.location.href = "/admin/login?motivo=inactividad";
      }
    };
    const reset = () => {
      clearTimeout(t);
      t = setTimeout(salir, LIMITE);
    };
    const eventos = ["click", "keydown", "scroll", "mousemove", "touchstart"];
    eventos.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(t);
      eventos.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  const avisar = (texto) => {
    setToast(texto);
    window.clearTimeout((avisar.timer));
    avisar.timer = window.setTimeout(() => setToast(null), 2600);
    start(() => router.refresh());
  };

  const seccion = SECCIONES.find((s) => s.id === tab);

  return (
    <main className="relative flex flex-1 flex-col items-stretch px-3 py-5 sm:px-5 sm:py-6">
      <div className="mx-auto grid w-full min-w-0 max-w-6xl grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        {/* MOBILE: tabs arriba */}
        <div className="rounded-2xl border border-white/10 bg-sky-950 p-4 md:hidden">
          <h1 className="font-display text-[17px] font-bold leading-tight text-white">
            Panel de administración
          </h1>
          <p className="text-[12px] leading-tight text-slate-400">
            Gestioná el contenido del sitio
          </p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {SECCIONES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setTab(s.id);
                  window.scrollTo({ top: 0 });
                }}
                aria-current={tab === s.id ? "page" : undefined}
                className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-full border px-1 py-2 text-[10px] font-semibold transition-colors ${
                  tab === s.id
                    ? "border-sky-400 bg-sky-500 text-[#082F49]"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white"
                }`}
              >
                <s.icon size={12} className="shrink-0" /> {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* SIDEBAR */}
        <nav className="hidden min-w-0 space-y-1.5 rounded-2xl border border-white/10 bg-sky-950 p-2.5 shadow-lg md:block md:self-start">
          <div className="px-3 pb-3 pt-4">
            <h1 className="font-display text-[16px] font-bold leading-[1.15] tracking-tight text-white">
              Panel de administración
            </h1>
            <p className="mt-1 text-[12px] font-medium leading-snug text-slate-400">
              Gestioná el contenido del sitio
            </p>
            {email && (
              <p className="mt-2 truncate text-[10px] uppercase tracking-[0.2em] text-sky-400/80">
                {email}
              </p>
            )}
          </div>
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setTab(s.id);
                window.scrollTo({ top: 0 });
              }}
              aria-current={tab === s.id ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors ${
                tab === s.id
                  ? "border border-sky-400 bg-sky-500 text-[#082F49] shadow"
                  : "border border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <s.icon size={16} className="shrink-0" /> {s.label}
            </button>
          ))}
          <div className="mt-1 border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={() => logoutAction()}
              className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-2.5 text-[13px] font-semibold text-red-300 transition-colors hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-200"
            >
              <LogOut size={16} className="shrink-0" /> Salir
            </button>
          </div>
        </nav>

        {/* CONTENIDO */}
        <div className="min-h-[360px] min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/10 bg-sky-950/95 p-4 shadow-2xl sm:p-5">
          <div>
            <h2 className="font-display text-[17px] font-bold capitalize tracking-tight text-white">{seccion?.label}</h2>
            <p className="mt-1 text-[12px] leading-5 text-slate-400">{seccion?.desc}</p>
          </div>

          <div className="mt-4">
            {tab === "inicio" && <InicioAdmin hero={contenido.hero} onSaved={avisar} />}
            {tab === "nosotros" && (
              <div className="flex flex-col gap-6">
                <NosotrosAdmin nosotros={contenido.nosotros} galeria={contenido.galeria} onSaved={avisar} />
                <ObrasSocialesAdmin obrasSociales={contenido.obrasSociales} onSaved={avisar} />
              </div>
            )}
            {tab === "equipo" && (
              <EquipoAdmin especialistas={contenido.especialistas} onSaved={avisar} />
            )}
            {tab === "tratamientos" && (
              <TratamientosAdmin tratamientos={contenido.tratamientos} onSaved={avisar} />
            )}
            {tab === "preguntas" && (
              <PreguntasAdmin preguntas={contenido.preguntas} onSaved={avisar} />
            )}
            {tab === "avisos" && (
              <BannersAdmin banners={contenido.banners ?? []} onSaved={avisar} />
            )}
            {tab === "datos" && <DatosAdmin contacto={contenido.contacto} onSaved={avisar} />}
            {tab === "perfil" && (
              <PerfilAdmin
                contacto={contenido.contacto}
                email={email}
                onSaved={avisar}
              />
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-4 z-50 flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-800 px-4 py-2.5 text-[13px] font-semibold text-white shadow-xl xl:absolute xl:right-6 xl:top-6"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 5 5L20 7" />
          </svg>
          {toast}
        </div>
      )}
    </main>
  );
}
