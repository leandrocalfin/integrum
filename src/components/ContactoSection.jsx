"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import { DEFAULT_CONTENT, buildWhatsAppTurnos } from "@/lib/contenido";
import { verificarConsulta } from "@/app/contacto-actions";

const soloDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");

const motivos = [
  "Consulta clínica general / Especialidades",
  "Ortodoncia y ortodoncia infantil",
  "Implantes y prótesis",
  "Alineadores invisibles",
  "Blanqueamiento y estética",
  "Odontología digital",
  "Urgencia odontológica",
  "Otro motivo",
];

function IconoCampo({ tipo, className = "h-4 w-4" }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": "true",
  };

  if (tipo === "direccion") {
    return (
      <svg {...common}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }

  if (tipo === "ubicacion") {
    return (
      <svg {...common}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }

  if (tipo === "reloj") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }

  if (tipo === "telefono") {
    return (
      <svg {...common}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }

  if (tipo === "escudo") {
    return (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }

  if (tipo === "enviar") {
    return (
      <svg {...common}>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="10" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

export default function ContactoSection({ contacto }) {
  const data = contacto ?? DEFAULT_CONTENT.contacto;
  const DIRECCION = data.direccion;
  const HORARIO = data.horario;
  const PHONE_DISPLAY = data.telefono_turnos;
  const telHref = `tel:+54${soloDigitos(data.telefono_turnos)}`;
  const waTurnos = buildWhatsAppTurnos(data);
  const mapaEmbed =
    typeof data.mapa_url === "string" && data.mapa_url.startsWith("http")
      ? data.mapa_url
      : `https://www.google.com/maps?q=${encodeURIComponent(DIRECCION)}&output=embed`;

  const inputBase =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-600/30 sm:py-2.5 sm:text-sm";

  const redes = [
    {
      nombre: "Instagram",
      href: data.instagram ?? "#",
      clase: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
      icono: (
        <>
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" />
        </>
      ),
    },
    {
      nombre: "Facebook",
      href: data.facebook ?? "#",
      clase: "bg-[#1877F2]",
      icono: (
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      ),
    },
    {
      nombre: "WhatsApp",
      href: waTurnos,
      clase: "bg-[#25D366]",
      icono: (
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      ),
    },
  ];

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    motivo: motivos[0],
    mensaje: "",
  });
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const alCargarTurnstile = () => {
    if (typeof window === "undefined" || !window.turnstile || !turnstileRef.current) return;
    window.turnstile.render(turnstileRef.current, {
      sitekey: siteKey,
      callback: setTurnstileToken,
      "error-callback": () => setTurnstileToken(""),
      "expired-callback": () => setTurnstileToken(""),
    });
  };

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setEnviado(false);
    setError("");
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError("");
    const res = await verificarConsulta(turnstileToken || null);
    if (!res?.ok) {
      setError(res?.error ?? "No se pudo enviar la consulta.");
      setEnviando(false);
      return;
    }
    setEnviado(true);
    setForm({
      nombre: "",
      telefono: "",
      correo: "",
      motivo: motivos[0],
      mensaje: "",
    });
    setTurnstileToken("");
    if (typeof window !== "undefined" && window.turnstile && turnstileRef.current) {
      window.turnstile.reset(turnstileRef.current);
    }
    setEnviando(false);
  };

  const datosSede = [
    { icono: "ubicacion", titulo: "Dirección", lineas: [DIRECCION] },
    { icono: "reloj", titulo: "Horarios de Atención", lineas: [HORARIO] },
    {
      icono: "telefono",
      titulo: "Recepción Telefónica",
      lineas: [PHONE_DISPLAY],
      href: telHref,
    },
  ];

  return (
    <section id="contacto" className="scroll-mt-24 bg-[#f5f8fb]">
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-8 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
        {/* Título de la sección */}
        <div className="reveal text-center" data-reveal>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Contacto
          </h2>
          <div
            aria-hidden="true"
            className="mx-auto mt-3 h-1 w-16 rounded-full bg-sky-800 sm:mt-4"
          />
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
            Envianos tu consulta sobre tratamientos, turnos o coberturas. Te
            respondemos a la brevedad.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-2">
          {/* ==================== FORMULARIO ==================== */}
          <div className="reveal rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6" data-reveal style={{ "--d": 1 }}>
            <form onSubmit={enviar} className="flex flex-col gap-3 sm:gap-4">
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div>
                  <label
                    htmlFor="contacto-nombre"
                    className="block text-[13px] font-semibold text-slate-800 sm:text-sm"
                  >
                    Nombre y Apellido
                  </label>
                  <input
                    id="contacto-nombre"
                    type="text"
                    required
                    maxLength={100}
                    value={form.nombre}
                    onChange={cambiar("nombre")}
                    placeholder="Ej: Marcela Benítez"
                    className={`mt-1.5 sm:mt-2 ${inputBase}`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contacto-telefono"
                    className="block text-[13px] font-semibold text-slate-800 sm:text-sm"
                  >
                    Teléfono / Celular
                  </label>
                  <input
                    id="contacto-telefono"
                    type="tel"
                    required
                    maxLength={30}
                    value={form.telefono}
                    onChange={cambiar("telefono")}
                    placeholder="Ej: 2966 00-0000"
                    className={`mt-1.5 sm:mt-2 ${inputBase}`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contacto-correo"
                  className="block text-[13px] font-semibold text-slate-800 sm:text-sm"
                >
                  Correo Electrónico
                </label>
                <input
                  id="contacto-correo"
                  type="email"
                  required
                  maxLength={254}
                  value={form.correo}
                  onChange={cambiar("correo")}
                  placeholder="ejemplo@correo.com"
                  className={`mt-1.5 sm:mt-2 ${inputBase}`}
                />
              </div>

              <div>
                <label
                  htmlFor="contacto-motivo"
                  className="block text-[13px] font-semibold text-slate-800 sm:text-sm"
                >
                  Motivo de tu Consulta
                </label>
                <div className="relative mt-2">
                  <select
                    id="contacto-motivo"
                    value={form.motivo}
                    onChange={cambiar("motivo")}
                    className={`appearance-none pr-10 ${inputBase}`}
                  >
                    {motivos.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              <div>
                <label
                  htmlFor="contacto-mensaje"
                  className="block text-[13px] font-semibold text-slate-800 sm:text-sm"
                >
                  Mensaje
                </label>
                <textarea
                  id="contacto-mensaje"
                  rows={4}
                  required
                  maxLength={600}
                  value={form.mensaje}
                  onChange={cambiar("mensaje")}
                  placeholder="Contanos brevemente el motivo (sin datos clínicos detallados)..."
                  className={`mt-1.5 h-20 resize-y sm:mt-2 sm:h-auto ${inputBase}`}
                />
                <p className="mt-1 text-right text-[11px] text-slate-500">
                  {form.mensaje.length}/600 caracteres
                </p>
              </div>

              {/* Aviso de privacidad */}
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5">
                <IconoCampo
                  tipo="escudo"
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                />
                <p className="text-[11px] leading-4 text-amber-800 sm:text-xs sm:leading-5">
                  Por tu privacidad, evitá enviar información clínica detallada
                  (diagnósticos, estudios o medicación). Alcanzan tus datos de
                  contacto y el motivo general.
                </p>
              </div>

              {/* Confirmación visual */}
              {enviado && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      ¡Consulta recibida!
                    </p>
                    <p className="text-xs text-emerald-700">
                      Te respondemos a la brevedad. Si necesitás una respuesta
                      inmediata, escribinos por WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  {error}
                </p>
              )}

              {siteKey && (
                <div>
                  <div ref={turnstileRef} className="flex justify-center" />
                  <Script
                    src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                    strategy="afterInteractive"
                    onLoad={alCargarTurnstile}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={enviando || (Boolean(siteKey) && !turnstileToken)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b2233] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#123249] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3 sm:text-sm"
              >
                <IconoCampo tipo="enviar" className="h-4 w-4" />
                {enviando ? "Enviando…" : "Enviar Consulta"}
              </button>
            </form>
          </div>

          {/* ==================== DATOS DE LA SEDE + MAPA ==================== */}
          <div className="flex flex-col gap-5">
            <div className="reveal rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6" data-reveal style={{ "--d": 1 }}>
              <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
                Información de la Sede
              </h3>

              <ul className="mt-3 flex flex-col gap-2.5 sm:mt-5 sm:gap-4">
                {datosSede.map((dato) => {
                  const contenido = (
                    <div className="flex items-start gap-2.5 sm:gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 sm:h-9 sm:w-9">
                        <IconoCampo tipo={dato.icono} className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 sm:text-sm">
                          {dato.titulo}
                        </p>
                        {dato.lineas.map((linea) => (
                          <p
                            key={linea}
                            className="mt-0.5 text-[13px] leading-5 text-slate-600 sm:text-sm"
                          >
                            {linea}
                          </p>
                        ))}
                      </div>
                    </div>
                  );

                  return (
                    <li key={dato.titulo}>
                      {dato.href ? (
                        <a
                          href={dato.href}
                          className="inline-block transition-opacity hover:opacity-80"
                        >
                          {contenido}
                        </a>
                      ) : (
                        contenido
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Canales de contacto */}
              <div className="mt-4 flex items-center justify-center gap-2 sm:mt-6 sm:gap-3">
                {redes.map((red) => (
                  <a
                    key={red.nombre}
                    href={red.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={red.nombre}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-105 sm:h-10 sm:w-10 ${red.clase}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      {red.icono}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Mapa de la sede */}
            <div className="reveal overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl" data-reveal style={{ "--d": 2 }}>
              <iframe
                title={`Ubicación del consultorio — ${DIRECCION}`}
                src={mapaEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-40 w-full border-0 sm:h-56"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
