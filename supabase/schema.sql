-- ================================================================
-- Integrum Odontología — Esquema + políticas (hardened)
-- Correr UNA VEZ en el SQL Editor de Supabase como OWNER (postgres).
--
-- Antes de darle acceso al Panel de administración:
--   a) Authentication → Settings → desactivar "Allow new users to sign up".
--   b) Authentication → Users → Add user (mail del dueño).
--   c) Copiar el UUID de ese usuario y correr (una sola vez):
--        insert into public.admins (user_id) values ('<uuid-del-usuario>');
--      (el dueño es el único admin: el public.admins no tiene políticas
--       para clientes; solo el owner vía SQL o el service-role pueden
--       modificarlo.)
-- ================================================================

-- Nota: el script es idempotente (usa create * if not exists + on conflict).

-- ================================================================
-- 0) ADMINS: whitelist explícita de usuarios editores
-- ================================================================
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Permitir a cada usuario leer solo su propio registro (si existe).
-- Sin esta policy el endpoint público de login no puede consultarla desde el cliente.
-- El grant es necesario: sin él Postgres bloquea la lectura antes de RLS.
grant select on public.admins to authenticated;
drop policy if exists "admin_read_own" on public.admins;
create policy "admin_read_own" on public.admins
  for select to authenticated using (auth.uid() = user_id);

-- Sin policies de cliente: solo el owner (SQL Editor) o la service-role key
-- pueden administrar la lista de admins. RLS habilitada: los clientes
-- (anon / authenticated) no pueden leer ni escribir la tabla por la API.
alter table public.admins enable row level security;

-- Función SECURITY DEFINER: permite verificar membership sin exponer la tabla.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ================================================================
-- 1) AUDIT LOG + trigger function
-- ================================================================
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  action text not null,
  row_id text,
  actor uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- Solo el owner / service-role puede revisarla; los clientes no tienen acceso.
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;

create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  actor uuid;
  rid text;
begin
  actor := auth.uid();
  rid := case tg_op
    when 'DELETE' then (to_jsonb(OLD) ->> 'id')
    else (to_jsonb(NEW) ->> 'id')
  end;

  insert into public.audit_log (table_name, action, row_id, actor, old_data, new_data)
  values (
    tg_table_name,
    tg_op,
    rid,
    actor,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(OLD) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(NEW) else null end
  );

  return coalesce(NEW, OLD);
end;
$$;

-- ================================================================
-- 2) touch_updated_at(): el cliente no puede mentir sobre el tiempo
-- ================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ================================================================
-- 3) TABLAS
-- ================================================================
create table if not exists public.site_hero (
  id smallint primary key default 1 check (id = 1),
  image_url text not null
    check (image_url ~ '^(/[^/]|https://)' and char_length(image_url) <= 500),
  -- Encuadre del hero (porcentaje del punto focal), configurable desde el panel
  image_position text not null default '0% 18%'
    check (image_position ~ '^-?[0-9]{1,3}% -?[0-9]{1,3}%$'),
  image_scale numeric(3,2) not null default 1.18
    check (image_scale >= 1 and image_scale <= 4),
  titulo text not null
    check (char_length(titulo) between 1 and 100),
  subtitulo text not null
    check (char_length(subtitulo) between 1 and 150),
  descripcion text not null
    check (char_length(descripcion) between 1 and 500),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_nosotros (
  id smallint primary key default 1 check (id = 1),
  descripcion text not null
    check (char_length(descripcion) between 1 and 5000),
  updated_at timestamptz not null default now()
);

-- caption / sub: texto que muestra la galería del sitio (opcionales;
-- si no están, el sitio usa el alt).
create table if not exists public.site_galeria (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('foto', 'video')),
  src text not null
    check (src ~ '^(/[^/]|https://)' and char_length(src) <= 500),
  alt text not null
    check (char_length(alt) between 1 and 255),
  caption text check (caption is null or char_length(caption) <= 120),
  sub text check (sub is null or char_length(sub) <= 120),
  orden int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_especialistas (
  id bigint generated always as identity primary key,
  nombre text not null
    check (char_length(nombre) between 2 and 100),
  matricula text not null
    check (char_length(matricula) between 1 and 40),
  especialidad text check (especialidad is null or char_length(especialidad) <= 160),
  foto_url text
    check (foto_url is null or (foto_url ~ '^(/[^/]|https://)' and char_length(foto_url) <= 500)),
  orden int not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_tratamientos (
  id bigint generated always as identity primary key,
  nombre text not null
    check (char_length(nombre) between 2 and 120),
  descripcion text not null
    check (char_length(descripcion) between 10 and 500),
  imagen_url text
    check (imagen_url is null or (imagen_url ~ '^(/[^/]|https://)' and char_length(imagen_url) <= 500)),
  alt text not null
    check (char_length(alt) between 1 and 255),
  orden int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_preguntas (
  id bigint generated always as identity primary key,
  pregunta text not null
    check (char_length(pregunta) between 5 and 255),
  respuesta text not null
    check (char_length(respuesta) between 10 and 1000),
  orden int not null default 0,
  updated_at timestamptz not null default now()
);

-- Obras sociales y prepagas que se muestran en la home.
-- icono: 'swiss' | 'osde' | 'sancor' para las tres marcas con logo propio;
-- null = tarjeta simple con el nombre (para OSs agregadas a medida).
create table if not exists public.site_obras_sociales (
  id bigint generated always as identity primary key,
  nombre text not null
    check (char_length(nombre) between 2 and 60),
  icono text check (icono is null or icono in ('swiss', 'osde', 'sancor')),
  logo_url text
    check (logo_url is null or (logo_url ~ '^(/[^/]|https://)' and char_length(logo_url) <= 500)),
  visible boolean not null default true,
  orden int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_contacto (
  id smallint primary key default 1 check (id = 1),
  direccion text not null
    check (char_length(direccion) between 5 and 255),
  mapa_url text
    check (mapa_url is null or mapa_url ~ '^https://www\.google\.com/maps'),
  horario text not null
    check (char_length(horario) between 5 and 100),
  telefono_turnos text not null
    check (telefono_turnos ~ '^[0-9][0-9+\-\s]{5,23}$'),
  telefono_urgencias text not null
    check (telefono_urgencias ~ '^[0-9][0-9+\-\s]{5,23}$'),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  instagram text
    check (instagram is null or instagram ~ '^https://(www\.)?instagram\.com/'),
  facebook text
    check (facebook is null or facebook ~ '^https://(www\.)?facebook\.com/'),
  whatsapp text
    check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  -- Foto del avatar del administrador (se muestra en el navbar del sitio).
  avatar_url text
    check (avatar_url is null or (avatar_url ~ '^(/[^/]|https://)' and char_length(avatar_url) <= 500)),
  updated_at timestamptz not null default now()
);

-- ================================================================
-- 4) RLS: lectura pública anónima, escritura solo admins
-- ================================================================
alter table public.site_hero enable row level security;
alter table public.site_nosotros enable row level security;
alter table public.site_galeria enable row level security;
alter table public.site_especialistas enable row level security;
alter table public.site_tratamientos enable row level security;
alter table public.site_preguntas enable row level security;
alter table public.site_obras_sociales enable row level security;
alter table public.site_contacto enable row level security;

-- Lecturas: todos (sitio público)
create policy "anon_read_hero" on public.site_hero for select to anon, authenticated using (true);
create policy "anon_read_nosotros" on public.site_nosotros for select to anon, authenticated using (true);
create policy "anon_read_galeria" on public.site_galeria for select to anon, authenticated using (true);
create policy "anon_read_especialistas" on public.site_especialistas for select to anon, authenticated using (true);
create policy "anon_read_tratamientos" on public.site_tratamientos for select to anon, authenticated using (true);
create policy "anon_read_preguntas" on public.site_preguntas for select to anon, authenticated using (true);
create policy "anon_read_obras_sociales" on public.site_obras_sociales for select to anon, authenticated using (true);
create policy "anon_read_contacto" on public.site_contacto for select to anon, authenticated using (true);

-- Escrituras: solo admins (verificados por whitelist), una policy por operación
create policy "admin_insert_hero" on public.site_hero for insert to authenticated with check ((select public.is_admin()));
create policy "admin_update_hero" on public.site_hero for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
-- Sin DELETE: site_hero / site_nosotros / site_contacto son singletons, no se pueden borrar.

create policy "admin_insert_nosotros" on public.site_nosotros for insert to authenticated with check ((select public.is_admin()));
create policy "admin_update_nosotros" on public.site_nosotros for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin_insert_galeria" on public.site_galeria for insert to authenticated with check ((select public.is_admin()));
create policy "admin_update_galeria" on public.site_galeria for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin_delete_galeria" on public.site_galeria for delete to authenticated using ((select public.is_admin()));

create policy "admin_insert_especialistas" on public.site_especialistas for insert to authenticated with check ((select public.is_admin()));
create policy "admin_update_especialistas" on public.site_especialistas for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin_delete_especialistas" on public.site_especialistas for delete to authenticated using ((select public.is_admin()));

create policy "admin_insert_tratamientos" on public.site_tratamientos for insert to authenticated with check ((select public.is_admin()));
create policy "admin_update_tratamientos" on public.site_tratamientos for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin_delete_tratamientos" on public.site_tratamientos for delete to authenticated using ((select public.is_admin()));

create policy "admin_insert_preguntas" on public.site_preguntas for insert to authenticated with check ((select public.is_admin()));
create policy "admin_update_preguntas" on public.site_preguntas for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin_delete_preguntas" on public.site_preguntas for delete to authenticated using ((select public.is_admin()));

create policy "admin_insert_obras_sociales" on public.site_obras_sociales for insert to authenticated with check ((select public.is_admin()));
create policy "admin_update_obras_sociales" on public.site_obras_sociales for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin_delete_obras_sociales" on public.site_obras_sociales for delete to authenticated using ((select public.is_admin()));

create policy "admin_insert_contacto" on public.site_contacto for insert to authenticated with check ((select public.is_admin()));
create policy "admin_update_contacto" on public.site_contacto for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ================================================================
-- 5) Triggers: updated_at automático + auditoría
-- ================================================================
create trigger trg_touch_site_hero before update on public.site_hero for each row execute function public.touch_updated_at();
create trigger trg_touch_site_nosotros before update on public.site_nosotros for each row execute function public.touch_updated_at();
create trigger trg_touch_site_galeria before update on public.site_galeria for each row execute function public.touch_updated_at();
create trigger trg_touch_site_especialistas before update on public.site_especialistas for each row execute function public.touch_updated_at();
create trigger trg_touch_site_tratamientos before update on public.site_tratamientos for each row execute function public.touch_updated_at();
create trigger trg_touch_site_preguntas before update on public.site_preguntas for each row execute function public.touch_updated_at();
create trigger trg_touch_site_obras_sociales before update on public.site_obras_sociales for each row execute function public.touch_updated_at();
create trigger trg_touch_site_contacto before update on public.site_contacto for each row execute function public.touch_updated_at();

create trigger trg_audit_site_hero after insert or update or delete on public.site_hero for each row execute function public.log_audit();
create trigger trg_audit_site_nosotros after insert or update or delete on public.site_nosotros for each row execute function public.log_audit();
create trigger trg_audit_site_galeria after insert or update or delete on public.site_galeria for each row execute function public.log_audit();
create trigger trg_audit_site_especialistas after insert or update or delete on public.site_especialistas for each row execute function public.log_audit();
create trigger trg_audit_site_tratamientos after insert or update or delete on public.site_tratamientos for each row execute function public.log_audit();
create trigger trg_audit_site_preguntas after insert or update or delete on public.site_preguntas for each row execute function public.log_audit();
create trigger trg_audit_site_obras_sociales after insert or update or delete on public.site_obras_sociales for each row execute function public.log_audit();
create trigger trg_audit_site_contacto after insert or update or delete on public.site_contacto for each row execute function public.log_audit();

-- ================================================================
-- 6) Grants explícitos (defensa en profundidad además de RLS):
--    lectura pública limitada a las 8 tablas site_*; los clientes nunca
--    reciben permisos directos sobre admins ni audit_log.
-- ================================================================
revoke all on
  public.site_hero, public.site_nosotros, public.site_galeria,
  public.site_especialistas, public.site_tratamientos,
  public.site_preguntas, public.site_obras_sociales, public.site_contacto
from anon, authenticated;

revoke all on public.admins from anon, authenticated;
revoke all on public.audit_log from anon, authenticated;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.touch_updated_at() from public, anon;
revoke all on function public.log_audit() from public, anon;

grant usage on schema public to anon, authenticated;
grant select on
  public.site_hero,
  public.site_nosotros,
  public.site_galeria,
  public.site_especialistas,
  public.site_tratamientos,
  public.site_preguntas,
  public.site_obras_sociales,
  public.site_contacto
  to anon, authenticated;

grant insert, update, delete on
  public.site_hero,
  public.site_nosotros,
  public.site_galeria,
  public.site_especialistas,
  public.site_tratamientos,
  public.site_preguntas,
  public.site_obras_sociales,
  public.site_contacto
  to authenticated;

-- ================================================================
-- 7) Storage: bucket site-images (público de lectura, escritura solo
--    admins) con 5 MB de límite por archivo y sin SVG.
-- ================================================================
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

-- Videos livianos contenidos por el sitio: tope 5 MB (el panel también
-- rechaza MP4 >5 MB e imágenes >4 MB; este tope es la última barrera).
update storage.buckets
set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4'
  ]
where id = 'site-images';

-- Lectura pública dentro del bucket (el sitio sirve las imágenes sin auth).
create policy "public_read_site_images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-images');

-- Escritura: solo admins autenticados; reemplazo por operación.
create policy "admin_write_site_images"
  on storage.objects for all to authenticated
  using (bucket_id = 'site-images' and (select public.is_admin()))
  with check (bucket_id = 'site-images' and (select public.is_admin()));

-- ================================================================
-- 8) SEED: contenido actual del sitio Integrum
-- ================================================================
insert into public.site_hero (id, image_url, titulo, subtitulo, descripcion) values
  (1,
   '/consulta-dental-moderna.jpg',
   'Centro
Odontológico',
   'Salud, confianza y bienestar en cada sonrisa.',
   'Brindamos atención odontológica integral, combinando experiencia profesional, tecnología y un enfoque personalizado para cada paciente.')
on conflict (id) do nothing;

insert into public.site_nosotros (id, descripcion) values
  (1,
   'Integrum Odontología nació en 2020 bajo el nombre de MENAMORAES, iniciando un camino de crecimiento y compromiso con la salud bucal de nuestra comunidad. En 2023 renovamos nuestra identidad y nos convertimos en Integrum, reflejando la evolución de nuestro equipo y nuestra visión de una odontología integral.

Contamos con una amplia trayectoria profesional y un equipo que apuesta a la capacitación y actualización constante, incorporando nuevas técnicas y tecnologías para ofrecer tratamientos de calidad.

Hoy, en Río Gallegos, trabajamos con dedicación, cercanía y compromiso, brindando atención personalizada y soluciones odontológicas para toda la familia.')
on conflict (id) do nothing;

insert into public.site_galeria (tipo, src, alt, caption, sub, orden) values
  ('foto', '/Nosotros1.png', 'Fachada del Centro Odontológico Integrum', 'Centro Odontológico Integrum', 'Río Gallegos, Santa Cruz', 1),
  ('foto', '/Nosotros3.png', 'Consultorio completo con sillón, escritorio y puerta con nombre del odontólogo', 'Consultorio principal', 'Cirugía, implantes y prótesis', 2),
  ('foto', '/Nosotros4.png', 'Consultorio con sillón odontológico y gabinetes blancos', 'Consultorio de diagnóstico', 'Equipamiento de última generación', 3),
  ('foto', '/Nosotros5.png', 'Consultorio privado del Integrum con área de atención y sillones', 'Consultorio privado', 'Un ambiente cálido para tu consulta', 4),
  ('foto', '/Nosotros6.png', 'Consultorio con sillón odontológico, gabinetes blancos y espacio de atención', 'Consultorio equipado', 'Tecnología y comodidad en cada consulta', 5),
  ('foto', '/Nosotros7.png', 'Sala de espera con butacas azules y puerta del Consultorio 2', 'Sala de espera', 'Consultorio 2 · Atención por turno', 6),
  ('foto', '/Nosotros8.png', 'Hall principal del Integrum con butacas, consultorios y piso decorativo', 'Hall principal', 'Bienvenidos al Integrum', 7)
on conflict do nothing;

insert into public.site_especialistas (nombre, matricula, especialidad, foto_url, orden) values
  ('Martín Oscar Mena',
   'MP 385',
   'Implantes · Cirugía · Prótesis · Odontología Digital · Estética orofacial',
   '/Mena.jpg',
   1),
  ('Nadia Romina Moraes',
   'MP 484',
   'Ortodoncia · Ortopedia · Odontopediatría',
   '/Moraes.jpg',
   2)
on conflict do nothing;

insert into public.site_tratamientos (nombre, descripcion, imagen_url, alt, orden) values
  ('Ortodoncia con Brackets',
   'Dientes alineados para una sonrisa perfecta, con la técnica que mejor se adapta a vos.',
   '/ortodoncia.jpg',
   'Paciente con brackets durante su tratamiento de ortodoncia',
   1),
  ('Implantes Dentales',
   'Recuperá la confianza al sonreír con implantes de alta precisión.',
   '/protesisDentales.jpg',
   'Prótesis dental sobre implantes para recuperar la sonrisa',
   2),
  ('Alineadores Invisibles',
   'Alineá tu sonrisa de forma práctica y discreta, sin que nadie lo note.',
   '/alineador.jpg',
   'Sonrisa evaluada con espejo dental para alineadores invisibles',
   3),
  ('Tratamiento de ATM',
   'Alivio del dolor y de la articulación mandibular con abordaje integral.',
   '/Fisioterapia-ATM.webp',
   'Fisioterapia mandibular para el tratamiento de la ATM',
   4),
  ('Carillas Dentales',
   'Una sonrisa impecable al instante con carillas hechas a tu medida.',
   '/carillas.jpg',
   'Paciente admirando su nueva sonrisa con carillas frente al espejo',
   5),
  ('Tratamiento de Conducto',
   'Endodoncia moderna: rescatamos tu diente sin dolor y con la mejor tecnología.',
   '/tratamientoConducto.jpg',
   'Instrumentación y tratamiento endodóntico en el sillón',
   6),
  ('Odontología Digital',
   'Escaneo intraoral y planificación digital para prótesis y tratamientos de precisión.',
   '/odontologia_digital.jpg',
   'Odontología digital: escaneo intraoral y planificación 3D',
   7),
  ('Blanqueamiento Dental',
   'Dientes hasta 8 tonos más blancos con técnicas seguras e inmediatas.',
   '/blaqueamiento.jpg',
   'Blanqueamiento dental con lámpara LED',
   8),
  ('Periodoncia',
   'Cuidá tus encías y prevení la pérdida dental con terapia periodontal.',
   '/periodoncia-v2.jpg',
   'Inflamación de encías tratada con instrumentación periodontal',
   9)
on conflict do nothing;

insert into public.site_preguntas (pregunta, respuesta, orden) values
  ('¿Cómo pido un turno?',
   'Escribinos por WhatsApp al 2966-306555 y te ayudamos a elegir el día y horario que mejor te queden.',
   1),
  ('¿Qué obras sociales atienden?',
   'Trabajamos con Swiss Medical, OSDE y SanCor Salud. Consultanos por tu plan al pedir tu turno y te confirmamos la cobertura antes de tu visita.',
   2),
  ('¿Dónde están ubicados?',
   'En Comodoro Py 528, Río Gallegos, Santa Cruz. Estamos en el centro, con acceso simple y cerca de la zona céntrica.',
   3),
  ('¿Cuáles son los horarios de atención?',
   'Atendemos de lunes a viernes de 9 a 12 y de 14 a 18 hs. Consultanos por WhatsApp por turnos en otros horarios.',
   4),
  ('¿Atienden a toda la familia?',
   'Sí. Realizamos desde controles de rutina y odontopediatría hasta cirugías e implantes, con un trato cercano y personalizado para cada edad.',
   5),
  ('¿Necesito una consulta antes de empezar el tratamiento?',
   'Sí. La primera consulta nos permite evaluar tu caso, resolver tus dudas y definir juntos el tratamiento más indicado.',
   6),
  ('¿Qué hago si tengo una urgencia?',
   'Escribinos por WhatsApp y te orientamos de inmediato para que puedas atenderte lo antes posible.',
   7)
on conflict do nothing;

insert into public.site_obras_sociales (nombre, icono, orden) values
  ('Swiss Medical', 'swiss', 1),
  ('OSDE', 'osde', 2),
  ('SanCor Salud', 'sancor', 3)
on conflict do nothing;

insert into public.site_contacto (id, direccion, mapa_url, horario, telefono_turnos, telefono_urgencias,
                                  instagram, facebook, whatsapp) values
  (1,
   'Comodoro Py 528, Río Gallegos, Santa Cruz',
   'https://www.google.com/maps?q=Comodoro%20Py%20528%2C%20R%C3%ADo%20Gallegos%2C%20Santa%20Cruz&output=embed',
   'Lunes a viernes: 9 a 12 y 14 a 18 hs',
   '2966-306555',
   '2966-306555',
   'https://www.instagram.com/integrumrgl',
   'https://www.facebook.com/Integrumrgl',
   '5492966306555')
on conflict (id) do nothing;

-- ================================================================
-- 9) MIGRACIÓN para bases que ya ejecutaron una versión anterior
-- ================================================================
-- Si ya corriste el schema de versiones anteriores, ejecutá estos ALTER
-- TABLE para agregar las columnas nuevas:
alter table public.site_obras_sociales
  add column if not exists logo_url text
    check (logo_url is null or (logo_url ~ '^(/[^/]|https://)' and char_length(logo_url) <= 500));

alter table public.site_hero
  add column if not exists image_position text not null default '0% 18%';

alter table public.site_hero
  add column if not exists image_scale numeric(3,2) not null default 1.18;

-- El encuadre admite desplazamientos negativos (la foto se puede mover más allá
-- del borde) y un zoom de 1 a 4. Se recrean los CHECK por si la base tenía una
-- versión anterior más restrictiva.
alter table public.site_hero
  drop constraint if exists site_hero_image_position_check;
alter table public.site_hero
  add constraint site_hero_image_position_check
  check (image_position ~ '^-?[0-9]{1,3}% -?[0-9]{1,3}%$');

alter table public.site_hero
  drop constraint if exists site_hero_image_scale_check;
alter table public.site_hero
  add constraint site_hero_image_scale_check
  check (image_scale >= 1 and image_scale <= 4);

-- Foto de perfil del administrador (avatar del navbar).
alter table public.site_contacto
  add column if not exists avatar_url text
    check (avatar_url is null or (avatar_url ~ '^(/[^/]|https://)' and char_length(avatar_url) <= 500));

-- ================================================================
-- 10) NOTAS IMPORTANTES
-- ================================================================
-- a) Las matrículas cargadas son las reales publicadas en el sitio.
-- b) Deshabilitar el signup público de Auth antes de habilitar el panel
--    (Authentication → Providers → Email → Disable signups).
-- c) Agregar el primer admin ejecutando:
--      insert into public.admins (user_id) values ('<uuid-de-auth.users>');
--    (sin este paso nadie puede escribir en el sitio desde el panel).
-- d) El bucket site-images admite 5 MB por archivo (imágenes ≤4 MB, videos
--    ≤5 MB — ver sección de Server Actions del panel). El panel rechaza
--    tamaños mayores antes de llegar al bucket.
-- e) La tabla public.audit_log registra to_jsonb(OLD/NEW) por operación;
--    solo el service-role / el dashboard pueden leerla; los clientes no.
-- f) Activá backups/PITR en el plan de Supabase (producción).

-- ================================================================
-- CARTELES FLOTANTES (site_banners)
-- Banners que se muestran cubriendo la pantalla al ingresar al sitio;
-- el paciente debe cerrar el cartel para poder seguir navegando.
-- ================================================================
create table if not exists public.site_banners (
  id bigint generated always as identity primary key,
  titulo text not null
    check (char_length(titulo) between 1 and 100),
  descripcion text not null
    check (char_length(descripcion) between 1 and 300),
  -- CSP del sitio permite imágenes de Supabase (storage) y de /public:
  imagen_url text not null
    check (imagen_url ~ '^(/[^/]|https://)' and char_length(imagen_url) <= 500),
  visible boolean not null default true,
  orden int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.site_banners enable row level security;

-- Lectura: pública (el sitio muestra los carteles activos a cualquier visitante).
drop policy if exists "anon_read_banners" on public.site_banners;
create policy "anon_read_banners" on public.site_banners for select to anon, authenticated using (true);
-- Escritura: solo admins (whitelist en public.admins).
drop policy if exists "admin_insert_banners" on public.site_banners;
create policy "admin_insert_banners" on public.site_banners for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "admin_update_banners" on public.site_banners;
create policy "admin_update_banners" on public.site_banners for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "admin_delete_banners" on public.site_banners;
create policy "admin_delete_banners" on public.site_banners for delete to authenticated using ((select public.is_admin()));

drop trigger if exists trg_touch_site_banners on public.site_banners;
create trigger trg_touch_site_banners before update on public.site_banners for each row execute function public.touch_updated_at();
drop trigger if exists trg_audit_site_banners on public.site_banners;
create trigger trg_audit_site_banners after insert or update or delete on public.site_banners for each row execute function public.log_audit();

revoke all on public.site_banners from anon, authenticated;
grant select on public.site_banners to anon, authenticated;
grant insert, update, delete on public.site_banners to authenticated;
