"use server";

import { headers } from "next/headers";

// Verificación anti-bot del formulario de contacto. Usa la misma Secret Key
// de Turnstile que el login del panel. Sin clave, en producción se cierra
// (fail closed) para no dejar pasar envíos sin verificar.
export async function verificarConsulta(turnstileToken) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, error: "Servicio no disponible." };
  if (typeof turnstileToken !== "string" || !turnstileToken) {
    return { ok: false, error: "No pudimos verificar que sos una persona. Reintentá." };
  }

  const body = new URLSearchParams({ secret, response: turnstileToken });
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) body.set("remoteip", ip);

  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const datos = await r.json();
    if (datos?.success !== true) {
      return { ok: false, error: "No pudimos verificar que sos una persona. Reintentá." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "No pudimos verificar que sos una persona. Reintentá." };
  }
}
