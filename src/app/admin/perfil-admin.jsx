"use client";

import { useRef, useState } from "react";
import { subirAvatarPerfil, quitarAvatarPerfil, cambiarPassword } from "./actions";

const inputCls =
  "h-10 w-full rounded-xl border border-white/10 bg-[#082F49]/80 px-3 text-[13px] text-white outline-none placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40";

function Ojo({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.83 20.83 0 0 1 5.06-6.06M9.9 4.24A10.16 10.16 0 0 1 12 4c7 0 11 8 11 8a20.79 20.79 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CampoPassword({ id, etiqueta, valor, onChange, visible, alternar, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={valor}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          maxLength={72}
          className={`${inputCls} pr-11`}
        />
        <button
          type="button"
          onClick={alternar}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Ojo visible={visible} />
        </button>
      </div>
    </div>
  );
}

export default function PerfilAdmin({ contacto, email, onSaved }) {
  // ---- Foto de perfil ----
  const [avatar, setAvatar] = useState(contacto?.avatar_url ?? "");
  const [subiendo, setSubiendo] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState("");
  const inputRef = useRef(null);

  const elegirAvatar = async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    if (file.size > 4_000_000) {
      setErrorAvatar("La imagen pesa más de 4 MB");
      return;
    }
    setSubiendo(true);
    setErrorAvatar("");
    try {
      const datos = new FormData();
      datos.set("file", file);
      const res = await subirAvatarPerfil(datos);
      if (res?.ok !== true) {
        const msg = res?.error ?? "No se pudo subir la foto";
        throw new Error(
          /avatar_url|schema cache/i.test(msg)
            ? "Falta agregar la columna avatar_url en Supabase (ver README / schema.sql)."
            : msg
        );
      }
      setAvatar(res?.datos?.url ?? "");
      onSaved("Foto de perfil actualizada");
    } catch (err) {
      setErrorAvatar(err.message ?? "No se pudo subir la foto");
    } finally {
      setSubiendo(false);
    }
  };

  const quitarAvatar = async () => {
    if (!window.confirm("¿Quitar la foto de perfil y volver a la imagen por defecto?")) return;
    setSubiendo(true);
    setErrorAvatar("");
    try {
      const res = await quitarAvatarPerfil();
      if (res?.ok !== true) throw new Error(res?.error ?? "No se pudo quitar la foto");
      setAvatar("");
      onSaved("Foto de perfil quitada");
    } catch (err) {
      setErrorAvatar(err.message ?? "No se pudo quitar la foto");
    } finally {
      setSubiendo(false);
    }
  };

  // ---- Contraseña ----
  const [form, setForm] = useState({ actual: "", nueva: "", repetir: "" });
  const [ver, setVer] = useState({ actual: false, nueva: false, repetir: false });
  const [guardando, setGuardando] = useState(false);
  const [errorPass, setErrorPass] = useState("");
  const [okPass, setOkPass] = useState("");

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setErrorPass("");
    setOkPass("");
  };

  const reglas = [
    { ok: form.nueva.length >= 10, texto: "10 caracteres o más" },
    { ok: /[a-z]/.test(form.nueva), texto: "Una minúscula" },
    { ok: /[A-Z]/.test(form.nueva), texto: "Una mayúscula" },
    { ok: /[0-9]/.test(form.nueva), texto: "Un número" },
    { ok: form.nueva.length > 0 && form.nueva === form.repetir, texto: "Coinciden" },
  ];
  const cumplidas = reglas.filter((r) => r.ok).length;
  const fuerza = Math.round((cumplidas / reglas.length) * 100);
  const colorFuerza =
    cumplidas <= 2 ? "bg-red-500" : cumplidas <= 4 ? "bg-amber-400" : "bg-emerald-500";

  const enviarPassword = async (ev) => {
    ev.preventDefault();
    if (guardando) return;
    setErrorPass("");
    setOkPass("");
    if (form.nueva !== form.repetir) {
      setErrorPass("Las contraseñas nuevas no coinciden");
      return;
    }
    setGuardando(true);
    try {
      const res = await cambiarPassword(form);
      if (res?.ok !== true) throw new Error(res?.error ?? "No se pudo cambiar la contraseña");
      setForm({ actual: "", nueva: "", repetir: "" });
      setVer({ actual: false, nueva: false, repetir: false });
      setOkPass(res?.datos?.mensaje ?? "Contraseña actualizada");
      onSaved("Contraseña actualizada");
    } catch (err) {
      setErrorPass(err.message ?? "No se pudo cambiar la contraseña");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ==================== FOTO DE PERFIL ==================== */}
      <section className="rounded-xl border border-white/10 bg-[#082F49]/60 p-4">
        <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-sky-400">
          Foto de perfil
        </h3>
        <p className="mt-1 text-[11px] leading-5 text-slate-400">
          Es el avatar que se muestra en el navbar del sitio cuando hay una sesión
          de administrador iniciada.
        </p>

        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-sky-500 bg-slate-950">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt="Foto de perfil del administrador"
                className="h-full w-full object-cover object-[center_18%]"
                onError={(e) => {
                  const el = e.currentTarget;
                  // Si la URL guardada no carga, se muestra la foto por
                  // defecto en vez de una imagen rota.
                  if (!el.dataset.fallback) {
                    el.dataset.fallback = "1";
                    el.src = "/Mena.jpg";
                  }
                }}
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-sky-400/70" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 sm:items-start">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={subiendo}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-[12px] font-bold text-[#082F49] transition-colors hover:bg-sky-400 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                {subiendo ? "Subiendo…" : avatar ? "Cambiar foto" : "Adjuntar foto"}
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={quitarAvatar}
                  disabled={subiendo}
                  className="rounded-lg border border-white/10 px-3 py-2 text-[12px] font-semibold text-slate-300 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
                >
                  Quitar foto
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-500">JPG, PNG o WebP · máximo 4 MB</p>
            {!avatar && (
              <p className="text-[10px] text-slate-500">
                Sin foto propia se usa la imagen de perfil actual del sitio.
              </p>
            )}
            {errorAvatar && (
              <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-300">
                {errorAvatar}
              </p>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={elegirAvatar}
            disabled={subiendo}
            aria-label="Adjuntar foto de perfil"
          />
        </div>
      </section>

      {/* ==================== CONTRASEÑA ==================== */}
      <section className="rounded-xl border border-white/10 bg-[#082F49]/60 p-4">
        <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-sky-400">
          Cambiar contraseña
        </h3>
        <p className="mt-1 text-[11px] leading-5 text-slate-400">
          Cuenta: <span className="text-sky-300">{email ?? "administrador"}</span>. Te
          pedimos la contraseña actual para confirmar que sos vos. Al guardar, se
          cierran las sesiones abiertas en otros dispositivos.
        </p>

        <form onSubmit={enviarPassword} className="mt-4 flex flex-col gap-3">
          <CampoPassword
            id="pass-actual"
            etiqueta="Contraseña actual"
            valor={form.actual}
            onChange={cambiar("actual")}
            visible={ver.actual}
            alternar={() => setVer((v) => ({ ...v, actual: !v.actual }))}
            autoComplete="current-password"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <CampoPassword
              id="pass-nueva"
              etiqueta="Nueva contraseña"
              valor={form.nueva}
              onChange={cambiar("nueva")}
              visible={ver.nueva}
              alternar={() => setVer((v) => ({ ...v, nueva: !v.nueva }))}
              autoComplete="new-password"
            />
            <CampoPassword
              id="pass-repetir"
              etiqueta="Repetir nueva contraseña"
              valor={form.repetir}
              onChange={cambiar("repetir")}
              visible={ver.repetir}
              alternar={() => setVer((v) => ({ ...v, repetir: !v.repetir }))}
              autoComplete="new-password"
            />
          </div>

          {/* Fuerza + requisitos */}
          <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-300 ${colorFuerza}`}
                style={{ width: `${fuerza}%` }}
              />
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {reglas.map((r) => (
                <li key={r.texto} className={`flex items-center gap-1.5 text-[11px] ${r.ok ? "text-emerald-400" : "text-slate-500"}`}>
                  <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {r.ok ? <path d="m5 12 5 5L20 7" /> : <circle cx="12" cy="12" r="8" />}
                  </svg>
                  {r.texto}
                </li>
              ))}
            </ul>
          </div>

          <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[11px] leading-5 text-amber-200/90">
            Usá una contraseña única que no reutilices en otros sitios. No la
            compartas por WhatsApp ni por correo; el panel nunca te la va a pedir
            por fuera de esta pantalla.
          </p>

          {errorPass && (
            <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
              {errorPass}
            </p>
          )}
          {okPass && (
            <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300">
              {okPass}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={guardando || cumplidas < reglas.length || !form.actual}
              className="inline-flex h-10 items-center rounded-xl bg-sky-500 px-6 text-[13px] font-bold text-[#082F49] transition-colors hover:bg-sky-400 disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
