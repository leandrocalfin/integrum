import Link from "next/link";
import Image from "next/image";
import {
  getContenido,
  buildWhatsAppTurnos,
  buildWhatsAppTratamientos,
} from "@/lib/contenido";
import HeroImage from "@/components/HeroImage";
import GalleryCarousel from "@/components/GalleryCarousel";
import FaqSection from "@/components/FaqSection";
import ContactoSection from "@/components/ContactoSection";
import ObraSocialBadge from "@/components/ObraSocialBadge";

// Silueta de ícono por palabra clave del nombre del tratamiento/profesional.
// (Los nombres vienen de Supabase: si no matchea ninguna palabra, se usa
// el diente genérico.)
const iconoPorNombre = (nombre) => {
  const n = String(nombre ?? "").toLowerCase();
  if (/(ortodoncia|brackets|braket)/.test(n)) return "brackets";
  if (/implante/.test(n)) return "implantes";
  if (/alineador/.test(n)) return "alineadores";
  if (/(atm|articulaci)/.test(n)) return "atm";
  if (/carilla/.test(n)) return "carillas";
  if (/(conducto|endodoncia)/.test(n)) return "conducto";
  if (/digital/.test(n)) return "digital";
  if (/blanquea/.test(n)) return "blanqueamiento";
  if (/periodoncia/.test(n)) return "periodoncia";
  return undefined;
};

const inicialesDe = (nombre) =>
  String(nombre ?? "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const equipoFallback = [
  {
    nombre: "Martín Oscar Mena",
    especialidad:
      "Implantes · Cirugía · Prótesis · Odontología Digital · Estética orofacial · MP 385",
    foto_url: "/Mena.jpg",
  },
  {
    nombre: "Nadia Romina Moraes",
    especialidad: "Ortodoncia · Ortopedia · Odontopediatría · MP 484",
    foto_url: "/Moraes.jpg",
  },
];

const tratamientosFallback = [
  {
    nombre: "Ortodoncia con Brackets",
    descripcion:
      "Dientes alineados para una sonrisa perfecta, con la técnica que mejor se adapta a vos.",
    imagen_url: "/ortodoncia.jpg",
    alt: "Paciente con brackets durante su tratamiento de ortodoncia",
  },
  {
    nombre: "Implantes Dentales",
    descripcion:
      "Recuperá la confianza al sonreír con implantes de alta precisión.",
    imagen_url: "/protesisDentales.jpg",
    alt: "Prótesis dental sobre implantes para recuperar la sonrisa",
  },
  {
    nombre: "Alineadores Invisibles",
    descripcion:
      "Alineá tu sonrisa de forma práctica y discreta, sin que nadie lo note.",
    imagen_url: "/alineador.jpg",
    alt: "Sonrisa evaluada con espejo dental para alineadores invisibles",
  },
  {
    nombre: "Tratamiento de ATM",
    descripcion:
      "Alivio del dolor y de la articulación mandibular con abordaje integral.",
    imagen_url: "/Fisioterapia-ATM.webp",
    alt: "Fisioterapia mandibular para el tratamiento de la ATM",
  },
  {
    nombre: "Carillas Dentales",
    descripcion:
      "Una sonrisa impecable al instante con carillas hechas a tu medida.",
    imagen_url: "/carillas.jpg",
    alt: "Paciente admirando su nueva sonrisa con carillas frente al espejo",
  },
  {
    nombre: "Tratamiento de Conducto",
    descripcion:
      "Endodoncia moderna: rescatamos tu diente sin dolor y con la mejor tecnología.",
    imagen_url: "/tratamientoConducto.jpg",
    alt: "Instrumentación y tratamiento endodóntico en el sillón",
  },
  {
    nombre: "Odontología Digital",
    descripcion:
      "Escaneo intraoral y planificación digital para prótesis y tratamientos de precisión.",
    imagen_url: "/odontologia_digital.jpg",
    alt: "Odontología digital: escaneo intraoral y planificación 3D",
  },
  {
    nombre: "Blanqueamiento Dental",
    descripcion:
      "Dientes hasta 8 tonos más blancos con técnicas seguras e inmediatas.",
    imagen_url: "/blaqueamiento.jpg",
    alt: "Blanqueamiento dental con lámpara LED",
  },
  {
    nombre: "Periodoncia",
    descripcion:
      "Cuidá tus encías y prevení la pérdida dental con terapia periodontal.",
    imagen_url: "/periodoncia-v2.jpg",
    alt: "Inflamación de encías tratada con instrumentación periodontal",
  },
];

function TratamientoIcon({ tipo, className = "h-8 w-8" }) {
  // Silueta de diente reutilizable para la mayoría de los tratamientos
  const diente =
    "M12 2.5c-2.1 0-2.9 1.3-4.8 1.3-1.6 0-3.2 1.2-3.2 3.3 0 3.4 1.9 4.7 2.6 8.9.3 1.9 1 4.1 2.9 4.1 1.6 0 1.7-2 2.1-4.1.2-1.2 1.1-1.9 2.4-1.9s2.2.7 2.4 1.9c.4 2.1.5 4.1 2.1 4.1 1.9 0 2.6-2.2 2.9-4.1.7-4.2 2.6-5.5 2.6-8.9 0-2.1-1.6-3.3-3.2-3.3-1.9 0-2.7-1.3-4.8-1.3Z";

  const iconos = {
    brackets: (
      <>
        <rect x="7" y="7" width="3.6" height="10" rx="1" />
        <rect x="13.4" y="7" width="3.6" height="10" rx="1" />
        <path d="M2 12h5M17 12h5" />
      </>
    ),
    implantes: (
      <>
        <path d={diente} />
        <path d="M12 8.6v6.2M10.4 10.6h3.2M10.4 12.8h3.2" />
      </>
    ),
    alineadores: (
      <>
        <path d="M4 8.4v2.8a8 8 0 0 0 16 0V8.4" />
        <path d="M3.6 8.2c2.8-1.7 13.9-1.7 16.7 0" />
        <path d="M8 8.6V11M12 8.6v3.2M16 8.6V11" />
      </>
    ),
    atm: (
      <>
        <path d="M4 6.5h16v6a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" />
        <path d="M8 6.5v3M12 6.5v3M16 6.5v3" />
      </>
    ),
    carillas: (
      <>
        <path d={diente} />
        <path d="M18.6 3.4v2.6M17.3 4.7h2.6" />
      </>
    ),
    conducto: (
      <>
        <path d={diente} />
        <path d="M9.7 13.4c.5 1.9.7 3.7.9 5.5M14.3 13.4c-.5 1.9-.7 3.7-.9 5.5" />
      </>
    ),
    digital: (
      <>
        <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" />
        <path d="M4 7.5 12 12l8-4.5M12 12v9" />
      </>
    ),
    blanqueamiento: (
      <>
        <path d={diente} />
        <path d="m18.4 3 .8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" />
      </>
    ),
    periodoncia: (
      <>
        <path d={diente} />
        <path d="M4.6 16.8c2.4 1.5 12.4 1.5 14.8 0" />
      </>
    ),
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {iconos[tipo] ?? <path d={diente} />}
    </svg>
  );
}

export default async function Home() {
  const {
    hero,
    nosotros,
    galeria,
    especialistas,
    tratamientos,
    preguntas,
    obrasSociales,
    contacto,
  } = await getContenido();

  const waTurnos = buildWhatsAppTurnos(contacto);
  const waTratamientos = buildWhatsAppTratamientos(contacto);

  const heroImage = hero?.image_url || "/consulta-dental-moderna.jpg";
  // Encuadre: la posición guarda el desplazamiento (X% Y%) del encuadre y la
  // escala el zoom. El desplazamiento se limita para que la foto nunca deje
  // huecos dentro de su recorte (máximo = mitad del sobrante que crea el zoom).
  const heroEncuadre = String(hero?.image_position || "0% 0%");
  const [heroXGuardado = 0, heroYGuardado = 0] = (
    heroEncuadre.match(/-?\d+(?:\.\d+)?/g) ?? ["0", "0"]
  ).map(Number);
  const heroEscala = Math.min(4, Math.max(1, Number(hero?.image_scale ?? 1) || 1));
  const heroMaxPan = (heroEscala - 1) * 50;
  const heroPanX = Math.min(heroMaxPan, Math.max(-heroMaxPan, heroXGuardado));
  const heroPanY = Math.min(heroMaxPan, Math.max(-heroMaxPan, heroYGuardado));
  const heroTransform = `translate(${heroPanX}%, ${heroPanY}%) scale(${heroEscala})`;
  const heroTitulo = String(hero?.titulo || "Centro\nOdontológico");
  const heroSubtitulo =
    hero?.subtitulo || "Salud, confianza y bienestar en cada sonrisa.";
  const heroDescripcion =
    hero?.descripcion ||
    "Brindamos atención odontológica integral, combinando experiencia profesional, tecnología y un enfoque personalizado para cada paciente.";
  const tituloLineas = heroTitulo.split("\n");

  const fotos = (Array.isArray(galeria) ? galeria : [])
    .filter((f) => f?.tipo === "foto" && f?.src)
    .map((f) => ({
      src: f.src,
      alt: f.alt,
      caption: f.caption,
      sub: f.sub,
    }));

  const equipoView = (
    Array.isArray(especialistas) && especialistas.length > 0
      ? especialistas
      : equipoFallback
  ).map((e) => ({
    nombre: e.nombre,
    especialidad:
      [e.especialidad, e.matricula].filter(Boolean).join(" · ") ||
      e.especialidad ||
      "",
    foto_url: e.foto_url,
    iniciales: inicialesDe(e.nombre),
    icono: iconoPorNombre(`${e.especialidad ?? ""} ${e.nombre ?? ""}`),
  }));

  const tratamientosView = (
    Array.isArray(tratamientos) && tratamientos.length > 0
      ? tratamientos
      : tratamientosFallback
  ).map((t) => ({
    nombre: t.nombre,
    descripcion: t.descripcion,
    imagen_url: t.imagen_url,
    alt: t.alt,
    icono: iconoPorNombre(t.nombre),
  }));

  const nosotrosParrafos = String(nosotros?.descripcion ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const obrasView =
    Array.isArray(obrasSociales) && obrasSociales.length > 0
      ? obrasSociales.filter((o) => o.visible !== false)
      : [
          { id: "sw", nombre: "Swiss Medical", icono: "swiss" },
          { id: "os", nombre: "OSDE", icono: "osde" },
          { id: "sc", nombre: "SanCor Salud", icono: "sancor" },
        ];

  return (
    <main className="flex flex-1 flex-col bg-white">
      {/* Envoltura de 100vh SOLO para hero + franja: la franja termina exactamente en el borde inferior */}
      <div className="flex flex-col lg:h-screen">
      {/* Hero: imagen full-bleed con panel oscuro a la izquierda (estilo referencia) */}
      <section className="relative min-h-[520px] w-full flex-1 overflow-hidden bg-[#0b2233] sm:min-h-[560px] lg:min-h-[540px]">
        {/* Mobile: imagen completa con degradado desde la izquierda */}
        <div className="reveal absolute inset-0 md:hidden" data-reveal style={{ "--d": 0 }}>
          <HeroImage
            src={heroImage}
            fallback="/consulta-dental-moderna.jpg"
            alt="Consulta dental moderna y luminosa"
            fill
            sizes="100vw"
            className="object-cover"
            style={{ transform: heroTransform }}
            priority
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0b2233]/95 via-[#0b2233]/60 to-transparent"
          />
          {/* Franja superior para legibilidad del navbar */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0b2233]/80 to-transparent"
          />
        </div>

        {/* Desktop: la imagen ocupa la mitad derecha, cortada en diagonal (curva tipo referencia).
            La imagen usa object-cover: cualquier foto entra y se acomoda sin deformarse. */}
        <div className="reveal absolute inset-0 hidden md:block" data-reveal style={{ "--d": 0 }}>
          {/* Definiciones del recorte en unidades relativas (objectBoundingBox) */}
          <svg aria-hidden="true" className="absolute h-0 w-0">
            <defs>
              {/* Recorte relativo AL RECTÁNGULO DE LA FOTO (no al hero entero):
                  así la imagen se ajusta al área visible y no se agranda de más. */}
              <clipPath id="heroClip" clipPathUnits="objectBoundingBox">
                <path d="M0 1 C 0.0772 0.578, 0.1602 0.333, 0.2537 0.178 C 0.2938 0.111, 0.3353 0.033, 0.4125 0 L1 0 L1 1 Z" />
              </clipPath>
            </defs>
          </svg>
          {/* Rectángulo de la foto: empieza en la diagonal (32,6%) y llega al borde */}
          <div
            className="absolute inset-y-0 right-0 left-[32.6%]"
            style={{ clipPath: "url(#heroClip)" }}
          >
            <HeroImage
              src={heroImage}
              fallback="/consulta-dental-moderna.jpg"
              alt="Consulta dental moderna y luminosa"
              fill
              sizes="(max-width: 768px) 100vw, 1600px"
              quality={85}
              className="object-cover"
              style={{ transform: heroTransform }}
              priority
            />
          </div>
          {/* Resplandor y línea curva sobre el mismo corte */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient
                id="lineFade"
                gradientUnits="userSpaceOnUse"
                x1="870"
                y1="0"
                x2="470"
                y2="900"
              >
                <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="0.06" stopColor="#ffffff" stopOpacity="0.55" />
                <stop offset="0.13" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="0.7" stopColor="#ffffff" stopOpacity="0.22" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
              </linearGradient>
              <filter id="lineGlow" x="-60%" y="-20%" width="220%" height="140%">
                <feGaussianBlur stdDeviation="14" />
              </filter>
            </defs>
            {/* Resplandor ancho alrededor del corte (mismo difuminado que la línea) */}
            <path
              d="M470 900 C 545 520, 625 300, 715 160, C 755 100, 795 30, 870 0"
              fill="none"
              stroke="url(#lineFade)"
              strokeOpacity="0.5"
              strokeWidth="34"
              filter="url(#lineGlow)"
            />
            {/* Línea principal: curva que sube y se deshace hacia el navbar */}
            <path
              d="M470 900 C 545 520, 625 300, 715 160, C 755 100, 795 30, 870 0"
              fill="none"
              stroke="url(#lineFade)"
              strokeWidth="6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Degradado superior sutil: legibilidad del navbar flotante */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-24 bg-gradient-to-b from-[#0b2233]/70 to-transparent"
        />

        {/* Degradado inferior para fundir con la onda */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-32 bg-gradient-to-t from-[#0b2233]/70 to-transparent"
        />
        <div className="relative z-10 flex h-full w-full px-4 sm:px-6 lg:px-10 xl:px-12">
          {/* Texto sobre la imagen, mitad izquierda */}
          <div className="flex w-full max-w-2xl flex-col justify-center pt-24 pb-24 sm:pt-28 sm:pb-28 lg:pb-28">
            <div className="reveal max-w-xl" data-reveal style={{ "--d": 2 }}>
              <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-sky-200 backdrop-blur-sm sm:text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-titilar mr-1.5 h-3.5 w-3.5 text-sky-300"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Río Gallegos, Santa Cruz
              </span>
              <h1 className="sombra-texto-fuerte mt-5 font-display font-extrabold leading-[1.02] tracking-tight text-white text-[clamp(2.4rem,8.5vw,3.75rem)]">
                {tituloLineas.map((linea) => (
                  <span key={linea} className="block">
                    {linea}
                  </span>
                ))}
              </h1>
              <p className="sombra-texto mt-3 font-display text-lg font-bold text-[#77d4ff] sm:text-2xl">
                {heroSubtitulo}
              </p>
              <p className="sombra-texto mt-4 max-w-md text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
                {heroDescripcion}
              </p>
              <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
                <a
                  href={waTurnos}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 px-7 py-3 text-sm font-bold text-white shadow-md shadow-sky-950/30 transition-all duration-300 hover:scale-105 hover:brightness-110"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Pedir turno
                </a>
                <Link
                  href="/#tratamientos"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 bg-transparent px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Ver tratamientos
                </Link>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ==================== FRANJA DE CONFIANZA ==================== */}
      <section className="w-full bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
            {[
              {
                linea1: "Experiencia",
                linea2: "comprobada",
                icono: (
                  <g transform="translate(0.9 0.4) scale(0.88)">
                    <path
                      d="M12 5.4c-1.9 0-2.6-1.1-4.7-1.1-1.9 0-3.4 1.2-3.4 3.3 0 3.3 1.9 4.6 2.5 8.6.3 1.8 1 4 2.8 4 1.5 0 1.7-2 2-4 .2-1.1 1-1.8 2.8-1.8s2.6.7 2.8 1.8c.3 2 .5 4 2 4 1.8 0 2.5-2.2 2.8-4 .6-4 2.5-5.3 2.5-8.6 0-2.1-1.5-3.3-3.4-3.3-2.1 0-2.8 1.1-4.7 1.1Z"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                ),
              },
              {
                linea1: "Equipamiento",
                linea2: "de última generación",
                icono: (
                  <>
                    <path d="M12 3 19 6v5c0 4.6-2.9 8.7-7 10-4.1-1.3-7-5.4-7-10V6l7-3Z" />
                    <path d="m9.5 12 1.8 1.8 3.4-3.8" />
                  </>
                ),
              },
              {
                linea1: "Trato cercano",
                linea2: "y personalizado",
                icono: (
                  <path d="M12 20s-7-4.6-9.3-9A5.4 5.4 0 0 1 12 6.7 5.4 5.4 0 0 1 21.3 11C19 15.4 12 20 12 20Z" />
                ),
              },
            ].map((item, i) => (
              <div
                key={item.linea2}
                data-reveal
                style={{ "--d": i + 1 }}
                className="reveal flex items-center justify-center gap-3 py-4 sm:gap-4 sm:py-5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1e88e5"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
                  aria-hidden="true"
                >
                  {item.icono}
                </svg>
                <div className="leading-tight">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">
                    {item.linea1}
                  </p>
                  <p className="font-display text-sm font-extrabold leading-snug text-[#0b2233] sm:text-lg">
                    {item.linea2}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      </div>

      {/* ==================== NOSOTROS ==================== */}
      <section
        id="nosotros"
        className="scroll-mt-24 mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8"
      >
        {/* Título de la sección, centrado al comienzo */}
        <h2 className="reveal mb-8 text-center font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl" data-reveal>
          Nosotros
        </h2>

        {/* Quiénes somos */}
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Galería con flechas y miniaturas */}
          <div className="reveal" data-reveal style={{ "--d": 1 }}>
            <GalleryCarousel fotos={fotos} />
          </div>
          <div className="reveal" data-reveal style={{ "--d": 2 }}>
            <h3 className="font-display text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
              Quiénes somos
            </h3>
            <p className="mt-5 text-base leading-7 text-slate-600 text-justify">
              Integrum Odontología nació en 2020 bajo el nombre de MENAMORAES,
              iniciando un camino de crecimiento y compromiso con la salud bucal
              de nuestra comunidad. En 2023 renovamos nuestra identidad y nos
              convertimos en Integrum, reflejando la evolución de nuestro equipo
              y nuestra visión de una odontología integral.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600 text-justify">
              Contamos con una amplia trayectoria profesional y un equipo que
              apuesta a la capacitación y actualización constante, incorporando
              nuevas técnicas y tecnologías para ofrecer tratamientos de calidad.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600 text-justify">
              Hoy, en Río Gallegos, trabajamos con dedicación, cercanía y
              compromiso, brindando atención personalizada y soluciones
              odontológicas para toda la familia.
            </p>
          </div>
        </div>

        {/* ==================== OBRAS SOCIALES ==================== */}
        <div className="reveal relative mt-12 overflow-hidden rounded-2xl bg-[#0b2233] px-5 py-4" data-reveal style={{ "--d": 2 }}>
          <div className="relative flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                Obras sociales y prepagas
              </p>
              <p className="mt-1 text-xs leading-snug text-sky-100/80">
                Consultanos por tu plan al pedir tu turno y te confirmamos la
                cobertura antes de tu visita.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {obrasView.map((o) => (
                <ObraSocialBadge
                  key={o.id ?? o.icono ?? o.nombre}
                  icono={o.icono}
                  nombre={o.nombre}
                  logoUrl={o.logo_url}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Equipo médico */}
        <div className="mt-16 sm:mt-20">
          <div className="reveal text-center" data-reveal>
            <h3 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Nuestro equipo
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-base leading-7 text-slate-600">
              Profesionales matriculados, en constante capacitación y con un
              único objetivo: tu sonrisa.
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-2">
            {equipoView.map((persona, i) => (
              <article
                key={persona.nombre}
                data-reveal
                style={{ "--d": (i % 2) + 1 }}
                className="reveal group relative overflow-hidden rounded-3xl bg-[#0b2233] shadow-lg ring-1 ring-slate-900/10 transition-shadow duration-300 hover:shadow-2xl"
              >
                {/* Foto */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200">
                  <Image
                    src={persona.foto_url}
                    alt={`${persona.nombre} — ${persona.especialidad}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 45vw"
                    className="object-cover object-[center_18%] transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Barra con nombre y especialidades */}
                <div className="flex min-h-[78px] items-center gap-2.5 bg-[#0b2233] px-3.5 py-3">
                  <TratamientoIcon
                    tipo={persona.icono}
                    className="h-7 w-7 shrink-0 text-white"
                  />
                  <span
                    aria-hidden="true"
                    className="h-9 w-px shrink-0 bg-white/25"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[13px] font-bold leading-tight text-white sm:text-sm">
                      {persona.nombre}
                    </h3>
                    <p className="mt-0.5 text-[10px] leading-snug text-sky-100/85 sm:text-[11px]">
                      {persona.especialidad}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ==================== CÓMO PEDIR UN TURNO ==================== */}
        <div className="reveal relative mt-10 mb-10 overflow-hidden rounded-2xl bg-[#0b2233] px-4 py-8 sm:mt-20 sm:mb-20 sm:rounded-3xl sm:px-10 sm:py-16" data-reveal style={{ "--d": 1 }}>
          {/* Resplandores de fondo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300 sm:text-xs sm:tracking-[0.2em]">
              ¿Cómo pedir un turno?
            </p>
            <h3 className="mt-2 font-display text-xl font-extrabold tracking-tight text-white sm:mt-3 sm:text-3xl">
              Así podés atenderte con nosotros en 3 pasos
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-[13px] leading-5 text-sky-100/80 sm:mt-3 sm:text-base sm:leading-6">
              Es muy fácil. Escribinos por WhatsApp, contanos qué necesitás y te
              ayudamos a coordinar tu consulta.
            </p>
          </div>

          <div className="relative mt-6 grid gap-2.5 md:mt-10 md:grid-cols-3 md:gap-5">
            {[
              {
                numero: "01",
                titulo: "Escribinos por WhatsApp",
                texto:
                  "Contanos qué te pasa, qué necesitás o si querés realizar una consulta. Estamos para ayudarte.",
              },
              {
                numero: "02",
                titulo: "Te ayudamos a encontrar un turno",
                texto:
                  "Nuestro equipo revisará tu consulta y te orientará para coordinar un turno con el profesional indicado.",
              },
              {
                numero: "03",
                titulo: "Confirmamos tu turno",
                texto:
                  "Te enviamos los datos de tu turno, la ubicación y toda la información que necesitás para tu visita.",
              },
            ].map((paso, i) => (
              <div
                key={paso.numero}
                data-reveal
                style={{ "--d": i + 1 }}
                className="reveal rounded-xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm transition-colors duration-300 hover:bg-white/[0.1] md:rounded-2xl md:p-5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-1 ring-white/30 md:h-9 md:w-9 md:text-xs">
                  {paso.numero}
                </span>
                <h4 className="mt-2.5 font-display text-sm font-bold leading-snug text-white md:mt-4 md:text-base">
                  {paso.titulo}
                </h4>
                <p className="mt-1 text-[11px] leading-5 text-sky-100/75 md:mt-2 md:text-xs md:leading-6">
                  {paso.texto}
                </p>
              </div>
            ))}
          </div>

          <div className="reveal relative mt-6 text-center md:mt-9" data-reveal style={{ "--d": 4 }}>
            <a
              href={waTurnos}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0b6b46] via-[#128C7E] to-[#25D366] px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-emerald-950/40 transition-all duration-300 hover:scale-[1.03] hover:brightness-110 md:px-6 md:py-3 md:text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5 md:h-4 md:w-4"
                aria-hidden="true"
              >
                <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.2 5.06 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.56-.35Z" />
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.13a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.23-8.23a8.23 8.23 0 0 1 0 16.45Z" />
              </svg>
              Hablar por WhatsApp
            </a>
          </div>
        </div>

      </section>

      {/* ==================== TRATAMIENTOS ==================== */}
      <section id="tratamientos" className="scroll-mt-24 bg-[#e9f2fa]">
          <div className="mx-auto w-full max-w-7xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8">
            <div className="reveal text-center" data-reveal>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Tratamientos
              </h2>
              <p className="mx-auto mt-2 max-w-2xl font-display text-lg font-bold leading-snug tracking-tight text-slate-700 sm:text-xl">
                Cada sonrisa es diferente. Por eso, te ofrecemos una atención
                personalizada para encontrar el tratamiento que necesitás.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {tratamientosView.map((t, i) => (
                <article
                  key={t.nombre}
                  data-reveal
                  style={{ "--d": (i % 3) + 1 }}
                  className="reveal group relative flex flex-col overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-900/10 transition-shadow duration-300 hover:shadow-2xl sm:rounded-3xl"
                >
                  {/* Imagen */}
                  <div className="relative aspect-[5/2] w-full overflow-hidden bg-slate-200">
                    <Image
                      src={t.imagen_url || "/consulta-dental-moderna.jpg"}
                      alt={t.alt}
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Barra inferior con ícono, título y subtítulo */}
                  <div className="flex min-h-[64px] items-center gap-1.5 bg-[#0b2233] px-2.5 sm:h-[76px] sm:min-h-0 sm:gap-4 sm:px-5">
                    <TratamientoIcon
                      tipo={t.icono}
                      className="h-6 w-6 shrink-0 text-white sm:h-9 sm:w-9"
                    />
                    <span
                      aria-hidden="true"
                      className="h-7 w-px shrink-0 bg-white/25 sm:h-9"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-[11px] font-bold leading-tight text-white sm:text-base">
                        {t.nombre}
                      </h3>
                      <p className="mt-1 truncate text-[10px] leading-snug text-sky-100/85 sm:text-xs">
                        {t.descripcion}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* CTA final */}
            <div className="reveal mt-8 sm:mt-16" data-reveal style={{ "--d": 1 }}>
              <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-[#0b2233] px-4 py-4 text-center sm:flex-row sm:gap-4 sm:px-8 sm:py-6 sm:text-left">
                <div>
                  <h2 className="font-display text-base font-bold tracking-tight text-white sm:text-xl">
                    ¿No sabés qué tratamiento es el indicado para vos?
                  </h2>
                  <p className="mx-auto mt-1 max-w-md text-[12px] leading-5 text-sky-100 sm:mx-0 sm:text-sm sm:leading-6">
                    Nuestros profesionales pueden asesorarte y ayudarte a
                    encontrar la mejor opción según tus necesidades.
                  </p>
                </div>
                <a
                  href={waTratamientos}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-sky-950 transition-colors hover:bg-sky-50 sm:px-7 sm:py-3 sm:text-sm"
                >
                  Quiero más información
                </a>
              </div>
            </div>          </div>
        </section>

      {/* ==================== PREGUNTAS ==================== */}
      <FaqSection preguntas={preguntas} />

      {/* ==================== CONTACTO ==================== */}
      <ContactoSection contacto={contacto} />
    </main>
  );
}
