// Contenido del sitio, leído en el servidor (Server Components / ISR).
// Fuente de verdad única: Supabase. El código conserva SOLO un respaldo
// mínimo de contacto crítico (teléfono, horario, dirección) para que el
// sitio nunca quede sin esos datos.
//
// Política de caché/errores:
// - Las lecturas van dentro de unstable_cache (tag "site", revalida como
//   mucho una vez al día). Si Supabase falla al revalidar, la función
//   cacheada LANZA el error → Next conserva la última versión buena.
// - El respaldo se aplica AFUERA del cache: respuesta mínima crítica.
// - El admin invalida la caché con updateTag("site") al guardar (ver actions).
import { unstable_cache } from "next/cache";
import { getSupabasePublic } from "./supabasePublic";

export const DEFAULT_CONTENT = {
  contacto: {
    direccion: "Comodoro Py 528, Río Gallegos, Santa Cruz",
    horario: "Lunes a viernes: 9 a 12 y 14 a 18 hs",
    telefono_turnos: "2966-306555",
    telefono_urgencias: "2966-306555",
  },
};

async function leer(nombre, query) {
  const sb = getSupabasePublic();
  if (!sb) throw new Error("Supabase no configurado");
  const { data, error } = await query(sb);
  if (error) throw new Error(`${nombre}: ${error.message}`);
  return data;
}

const cargar = unstable_cache(
  async () => {
    const [hero, nosotros, galeria, especialistas, tratamientos, preguntas, obras, contacto, banners] =
      await Promise.all([
        leer("site_hero", (sb) => sb.from("site_hero").select("*").limit(1).maybeSingle()),
        leer("site_nosotros", (sb) => sb.from("site_nosotros").select("*").limit(1).maybeSingle()),
        leer("site_galeria", (sb) => sb.from("site_galeria").select("*").order("orden")),
        leer("site_especialistas", (sb) => sb.from("site_especialistas").select("*").order("orden")),
        leer("site_tratamientos", (sb) => sb.from("site_tratamientos").select("*").order("orden")),
        leer("site_preguntas", (sb) => sb.from("site_preguntas").select("*").order("orden")),
        leer("site_obras_sociales", (sb) => sb.from("site_obras_sociales").select("*").order("orden")),
        leer("site_contacto", (sb) => sb.from("site_contacto").select("*").limit(1).maybeSingle()),
        // Los avisos son opcionales: si la tabla todavía no existe en Supabase,
        // el resto del sitio debe seguir funcionando con normalidad.
        Promise.resolve(
          leer("site_banners", (sb) => sb.from("site_banners").select("*").order("orden"))
        ).catch(() => []),
      ]);
    return {
      hero: hero?.titulo ? hero : null,
      nosotros: nosotros?.descripcion ? nosotros : null,
      galeria: Array.isArray(galeria) ? galeria : [],
      // El filtro visible es del sitio público.
      especialistas: Array.isArray(especialistas)
        ? especialistas.filter((r) => r.visible !== false)
        : [],
      tratamientos: Array.isArray(tratamientos) ? tratamientos : [],
      preguntas: Array.isArray(preguntas) ? preguntas : [],
      obrasSociales: Array.isArray(obras)
        ? obras.filter((r) => r.visible !== false)
        : [],
      contacto: contacto?.direccion ? contacto : null,
      banners: Array.isArray(banners) ? banners : [],
    };
  },
  ["site-contenido"],
  { revalidate: 86400, tags: ["site"] }
);

const VACIO = {
  hero: null,
  nosotros: null,
  galeria: [],
  especialistas: [],
  tratamientos: [],
  preguntas: [],
  obrasSociales: [],
  contacto: DEFAULT_CONTENT.contacto,
  banners: [],
};

export async function getContenido() {
  try {
    const c = await cargar();
    return {
      ...c,
      contacto: c?.contacto?.direccion ? c.contacto : DEFAULT_CONTENT.contacto,
    };
  } catch (err) {
    // Se conserva la última versión cacheada por ISR; si no hay ninguna,
    // solo queda el respaldo mínimo de contacto.
    console.error("[contenido]", err?.message ?? err);
    return VACIO;
  }
}

export function buildWhatsAppTurnos(contacto) {
  const digitos = String(contacto?.telefono_turnos ?? DEFAULT_CONTENT.contacto.telefono_turnos)
    .replace(/\D/g, "")
    .replace(/^0/, "");
  const numero = digitos.startsWith("54") ? digitos : `549${digitos}`;
  const mensaje =
    "Hola, quisiera pedir un turno en Integrum Odontología. ¿Tienen disponibilidad esta semana?";
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function buildWhatsAppTratamientos(contacto) {
  const digitos = String(contacto?.telefono_turnos ?? DEFAULT_CONTENT.contacto.telefono_turnos)
    .replace(/\D/g, "")
    .replace(/^0/, "");
  const numero = digitos.startsWith("54") ? digitos : `549${digitos}`;
  const mensaje =
    "Hola, quisiera más información sobre los tratamientos de Integrum Odontología.";
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function buildWhatsAppUrgencias(contacto) {
  const numero = String(contacto?.telefono_urgencias ?? DEFAULT_CONTENT.contacto.telefono_urgencias)
    .replace(/\D/g, "")
    .replace(/^0/, "");
  const nacional = numero.startsWith("54") ? numero : `549${numero}`;
  const mensaje =
    "Hola, tengo una urgencia odontológica y necesito atención lo antes posible. ¿Me pueden ayudar?";
  return `https://wa.me/${nacional}?text=${encodeURIComponent(mensaje)}`;
}
