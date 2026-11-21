import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabaseServer";

// Estado de la sesión del propio visitante. Lo usa la navbar para mostrar (o
// no) el avatar y el menú de administrador. Solo devuelve datos del usuario
// actual, nunca de otros.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, isAdmin } = await getAdminUser();
    return NextResponse.json({
      autenticado: Boolean(user),
      esAdmin: Boolean(isAdmin),
      email: user?.email ?? null,
    });
  } catch (err) {
    console.error("[sesion]", err?.message ?? err);
    // Sin sesión es una respuesta válida, no un error: la navbar la oculta.
    return NextResponse.json({ autenticado: false, esAdmin: false, email: null });
  }
}
