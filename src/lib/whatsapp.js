// Datos de contacto de WhatsApp y enlace con mensaje predeterminado.
// Todos los botones de "Pedir turno" y el botón flotante usan esta URL.
export const WHATSAPP_NUMBER = "5492966306555";
export const PHONE_DISPLAY = "2966-306555";
export const PHONE_TEL = "+542966306555";

export const WHATSAPP_MESSAGE =
  "Hola, quisiera pedir un turno en Integrum Odontología. ¿Tienen disponibilidad esta semana?";

export const WHATSAPP_TRATAMIENTOS_MESSAGE =
  "Hola, quisiera más información sobre los tratamientos de Integrum Odontología.";

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

// Para el CTA de la sección Tratamientos ("Quiero más información").
export const WHATSAPP_TRATAMIENTOS_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_TRATAMIENTOS_MESSAGE
)}`;
