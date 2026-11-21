"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { getAdminUser, getSupabaseServer } from "@/lib/supabaseServer";

const limpiar = (v) => String(v ?? "").trim();
const maxLen = (name, value, max) => {
  const v = limpiar(value);
  if (!v) throw new Error(`${name} es requerido`);
  if (v.length > max) throw new Error(`${name}: máximo ${max} caracteres`);
  return v;
};
const opcional = (name, value, max) => {
  const v = limpiar(value);
  if (v && v.length > max) throw new Error(`${name}: máximo ${max} caracteres`);
  return v || null;
};
async function requireAdmin() {
  const { sb, user, isAdmin } = await getAdminUser();
  if (!user || !isAdmin) throw new Error("No autorizado");
  return sb;
}

function ok(datos = null) {
  return { ok: true, datos };
}

// Las Server Actions del panel devuelven { ok:false, error } en vez de lanzar:
// en producción Next reemplaza el mensaje de los throw por uno genérico, así
// que las validaciones/avisos llegarían irreconocibles al usuario.
function fallo(error) {
  const mensaje = error instanceof Error ? error.message : String(error ?? "Error inesperado");
  return { ok: false, error: mensaje };
}

// ============ AUTH ============
async function verificarTurnstile(token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Sin clave: solo en desarrollo se permite el pase directo.
  // En producción se cierra (fail closed).
  if (!secret) return process.env.NODE_ENV !== "production";
  if (typeof token !== "string" || !token) return false;
  const body = new URLSearchParams({ secret, response: token });
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) body.set("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    return (await r.json()).success === true;
  } catch {
    return false;
  }
}

export async function loginAction(email, password, turnstileToken) {
  // Validación de tipo y largo en el servidor (nunca confiar en el cliente).
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 254 ||
    password.length < 1 ||
    password.length > 200
  ) {
    return { error: "Credenciales inválidas." };
  }

  if (!(await verificarTurnstile(turnstileToken))) {
    return { error: "No pudimos verificar que sos una persona. Reintentá." };
  }

  const sb = await getSupabaseServer();
  if (!sb) return { error: "Servicio no disponible." };

  const { error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    console.error(`[admin] login falló: ${error.code}`);
    return { error: "Credenciales inválidas." }; // mismo mensaje para cualquier fallo
  }

  // Un usuario válido que NO es admin no debe quedar con sesión abierta.
  const { data: esAdmin } = await sb.rpc("is_admin");
  if (esAdmin !== true) {
    await sb.auth.signOut();
    return { error: "Credenciales inválidas." };
  }

  redirect("/admin");
}

export async function logoutAction() {
  const sb = await getSupabaseServer();
  if (sb) await sb.auth.signOut();
  redirect("/admin/login");
}


function encadreValido(input) {
  const posicion = limpiar(input.image_position) || "0% 0%";
  if (!/^-?[0-9]{1,3}% -?[0-9]{1,3}%$/.test(posicion)) {
    throw new Error("Encuadre inválido (porcentaje 0-100)");
  }
  const [pxs, pys] = posicion.split(" ");
  const px = Math.min(250, Math.max(-150, Number(pxs.replace("%", ""))));
  const py = Math.min(250, Math.max(-150, Number(pys.replace("%", ""))));
  const esc = Number(input.image_scale ?? 1.18);
  const scale = Number.isFinite(esc) ? Math.min(4, Math.max(1, esc)) : 1.18;
  return { posicion: `${px}% ${py}%`, scale };
}

// ============ HERO ============
export async function subirImagenHero(formData) {
 try {
  const sb = await requireAdmin();
  const enc = encadreValido({
    image_position: formData.get("image_position"),
    image_scale: formData.get("image_scale"),
  });
  const file = formData.get("file");
  if (!file || typeof file === "string" || !file.size) {
    throw new Error("Seleccioná una imagen");
  }
  if (file.size > 4_000_000) throw new Error("La imagen pesa más de 4 MB");
  if (!file.type || !TIPOS_FOTO.has(file.type)) {
    throw new Error("Formato no permitido (JPG, PNG o WebP)");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  // Verificación real: los bytes tienen que coincidir con el tipo declarado.
  const detectado = detectarTipoArchivo(bytes);
  if (detectado !== file.type || !TIPOS_FOTO.has(detectado)) {
    throw new Error("El archivo no es una imagen válida");
  }
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
  const path = `hero/${crypto.randomUUID()}.${ext}`;
  // Guardar referencia a la actual para borrar su archivo al terminar.
  const { data: actual } = await sb.from("site_hero").select("image_url").eq("id", 1).maybeSingle();
  const { error } = await sb.storage.from("site-images").upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const url = sb.storage.from("site-images").getPublicUrl(path).data.publicUrl;
  const { error: updError } = await sb.from("site_hero").update({ image_url: url, image_position: enc.posicion, image_scale: enc.scale }).eq("id", 1);
  if (updError) {
    await sb.storage.from("site-images").remove([path]);
    throw new Error(updError.message);
  }
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/`;
  if (actual?.image_url?.startsWith(prefix)) {
    await sb.storage.from("site-images").remove([actual.image_url.slice(prefix.length)]);
  }
  revalidatePath("/");
  updateTag("site");
  return ok({ url });
 } catch (err) {
  return fallo(err);
 }
}

export async function guardarHero(input) {
 try {
  const sb = await requireAdmin();
  const enc = encadreValido(input);
  // La imagen NO se toca acá: sólo cambia con subirImagenHero. Si el formulario
  // enviara una URL vieja (por ejemplo, después de subir una foto nueva) podía
  // volver a apuntar a un archivo ya borrado y romper el hero.
  const payload = {
    titulo: maxLen("Titulo", input.titulo, 100),
    subtitulo: maxLen("Subtitulo", input.subtitulo, 150),
    descripcion: maxLen("Descripcion", input.descripcion, 500),
    image_position: enc.posicion,
    image_scale: enc.scale,
  };
  const { error } = await sb.from("site_hero").update(payload).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  updateTag("site");
  return ok();
 } catch (err) {
  return fallo(err);
 }
}

export async function guardarEncadreHero(input) {
  try {
    const sb = await requireAdmin();
    const enc = encadreValido(input);
    const { error } = await sb
      .from("site_hero")
      .update({ image_position: enc.posicion, image_scale: enc.scale })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    revalidatePath("/");
    updateTag("site");
    return ok();
  } catch (err) {
    return fallo(err);
  }
}

// ============ NOSOTROS (texto) ============
export async function guardarNosotros(input) {
 try {
  const sb = await requireAdmin();
  const payload = {
    descripcion: maxLen("Descripción", input.descripcion, 5000),
  };
  const { error } = await sb.from("site_nosotros").update(payload).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  updateTag("site");
  return ok();
 } catch (err) {
  return fallo(err);
 }
}

// ============ GALERÍA ============
export async function agregarFotoGaleria(formData) {
 try {
  const sb = await requireAdmin();
  const file = formData.get("file");
  if (!file || typeof file === "string" || !file.size) {
    throw new Error("Seleccioná un archivo");
  }
  if (file.size > 4_000_000 && file.type !== "video/mp4") throw new Error("La imagen pesa más de 4 MB");
  // Lista cerrada de tipos permitidos (el tipo lo declara el cliente; no confíes en él)
  const TIPOS_GALERIA = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4" };
  const ext = TIPOS_GALERIA[file.type];
  if (!ext) throw new Error("Formato no permitido (JPG, PNG, WebP o MP4)");
  const esVideo = file.type === "video/mp4";
  if (esVideo && file.size > 5_000_000) throw new Error("El video pesa más de 5 MB");
  const tipo = esVideo ? "video" : "foto";
  // Tope de la galería: máximo 2 videos y 7 fotos.
  const { count } = await sb
    .from("site_galeria")
    .select("id", { count: "exact", head: true })
    .eq("tipo", tipo);
  const tope = esVideo ? 2 : 7;
  if ((count ?? 0) >= tope) {
    throw new Error(esVideo ? "Máximo 2 videos en la galería" : "Máximo 7 fotos en la galería");
  }
  const path = `galeria/${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const detectado = detectarTipoArchivo(bytes);
  if (detectado !== file.type) {
    throw new Error(esVideo ? "El video no es un MP4 válido" : "La imagen no es válida");
  }
  const { error: subError } = await sb.storage
    .from("site-images")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (subError) throw new Error(subError.message);
  const url = sb.storage.from("site-images").getPublicUrl(path).data.publicUrl;
  const { data: maxRow } = await sb
    .from("site_galeria")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await sb.from("site_galeria").insert({
    tipo,
    src: url,
    alt: limpiar(file.name.replace(/\.[a-z0-9]+$/i, "")) || (tipo === "video" ? "Video del consultorio" : "Foto del consultorio"),
    orden: (maxRow?.orden ?? 0) + 1,
  });
  if (error) {
    await sb.storage.from("site-images").remove([path]);
    throw new Error(error.message);
  }
  revalidatePath("/");
  updateTag("site");
  return ok({ url });
 } catch (err) {
  return fallo(err);
 }
}

export async function eliminarGaleria(id) {
 try {
  const sb = await requireAdmin();
  const { data, error } = await sb
    .from("site_galeria")
    .select("tipo,src")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Item inexistente");
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/`;
  if (data.src.startsWith(prefix)) {
    const path = data.src.slice(prefix.length);
    await sb.storage.from("site-images").remove([path]);
  }
  const { error: delError } = await sb.from("site_galeria").delete().eq("id", id);
  if (delError) throw new Error(delError.message);
  revalidatePath("/");
  updateTag("site");
  return ok();
 } catch (err) {
  return fallo(err);
 }
}

export async function reordenarGaleria(id, direccion) {
 try {
  const sb = await requireAdmin();
  const { data: items, error } = await sb
    .from("site_galeria")
    .select("id,orden")
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  const idx = (items ?? []).findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Item inexistente");
  const destino = direccion === "up" ? idx - 1 : idx + 1;
  if (destino < 0 || destino >= items.length) return ok();
  const a = items[idx];
  const b = items[destino];
  const ordenA = b.orden;
  const ordenB = a.orden;
  const { error: e1 } = await sb.from("site_galeria").update({ orden: ordenA }).eq("id", a.id);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await sb.from("site_galeria").update({ orden: ordenB }).eq("id", b.id);
  if (e2) throw new Error(e2.message);
  revalidatePath("/");
  updateTag("site");
  return ok();
 } catch (err) {
  return fallo(err);
 }
}

// ============ ESPECIALISTAS (equipo) ============
async function proximoOrden(sb, tabla) {
  const { data } = await sb.from(tabla).select("orden").order("orden", { ascending: false }).limit(1).maybeSingle();
  return (data?.orden ?? 0) + 1;
}

const TIPOS_FOTO = new Set(["image/jpeg", "image/png", "image/webp"]);
const TIPOS_IMAGENES = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4"]);

// Firma binaria (file.type lo declara el cliente; no se confía en él).
// Devuelve el MIME real según los primeros bytes, o null.
function detectarTipoArchivo(bytes) {
  if (!bytes || bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "video/mp4";
  return null;
}

export async function guardarEspecialista(formData) {
 try {
  const sb = await requireAdmin();
  const id = Number(formData.get("id")) || null;
  const nombre = maxLen("Nombre", formData.get("nombre"), 100);
  const matricula = maxLen("Matrícula", formData.get("matricula"), 40);
  const especialidad = opcional("Especialidad", formData.get("especialidad"), 160);
  const orden = Number(formData.get("orden")) > 0 ? Number(formData.get("orden")) : undefined;

  const fotoFile = formData.get("foto");
  const foto =
    fotoFile && typeof fotoFile === "object" && "size" in fotoFile
      ? fotoFile
      : null;
  if (foto && foto.size > 4_000_000) {
    throw new Error("La imagen pesa más de 4 MB");
  }
  if (foto && (!foto.type || !TIPOS_FOTO.has(foto.type))) {
    throw new Error("Formato no permitido (JPG, PNG o WebP)");
  }

  // Política: solo cambia foto si se subió una nueva
  let foto_url;
  let pathNuevo = null;
  if (foto && foto.size > 0) {
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[foto.type];
    if (!ext) throw new Error("Formato no permitido (JPG, PNG o WebP)");
    const path = `especialistas/${crypto.randomUUID()}.${ext}`;
    const bytes = Buffer.from(await foto.arrayBuffer());
    const detectado = detectarTipoArchivo(bytes);
    if (detectado !== foto.type) throw new Error("El archivo no es una imagen válida");
    const { error: subError } = await sb.storage
      .from("site-images")
      .upload(path, bytes, { contentType: foto.type, upsert: false });
    if (subError) throw new Error(subError.message);
    pathNuevo = path;
    foto_url = sb.storage.from("site-images").getPublicUrl(path).data.publicUrl;
  }

  // Si es edición y se subió foto nueva, guardar la referencia de la actual
  // para borrar su archivo del bucket al confirmar el guardado.
  let fotoAnterior = null;
  if (id && foto_url) {
    const { data: original } = await sb
      .from("site_especialistas")
      .select("foto_url")
      .eq("id", id)
      .maybeSingle();
    fotoAnterior = original?.foto_url ?? null;
  }

  if (id) {
    const payload = { nombre, matricula, especialidad };
    if (orden) payload.orden = orden;
    if (foto_url) payload.foto_url = foto_url;
    const { error } = await sb
      .from("site_especialistas")
      .update(payload)
      .eq("id", id);
    if (error) {
      if (pathNuevo) await sb.storage.from("site-images").remove([pathNuevo]);
      throw new Error(error.message);
    }
  } else {
    const { error } = await sb.from("site_especialistas").insert({
      nombre,
      matricula,
      ...(especialidad ? { especialidad } : {}),
      ...(foto_url ? { foto_url } : {}),
      orden: orden ?? (await proximoOrden(sb, "site_especialistas")),
    });
    if (error) {
      if (pathNuevo) await sb.storage.from("site-images").remove([pathNuevo]);
      throw new Error(error.message);
    }
  }

  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/`;
  if (fotoAnterior && fotoAnterior.startsWith(prefix)) {
    await sb.storage.from("site-images").remove([fotoAnterior.slice(prefix.length)]);
  }
  revalidatePath("/");
  updateTag("site");
  return ok({ foto_url });
 } catch (err) {
  return fallo(err);
 }
}

export async function eliminarEspecialista(id) {
 try {
  const sb = await requireAdmin();
  const { data } = await sb
    .from("site_especialistas")
    .select("foto_url")
    .eq("id", id)
    .maybeSingle();
  const { error } = await sb.from("site_especialistas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (data?.foto_url) {
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/`;
    if (data.foto_url.startsWith(prefix)) {
      await sb.storage.from("site-images").remove([data.foto_url.slice(prefix.length)]);
    }
  }
  revalidatePath("/");
  updateTag("site");
  return ok();
 } catch (err) {
  return fallo(err);
 }
}

export async function reordenarEspecialista(id, direccion) {
 try {
  const sb = await requireAdmin();
  const { data: items, error } = await sb
    .from("site_especialistas")
    .select("id,orden")
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  const idx = (items ?? []).findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Especialista inexistente");
  const destino = direccion === "up" ? idx - 1 : idx + 1;
  if (destino < 0 || destino >= items.length) return ok();
  const a = items[idx];
  const b = items[destino];
  const oA = b.orden;
  const oB = a.orden;
  const { error: e1 } = await sb.from("site_especialistas").update({ orden: oA }).eq("id", a.id);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await sb.from("site_especialistas").update({ orden: oB }).eq("id", b.id);
  if (e2) throw new Error(e2.message);
  revalidatePath("/");
  updateTag("site");
  return ok();
 } catch (err) {
  return fallo(err);
 }
}

export async function cambiarVisibleEspecialista(id, visible) {
 try {
  const sb = await requireAdmin();
  const { error } = await sb
    .from("site_especialistas")
    .update({ visible: Boolean(visible) })
    .eq("id", id);
  if (error) {
    const msg = String(error.message ?? "");
    if (error.code === "PGRST204" || /column.*visible/i.test(msg) || error.code === "42703") {
      throw new Error(
        "Falta la columna 'visible' en site_especialistas. Ejecutá el SQL de supabase/schema.sql (o el ALTER TABLE) en Supabase y volvé a intentar."
      );
    }
    throw new Error(msg || "No se pudo actualizar la visibilidad");
  }
  revalidatePath("/");
  updateTag("site");
  return ok({ visible: Boolean(visible) });
 } catch (err) {
  return fallo(err);
 }
}

// ============ TRATAMIENTOS ============
export async function guardarTratamiento(formData) {
 try {
  const sb = await requireAdmin();
  const id = Number(formData.get("id")) || null;
  const nombre = maxLen("Nombre", formData.get("nombre"), 120);
  const descripcion = maxLen("Descripción", formData.get("descripcion"), 500);
  const alt = nombre;

  const imagenFile = formData.get("imagen");
  const imagen =
    imagenFile && typeof imagenFile === "object" && "size" in imagenFile
      ? imagenFile
      : null;
  if (imagen && imagen.size > 4_000_000) {
    throw new Error("La imagen pesa más de 4 MB");
  }
  if (imagen && (!imagen.type || !TIPOS_FOTO.has(imagen.type))) {
    throw new Error("Formato no permitido (JPG, PNG o WebP)");
  }

  // Política: solo cambia la imagen si se subió una nueva
  let imagen_url;
  let pathNuevoTratamiento = null;
  if (imagen && imagen.size > 0) {
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[imagen.type];
    if (!ext) throw new Error("Formato no permitido (JPG, PNG o WebP)");
    const path = `tratamientos/${crypto.randomUUID()}.${ext}`;
    const bytes = Buffer.from(await imagen.arrayBuffer());
    const detectado = detectarTipoArchivo(bytes);
    if (detectado !== imagen.type) throw new Error("El archivo no es una imagen válida");
    const { error: subError } = await sb.storage
      .from("site-images")
      .upload(path, bytes, { contentType: imagen.type, upsert: false });
    if (subError) throw new Error(subError.message);
    pathNuevoTratamiento = path;
    imagen_url = sb.storage.from("site-images").getPublicUrl(path).data.publicUrl;
  }

  let imagenAnterior = null;
  if (id && imagen_url) {
    const { data: original } = await sb
      .from("site_tratamientos")
      .select("imagen_url")
      .eq("id", id)
      .maybeSingle();
    imagenAnterior = original?.imagen_url ?? null;
  }

  if (id) {
    const payload = { nombre, descripcion, alt };
    if (imagen_url) payload.imagen_url = imagen_url;
    const { error } = await sb
      .from("site_tratamientos")
      .update(payload)
      .eq("id", id);
    if (error) {
      if (pathNuevoTratamiento) await sb.storage.from("site-images").remove([pathNuevoTratamiento]);
      throw new Error(error.message);
    }
  } else {
    const { error } = await sb.from("site_tratamientos").insert({
      nombre,
      descripcion,
      alt,
      ...(imagen_url ? { imagen_url } : {}),
      orden: await proximoOrden(sb, "site_tratamientos"),
    });
    if (error) {
      if (pathNuevoTratamiento) await sb.storage.from("site-images").remove([pathNuevoTratamiento]);
      throw new Error(error.message);
    }
  }

  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/`;
  if (imagenAnterior && imagenAnterior.startsWith(prefix)) {
    await sb.storage.from("site-images").remove([imagenAnterior.slice(prefix.length)]);
  }
  revalidatePath("/");
  updateTag("site");
  return ok({ imagen_url });
 } catch (err) {
  return fallo(err);
 }
}

export async function eliminarTratamiento(id) {
 try {
  const sb = await requireAdmin();
  const { data } = await sb
    .from("site_tratamientos")
    .select("imagen_url")
    .eq("id", id)
    .maybeSingle();
  const { error } = await sb.from("site_tratamientos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (data?.imagen_url) {
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/`;
    if (data.imagen_url.startsWith(prefix)) {
      await sb.storage.from("site-images").remove([data.imagen_url.slice(prefix.length)]);
    }
  }
  revalidatePath("/");
  updateTag("site");
  return ok();
 } catch (err) {
  return fallo(err);
 }
}

export async function reordenarTratamiento(id, direccion) {
 try {
  const sb = await requireAdmin();
  const { data: items, error } = await sb
    .from("site_tratamientos")
    .select("id,orden")
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  const idx = (items ?? []).findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Tratamiento inexistente");
  const destino = direccion === "up" ? idx - 1 : idx + 1;
  if (destino < 0 || destino >= items.length) return ok();
  const a = items[idx];
  const b = items[destino];
  const oA = b.orden;
  const oB = a.orden;
  const { error: e1 } = await sb.from("site_tratamientos").update({ orden: oA }).eq("id", a.id);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await sb.from("site_tratamientos").update({ orden: oB }).eq("id", b.id);
  if (e2) throw new Error(e2.message);
  revalidatePath("/");
  updateTag("site");
  return ok();
 } catch (err) {
  return fallo(err);
 }
}

// ============ PREGUNTAS ============
export async function guardarPregunta(input) {
 try {
  const sb = await requireAdmin();
  const pregunta = maxLen("Pregunta", input.pregunta, 255);
  const respuesta = maxLen("Respuesta", input.respuesta, 1000);
  const orden = Number(input.orden) > 0 ? Number(input.orden) : undefined;
  if (input.id) {
    const payload = { pregunta, respuesta };
    if (orden) payload.orden = orden;
    const { error } = await sb
      .from("site_preguntas")
      .update(payload)
      .eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("site_preguntas").insert({
      pregunta,
      respuesta,
      orden: orden ?? (await proximoOrden(sb, "site_preguntas")),
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  updateTag("site");
  return ok();
 } catch (err) {
  return fallo(err);
 }
}

export async function eliminarPregunta(id) {
 try {
  const sb = await requireAdmin();
  const { error } = await sb.from("site_preguntas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  updateTag("site");
  return ok();
 } catch (err) {
  return fallo(err);
 }
}

export async function reordenarPregunta(id, direccion) {
 try {
  const sb = await requireAdmin();
  const { data: items, error } = await sb
    .from("site_preguntas")
    .select("id,orden")
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  const idx = (items ?? []).findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Pregunta inexistente");
  const destino = direccion === "up" ? idx - 1 : idx + 1;
  if (destino < 0 || destino >= items.length) return ok();
  const a = items[idx];
  const b = items[destino];
  const oA = b.orden;
  const oB = a.orden;
  const { error: e1 } = await sb.from("site_preguntas").update({ orden: oA }).eq("id", a.id);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await sb.from("site_preguntas").update({ orden: oB }).eq("id", b.id);
  if (e2) throw new Error(e2.message);
  revalidatePath("/");
  updateTag("site");
  return ok();
 } catch (err) {
  return fallo(err);
 }
}

// ============ AVISOS (carteles flotantes) ============
// Solo tres datos: título, descripción (máximo 30 palabras) y una imagen.
export async function guardarBanner(formData) {
  try {
    const sb = await requireAdmin();
    const idBruto = limpiar(formData.get("id"));
    const id = idBruto ? Number(idBruto) : null;
    if (id && !Number.isInteger(id)) throw new Error("Aviso inexistente");

    const titulo = maxLen("Título", formData.get("titulo"), 100);
    const descripcion = maxLen("Descripción", formData.get("descripcion"), 300);
    const palabras = descripcion.split(/\s+/).filter(Boolean).length;
    if (palabras > 30) throw new Error("La descripción no puede superar las 30 palabras");

    const archivo = formData.get("imagen");
    const imagen =
      archivo && typeof archivo === "object" && "size" in archivo && archivo.size > 0
        ? archivo
        : null;
    if (!id && !imagen) throw new Error("Adjuntá una imagen");
    if (imagen) {
      if (imagen.size > 4_000_000) throw new Error("La imagen pesa más de 4 MB");
      if (!imagen.type || !TIPOS_FOTO.has(imagen.type)) {
        throw new Error("Formato no permitido (JPG, PNG o WebP)");
      }
    }

    // En edición se conserva la imagen actual si no se adjuntó una nueva.
    const { data: original } = id
      ? await sb.from("site_banners").select("imagen_url").eq("id", id).maybeSingle()
      : { data: null };

    let imagen_url = original?.imagen_url ?? null;
    let pathNuevo = null;
    if (imagen) {
      const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[imagen.type];
      if (!ext) throw new Error("Formato no permitido (JPG, PNG o WebP)");
      const path = `avisos/${crypto.randomUUID()}.${ext}`;
      const bytes = Buffer.from(await imagen.arrayBuffer());
      if (detectarTipoArchivo(bytes) !== imagen.type) {
        throw new Error("El archivo no es una imagen válida");
      }
      const { error: subError } = await sb.storage
        .from("site-images")
        .upload(path, bytes, { contentType: imagen.type, upsert: false });
      if (subError) throw new Error(subError.message);
      pathNuevo = path;
      imagen_url = sb.storage.from("site-images").getPublicUrl(path).data.publicUrl;
    }

    let avisoId = id;
    if (id) {
      const { error } = await sb
        .from("site_banners")
        .update({ titulo, descripcion, imagen_url })
        .eq("id", id);
      if (error) {
        if (pathNuevo) await sb.storage.from("site-images").remove([pathNuevo]);
        throw new Error(error.message);
      }
    } else {
      const { data, error } = await sb
        .from("site_banners")
        .insert({ titulo, descripcion, imagen_url, orden: await proximoOrden(sb, "site_banners") })
        .select("id")
        .maybeSingle();
      if (error) {
        if (pathNuevo) await sb.storage.from("site-images").remove([pathNuevo]);
        throw new Error(error.message);
      }
      avisoId = data?.id ?? null;
    }
    if (pathNuevo && original?.imagen_url && original.imagen_url !== imagen_url) {
      await borrarArchivoStorage(sb, original.imagen_url);
    }

    revalidatePath("/", "layout");
    updateTag("site");
    return ok({ id: avisoId });
  } catch (err) {
    return fallo(err);
  }
}

export async function eliminarBanner(id) {
  try {
    const sb = await requireAdmin();
    const { data } = await sb
      .from("site_banners")
      .select("imagen_url")
      .eq("id", Number(id))
      .maybeSingle();
    const { error } = await sb.from("site_banners").delete().eq("id", Number(id));
    if (error) throw new Error(error.message);
    if (data?.imagen_url) await borrarArchivoStorage(sb, data.imagen_url);
    revalidatePath("/", "layout");
    updateTag("site");
    return ok();
  } catch (err) {
    return fallo(err);
  }
}

// ============ OBRAS SOCIALES ============
const ICONOS_OS = new Set(["swiss", "osde", "sancor"]);

export async function guardarObraSocial(input) {
  try {
    const sb = await requireAdmin();
    const nombre = maxLen("Nombre", input.nombre, 60);
    const iconoBruto = limpiar(input.icono);
    const icono = ICONOS_OS.has(iconoBruto) ? iconoBruto : null;
    const orden = Number(input.orden) > 0 ? Number(input.orden) : undefined;
    if (input.id) {
      const payload = { nombre, icono };
      if (orden) payload.orden = orden;
      const { error } = await sb
        .from("site_obras_sociales")
        .update(payload)
        .eq("id", input.id);
      if (error) throw new Error(error.message);
      revalidatePath("/");
      updateTag("site");
      return ok({ id: Number(input.id) });
    }
    const { data: creada, error } = await sb
      .from("site_obras_sociales")
      .insert({
        nombre,
        icono,
        orden: orden ?? (await proximoOrden(sb, "site_obras_sociales")),
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    revalidatePath("/");
    updateTag("site");
    return ok({ id: creada?.id ?? null });
  } catch (err) {
    return fallo(err);
  }
}

export async function eliminarObraSocial(id) {
  try {
    const sb = await requireAdmin();
    const { error } = await sb.from("site_obras_sociales").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/");
    updateTag("site");
    return ok();
  } catch (err) {
    return fallo(err);
  }
}

export async function subirLogoObraSocial(formData) {
  try {
    const sb = await requireAdmin();
    const id = Number(formData.get("id"));
    if (!id) throw new Error("Obra social inexistente");
    const file = formData.get("file");
    if (!file || typeof file === "string" || !file.size) {
      throw new Error("Seleccioná un logo");
    }
    if (file.size > 4_000_000) throw new Error("El logo pesa más de 4 MB");
    if (!file.type || !TIPOS_FOTO.has(file.type)) {
      throw new Error("Formato no permitido (JPG, PNG o WebP)");
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const detectado = detectarTipoArchivo(bytes);
    if (detectado !== file.type || !TIPOS_FOTO.has(detectado)) {
      throw new Error("El archivo no es una imagen válida");
    }
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
    const path = `obras-sociales/${crypto.randomUUID()}.${ext}`;

    // Guardar referencia al logo actual para borrar su archivo al confirmar.
    const { data: actual } = await sb
      .from("site_obras_sociales")
      .select("logo_url")
      .eq("id", id)
      .maybeSingle();

    const { error } = await sb.storage
      .from("site-images")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    const url = sb.storage.from("site-images").getPublicUrl(path).data.publicUrl;
    const { error: updError } = await sb
      .from("site_obras_sociales")
      .update({ logo_url: url })
      .eq("id", id);
    if (updError) {
      await sb.storage.from("site-images").remove([path]);
      throw new Error(updError.message);
    }
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/`;
    if (actual?.logo_url?.startsWith(prefix)) {
      await sb.storage.from("site-images").remove([actual.logo_url.slice(prefix.length)]);
    }
    revalidatePath("/");
    updateTag("site");
    return ok({ url });
  } catch (err) {
    return fallo(err);
  }
}

export async function quitarLogoObraSocial(id) {
  try {
    const sb = await requireAdmin();
    const { data, error } = await sb
      .from("site_obras_sociales")
      .select("logo_url")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.logo_url) return ok();
    const { error: updError } = await sb
      .from("site_obras_sociales")
      .update({ logo_url: null })
      .eq("id", id);
    if (updError) throw new Error(updError.message);
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/`;
    if (data.logo_url.startsWith(prefix)) {
      await sb.storage.from("site-images").remove([data.logo_url.slice(prefix.length)]);
    }
    revalidatePath("/");
    updateTag("site");
    return ok();
  } catch (err) {
    return fallo(err);
  }
}

export async function reordenarObraSocial(id, direccion) {
  try {
    const sb = await requireAdmin();
    const { data: items, error } = await sb
      .from("site_obras_sociales")
      .select("id,orden")
      .order("orden", { ascending: true });
    if (error) throw new Error(error.message);
    const idx = (items ?? []).findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Obra social inexistente");
    const destino = direccion === "up" ? idx - 1 : idx + 1;
    if (destino < 0 || destino >= items.length) return ok();
    const a = items[idx];
    const b = items[destino];
    const { error: e1 } = await sb
      .from("site_obras_sociales")
      .update({ orden: b.orden })
      .eq("id", a.id);
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await sb
      .from("site_obras_sociales")
      .update({ orden: a.orden })
      .eq("id", b.id);
    if (e2) throw new Error(e2.message);
    revalidatePath("/");
    updateTag("site");
    return ok();
  } catch (err) {
    return fallo(err);
  }
}

export async function cambiarVisibleObraSocial(id, visible) {
  try {
    const sb = await requireAdmin();
    const { error } = await sb
      .from("site_obras_sociales")
      .update({ visible: Boolean(visible) })
      .eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/");
    updateTag("site");
    return ok({ visible: Boolean(visible) });
  } catch (err) {
    return fallo(err);
  }
}

// ============ CONTACTO ============
export async function guardarContacto(input) {
  try {
  const sb = await requireAdmin();
  const urlOpcional = (v) => {
    const t = limpiar(v);
    if (!t) return null;
    if (!/^https:\/\//.test(t)) throw new Error("Solo URLs https://");
    if (t.length > 500) throw new Error("URL demasiado larga");
    return t;
  };
  const telefono = (v) => {
    const t = limpiar(v);
    // Mismo criterio que el CHECK de la base (schema.sql): 6-24 caracteres.
    if (!/^[0-9][0-9+\-\s]{5,23}$/.test(t)) throw new Error("Teléfono inválido");
    return t;
  };
  const mapa_url = (v) => {
    let t = limpiar(v);
    if (!t) return null; // el campo es opcional
    // Si pegaron el HTML completo del iframe, se extrae el src.
    const srcIframe = t.match(/<iframe[^>]*\bsrc=["']([^"']+)["']/i);
    if (srcIframe) t = srcIframe[1];
    // Entidades HTML típicas al copiar el código de inserción.
    t = t.replace(/&amp;/g, "&");
    if (t.length > 500) throw new Error("URL del mapa demasiado larga");
    // Mismo criterio que el CHECK de la base (schema.sql): solo Google Maps.
    if (!/^https:\/\/www\.google\.com\/maps/.test(t)) {
      throw new Error("El mapa tiene que ser un enlace de Google Maps (https://www.google.com/maps...)");
    }
    return t;
  };
  // El sitio solo muestra teléfono de turnos (no urgencias ni email público).
  const payload = {
    direccion: maxLen("Dirección", input.direccion, 255),
    mapa_url: mapa_url(input.mapa_url),
    horario: maxLen("Horario", input.horario, 100),
    telefono_turnos: telefono(input.telefono_turnos),
    instagram: urlOpcional(input.instagram),
    facebook: urlOpcional(input.facebook),
  };
  const { error } = await sb.from("site_contacto").update(payload).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  updateTag("site");
  return ok();
  } catch (err) {
    return fallo(err);
  }
}

// ============ PERFIL DEL ADMINISTRADOR ============
const PREFIJO_STORAGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/`;

async function borrarArchivoStorage(sb, url) {
  if (!url || !url.startsWith(PREFIJO_STORAGE)) return;
  await sb.storage.from("site-images").remove([url.slice(PREFIJO_STORAGE.length)]);
}

export async function subirAvatarPerfil(formData) {
  try {
    const sb = await requireAdmin();
    const file = formData.get("file");
    if (!file || typeof file === "string" || !file.size) {
      throw new Error("Seleccioná una imagen");
    }
    if (file.size > 4_000_000) throw new Error("La imagen pesa más de 4 MB");
    if (!file.type || !TIPOS_FOTO.has(file.type)) {
      throw new Error("Formato no permitido (JPG, PNG o WebP)");
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const detectado = detectarTipoArchivo(bytes);
    if (detectado !== file.type || !TIPOS_FOTO.has(detectado)) {
      throw new Error("El archivo no es una imagen válida");
    }
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
    const path = `perfil/${crypto.randomUUID()}.${ext}`;

    const { data: actual } = await sb
      .from("site_contacto")
      .select("avatar_url")
      .eq("id", 1)
      .maybeSingle();

    const { error: uploadError } = await sb.storage.from("site-images").upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw new Error(uploadError.message);

    const url = sb.storage.from("site-images").getPublicUrl(path).data.publicUrl;
    const { error: updateError } = await sb
      .from("site_contacto")
      .update({ avatar_url: url })
      .eq("id", 1);
    if (updateError) {
      await sb.storage.from("site-images").remove([path]);
      throw new Error(updateError.message);
    }
    if (actual?.avatar_url && actual.avatar_url !== url) {
      await borrarArchivoStorage(sb, actual.avatar_url);
    }

    revalidatePath("/", "layout");
    updateTag("site");
    return ok({ url });
  } catch (err) {
    return fallo(err);
  }
}

export async function quitarAvatarPerfil() {
  try {
    const sb = await requireAdmin();
    const { data: actual } = await sb
      .from("site_contacto")
      .select("avatar_url")
      .eq("id", 1)
      .maybeSingle();
    const { error } = await sb.from("site_contacto").update({ avatar_url: null }).eq("id", 1);
    if (error) throw new Error(error.message);
    if (actual?.avatar_url) await borrarArchivoStorage(sb, actual.avatar_url);
    revalidatePath("/", "layout");
    updateTag("site");
    return ok();
  } catch (err) {
    return fallo(err);
  }
}

// ============ SEGURIDAD: CAMBIO DE CONTRASEÑA ============
// Límite de intentos por usuario en esta instancia (además del rate limit
// propio de Supabase Auth).
const intentosPassword = new Map();
const MAX_INTENTOS_PASSWORD = 5;
const BLOQUEO_PASSWORD_MS = 15 * 60 * 1000;
const PASSWORDS_COMUNES = new Set([
  "1234567890",
  "contraseña1",
  "password1",
  "qwerty1234",
  "administrador1",
]);

function validarPasswordNueva(p) {
  if (p.length < 10) throw new Error("La nueva contraseña necesita al menos 10 caracteres");
  if (p.length > 72) throw new Error("La nueva contraseña no puede superar los 72 caracteres");
  if (p !== p.trim()) throw new Error("La contraseña no puede empezar ni terminar con espacios");
  if (!/[a-z]/.test(p)) throw new Error("La nueva contraseña necesita al menos una minúscula");
  if (!/[A-Z]/.test(p)) throw new Error("La nueva contraseña necesita al menos una mayúscula");
  if (!/[0-9]/.test(p)) throw new Error("La nueva contraseña necesita al menos un número");
  if (PASSWORDS_COMUNES.has(p.toLowerCase())) {
    throw new Error("Esa contraseña es demasiado común. Elegí otra.");
  }
}

export async function cambiarPassword(input) {
  try {
    const sb = await requireAdmin();
    const {
      data: { user },
      error: userError,
    } = await sb.auth.getUser();
    if (userError || !user?.email) {
      throw new Error("Sesión vencida. Volvé a iniciar sesión.");
    }

    const actual = String(input?.actual ?? "");
    const nueva = String(input?.nueva ?? "");
    const repetir = String(input?.repetir ?? "");

    if (!actual) throw new Error("Ingresá tu contraseña actual");
    if (!nueva) throw new Error("Ingresá la nueva contraseña");
    if (nueva !== repetir) throw new Error("Las contraseñas nuevas no coinciden");
    if (nueva === actual) throw new Error("La nueva contraseña tiene que ser distinta de la actual");
    validarPasswordNueva(nueva);

    const clave = user.id;
    const ahora = Date.now();
    const registro = intentosPassword.get(clave);
    if (registro?.bloqueadoHasta && registro.bloqueadoHasta > ahora) {
      const minutos = Math.ceil((registro.bloqueadoHasta - ahora) / 60000);
      throw new Error(`Demasiados intentos fallidos. Esperá ${minutos} minuto(s).`);
    }

    // Reautenticación obligatoria: sin la contraseña actual no se cambia.
    const { error: authError } = await sb.auth.signInWithPassword({
      email: user.email,
      password: actual,
    });
    if (authError) {
      const fallos = (registro?.fallos ?? 0) + 1;
      intentosPassword.set(clave, {
        fallos,
        bloqueadoHasta: fallos >= MAX_INTENTOS_PASSWORD ? ahora + BLOQUEO_PASSWORD_MS : null,
      });
      throw new Error("La contraseña actual no es correcta");
    }

    const { error } = await sb.auth.updateUser({ password: nueva });
    if (error) {
      console.error(`[seguridad] updateUser: ${error.code} ${error.message}`);
      throw new Error("No se pudo cambiar la contraseña. Probá de nuevo.");
    }

    intentosPassword.delete(clave);
    // Cierra la sesión en el resto de los dispositivos.
    try {
      await sb.auth.signOut({ scope: "others" });
    } catch {
      // si el proveedor no lo soporta, el cambio de contraseña ya se hizo
    }

    revalidatePath("/admin");
    return ok({ mensaje: "Contraseña actualizada. Se cerraron las demás sesiones." });
  } catch (err) {
    return fallo(err);
  }
}
