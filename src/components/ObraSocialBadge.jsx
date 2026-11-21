import Image from "next/image";

// Badge visual del strip de Obras sociales.
// Prioridad: logo propio subido (logoUrl) > icono preset > tarjeta con el nombre.
// icono: 'swiss' | 'osde' | 'sancor' | null
export default function ObraSocialBadge({ icono, nombre, logoUrl }) {
  if (logoUrl) {
    return (
      <div
        className="flex h-12 max-w-[160px] items-center gap-2 rounded-xl bg-white px-3 shadow-sm"
        title={nombre}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={nombre}
          className="max-h-9 w-auto object-contain"
        />
      </div>
    );
  }
  if (icono === "swiss") {
    return (
      <div
        className="flex h-12 items-center gap-2 rounded-xl bg-white px-4 shadow-sm"
        title={nombre}
      >
        <div className="grid grid-cols-2 gap-[3px]" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-red-600" />
          <span className="h-2.5 w-2.5 rounded-[2px] bg-red-600" />
          <span className="h-2.5 w-2.5 rounded-[2px] bg-red-600" />
          <span className="h-2.5 w-2.5 rounded-[2px] bg-red-600" />
        </div>
        <span className="font-display text-[11px] font-extrabold leading-tight text-slate-700">
          SWISS
          <br />
          MEDICAL
        </span>
      </div>
    );
  }

  if (icono === "osde") {
    return (
      <div
        className="flex h-12 items-center justify-center rounded-xl bg-[#0033A0] px-5 shadow-sm"
        title={nombre}
      >
        <span className="text-xl font-black lowercase tracking-tight text-white">
          osde
        </span>
      </div>
    );
  }

  if (icono === "sancor") {
    return (
      <div
        className="flex h-12 items-center gap-2 rounded-xl bg-white px-4 shadow-sm"
        title={nombre}
      >
        <Image
          src="/sancor-salud.svg"
          alt=""
          width={26}
          height={26}
          className="h-[26px] w-[26px]"
          aria-hidden="true"
        />
        <span className="font-display text-[13px] font-bold leading-tight text-[#263D83]">
          SanCor{" "}
          <span className="font-medium text-[#263D83]/75">Salud</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex h-12 max-w-[11rem] items-center rounded-xl bg-white px-4 shadow-sm"
      title={nombre}
    >
      <span className="truncate font-display text-[12px] font-bold text-[#0b2233]">
        {nombre}
      </span>
    </div>
  );
}
