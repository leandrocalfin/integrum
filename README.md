# Integrum Odontología

Sitio institucional + panel de administración del consultorio Integrum
Odontología. Sitio público con contenido administrable (portada, nosotros,
galería, equipo, tratamientos, preguntas frecuentes, obras sociales, datos
de contacto).

---

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19
- **Tailwind CSS v4**
- **Supabase** (Postgres + Auth + Storage) como backend y CMS
- **ISR** en el sitio público + `updateTag("site")` en los guardados del panel
- **CSP, HSTS y headers de seguridad** activos en producción

Sin dependencias de IA ni servicios pagos externos obligatorios.

---

## Requisitos

- Node.js 20.9+
- Cuenta en Supabase (gratis)
- (Opcional) Cuenta de Cloudflare para Turnstile (anti-bot del login)

---

## Instalación local

```bash
npm install
cp .env.example .env.local   # completar valores
npm run dev                    # http://localhost:3000
```

Variables de entorno: ver `.env.example`. Solo las dos de Supabase son
obligatorias. El sitio público y el panel funcionan sin más nada.

---

## Puesta en producción (resumen)

1. Crear proyecto en https://supabase.com (Free alcanza).
2. **SQL Editor** → pegar y ejecutar `supabase/schema.sql` completo.
   - Crea tablas, RLS, políticas, bucket `site-images` y el seed de contenido.
3. **Storage** se configura solo (el script crea el bucket).
4. **Authentication → Settings** → **desactivar "Allow new users to sign up"**
   (recomendado: solo el dueño se registra).
5. **Crear el primer admin**: registrar usuario (Authentication → Users → Add user),
   tomar de ahí el `id` (uuid) y ejecutar:
   ```sql
   insert into public.admins (user_id) values ('<uuid-del-usuario>');
   ```
6. **Variables de entorno en el hosting** (Vercel, Netlify, VPS...):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (dominio público; para robots.txt y sitemap.xml)
   - (Opcional) `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`
7. **Build y arranque**:
   ```bash
   npm install
   npm run build
   npm run start   # o plataforma equivalente
   ```
8. Entrar a `https://tudominio/admin` con las credenciales creadas en el paso 5.
9. Dominio + HTTPS (estándar en Vercel/Netlify). HSTS y CSP ya vienen activos.

### Verificación después del deploy

- [ ] Home carga con contenido (hero, tratamientos, equipo, etc.)
- [ ] `/admin` redirige a `/admin/login` sin sesión
- [ ] Login funciona con el usuario admin
- [ ] Guardar un cambio en el panel se ve en la home
- [ ] `robots.txt` y `sitemap.xml` responden (si no aparece `/admin`)

---

## Panel de administración

Acceder en `https://tudominio/admin`. Solo usuarios registrados como admins
en Supabase (`public.admins`). Sin sesión, el proxy redirige a `/admin/login`.

Secciones:

- **Inicio** — imagen, título, subtítulo y texto de la portada, con **encuadre
  interactivo** (arrastrás la foto con el mouse)
- **Nosotros** — texto de "Quiénes somos" + galería (máx. 7 fotos y 2 videos)
  + **obras sociales y prepagas** visibles en la home
- **Equipo** — profesionales (nombre, matrícula, especialidad, foto; se pueden
  ocultar y reordenar)
- **Tratamientos** — tarjetas de servicios (imagen + nombre + descripción)
- **Preguntas** — preguntas frecuentes
- **Datos y redes** — dirección, horario, teléfono de turnos e Instagram/Facebook.
  El mapa se puede generar solo desde la dirección o pegando el código de
  "Insertar un mapa" de Google Maps (se extrae la URL automáticamente)
- **Perfil y seguridad** — foto de perfil del administrador (la del navbar) y
  cambio de contraseña con reautenticación, contraseña actual obligatoria,
  mínimo 10 caracteres y cierre de las demás sesiones

Los cambios hechos desde el panel se ven al instante en la web.

### Actualizar una base ya creada

Si el proyecto Supabase ya estaba funcionando antes de estos cambios, ejecutá
una vez en el **SQL Editor**:

```sql
-- Foto de perfil del administrador
alter table public.site_contacto
  add column if not exists avatar_url text
    check (avatar_url is null or (avatar_url ~ '^(/[^/]|https://)' and char_length(avatar_url) <= 500));

-- Encuadre del hero
alter table public.site_hero
  add column if not exists image_position text not null default '0% 18%';
alter table public.site_hero
  add column if not exists image_scale numeric(3,2) not null default 1.18;

-- El encuadre admite valores negativos; si la base tiene una versión anterior
-- más restrictiva, se recrean los CHECK.
alter table public.site_hero drop constraint if exists site_hero_image_position_check;
alter table public.site_hero add constraint site_hero_image_position_check
  check (image_position ~ '^-?[0-9]{1,3}% -?[0-9]{1,3}%$');
alter table public.site_hero drop constraint if exists site_hero_image_scale_check;
alter table public.site_hero add constraint site_hero_image_scale_check
  check (image_scale >= 1 and image_scale <= 4);

notify pgrst, 'reload schema';
```

El bloque 9 de `supabase/schema.sql` ya incluye estas migraciones.

---

## Mantenimiento y copias de seguridad

### Keepalive de Supabase (evitar pausa del plan Free)

Supabase Free **pausa el proyecto tras 7 días sin actividad**. Para evitarlo
sin servicios pagos:

- `workers/keepalive-worker.js` — Worker standalone para Cloudflare Workers.
  Hace un GET a `/api/keepalive` cada 2 días con un secreto compartido.
  Configuración (todo desde el dashboard de Cloudflare, sin código local):
  1. Workers & Pages → Create Worker → pegar el archivo → Deploy
  2. Settings > Variables:
     - `SITE_URL` = `https://tu-dominio.com` (sin barra final)
     - `KEEPALIVE_SECRET` = secreto largo aleatorio (marcar como Secret)
  3. Triggers > Cron Triggers > Add Cron: `0 8 */2 * *`
- En el hosting del sitio (Vercel u otro), la misma variable `KEEPALIVE_SECRET`.
- `/api/keepalive` ejecuta una query real en Supabase y cuenta como actividad.
  Fuera de horario, cada 2 días es de sobra. El endpoint vive dentro del sitio.

### Backup de base de datos (contenido editado)

```bash
pg_dump "postgresql://postgres:[SENHA]@db.[REF].supabase.co:5432/postgres" \
  --schema=public --format=custom > backup-$(date +%F).dump
# Restaurar: pg_restore -d "postgresql://postgres:[SENHA]@db.[REF].supabase.co:5432/postgres" backup-fecha.dump
```

### Backup de archivos (imágenes subidas por el panel)

Descarga desde el Dashboard (Storage → site-images → Download all) o con la CLI:

```bash
npx supabase@latest storage cp -r site-images ./backup-storage/
```

### Backup automático (sugerido)

- **Semanal**: `pg_dump` + descarga del bucket a una carpeta fechada
- **Supabase**: revisar retención de backups según el plan (PITR en Pro)

### Restaurar en un proyecto Supabase nuevo

1. Crear proyecto Supabase nuevo
2. Ejecutar `supabase/schema.sql` en SQL Editor
3. Restaurar backup con `pg_restore` (o cargar dump SQL como lo hiciste la primera vez)
4. Recrear el bucket `site-images` con el mismo contenido
5. Crear el usuario admin nuevamente en Authentication
6. Actualizar las variables de entorno en el hosting con las nuevas claves

---

## Entrega a un comprador / cliente

Transferir una web es más que dar las claves:

1. **Dominio** — transferir registrar o cambiar nameservers
2. **Hosting** — transferir la cuenta de Vercel/Netlify (o el VPS)
3. **Supabase** — transferir el proyecto a la organización del comprador
   (Dashboard → Project Settings → General → Transfer project)
4. **Claves** — el comprador recibe todas las claves nuevas que genere
5. **Documentación** — este README + `supabase/schema.sql` como referencia
6. **Credenciales del panel** — el dueño conserva o rota las de `public.admins`

### Para el cliente final

- La web funciona sin que el cliente sepa nada de esto
- El cliente ve: su web + el panel para editarla
- Cualquier cambio no soportado desde el panel, podés hacerlo con un poco de ayuda técnica
- **Nada es obligatorio técnico**: el cliente no necesita saber que existe Next.js, Supabase, ni nada más

---

## Estructura del proyecto

```
src/
├── app/
│   ├── layout.js              # Root layout (Geist/Poppins/Inter)
│   ├── page.js                # Home
│   ├── robots.js              # robots.txt
│   ├── sitemap.js             # sitemap.xml
│   ├── aviso-legal/           # Páginas legales
│   ├── politica-de-privacidad/
│   ├── politica-de-cookies/
│   ├── admin/                 # Panel
│   │   ├── page.js            # /admin (requiere sesión + admin)
│   │   ├── actions.js         # Server Actions (escrituras validadas)
│   │   ├── panel.jsx          # Tabs del panel
│   │   ├── login/             # FormularioLogin + page
│   │   └── *-admin.jsx        # Inicio, Nosotros (+ Obras sociales), Equipo,
│   │                          # Tratamientos, Preguntas, Datos
├── components/                # NavBar, Footer, GalleryCarousel, FaqSection,
│                              # ContactoSection, ObraSocialBadge, BackToTop
├── lib/
│   ├── supabaseServer.js      # Cliente SSR con cookies (para admin)
│   ├── supabaseBrowser.js     # Cliente browser (detección de sesión en NavBar)
│   ├── supabasePublic.js      # Cliente para ISR (unstable_cache)
│   ├── contenido.js           # ISR + getContenido() + DEFAULT_CONTENT
│   └── whatsapp.js            # Enlace de WhatsApp con mensaje predeterminado
├── supabase/
│   └── schema.sql             # Schema completo + seed + policies + bucket
├── workers/
│   └── keepalive-worker.js    # Worker independiente para keepalive (Cloudflare)
├── public/                    # Assets estáticos servidos en /
└── .env.example               # Plantilla de variables de entorno
```

---

## Notas técnicas relevantes

- **ISR**: la home revalida como mucho una vez al día; el panel invalida al guardar.
- **Auth**: `@supabase/ssr` + `is_admin()` (Postgres SECURITY DEFINER) como puerta.
- **Panel**: noindex, no es página pública. Requiere sesión + estar en `public.admins`.
- **RLS** en todas las tablas: lectura pública, escritura solo admins.
- **Storage**: bucket `site-images` público de solo lectura; escritura solo admins.
- **Anti-bot**: Turnstile opcional; si no hay secret en producción, el login se cierra.
- **CSP + HSTS**: configurados en `next.config.mjs` (ver ahí para el detalle).

---

## Contacto y soporte

Proyecto entregado por Leandro Calfin — www.leandrocalfin.com.ar
