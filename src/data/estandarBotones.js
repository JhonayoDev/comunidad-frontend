// Catálogo ejecutable del estándar de botones — ÚNICA FUENTE.
// Generado desde audit/03-decisiones-visuales.json (revisión visual en el UI Lab).
// Lo consumen: AppButton.vue, el UI Lab (UiLabEstandar/UiLabBotones) y la IA.
// Los colores/hover/focus viven en src/theme/prime-theme.js, NO aquí.
// Regla: una vista puede aportar contenido (label/icon/title) y, con motivo
// documentado, una prop de estilo; nunca style inline ni clases de color.

export const ESTANDAR = [
  {
    slug: "primaria",
    nombre: "Primaria",
    uso: "Acción principal de la vista o diálogo (una sola por contexto).",
    contexto: "dialogo",
    props: { label: "Guardar" },
  },
  {
    slug: "secundaria",
    nombre: "Secundaria",
    uso: "Acción alternativa no destructiva con peso visual medio.",
    contexto: "suelto",
    props: { label: "Buscar", severity: "secondary" },
  },
  {
    slug: "cancelar",
    nombre: "Cancelar / texto secundario",
    uso: "Salir sin guardar: siempre texto secundario.",
    contexto: "dialogo",
    props: { label: "Cancelar", severity: "secondary", variant: "text" },
  },
  {
    slug: "contorno",
    nombre: "Contorno / editar",
    uso: "Editar con etiqueta en formularios y cards (en tablas va solo ícono).",
    contexto: "suelto",
    props: { label: "Editar", severity: "secondary", variant: "outlined", size: "small" },
  },
  {
    slug: "solo-icono",
    nombre: "Solo ícono tabla",
    uso: "Acción neutra por fila (quitar blando, colapsar, ver) sin etiqueta.",
    contexto: "tabla",
    props: {
      icon: "pi pi-trash",
      severity: "secondary",
      variant: "text",
      size: "small",
      rounded: true,
      title: "Quitar",
    },
  },
  {
    slug: "peligro-texto",
    nombre: "Peligro texto (tabla)",
    uso: "Quitar por fila solo si la acción es destructiva; si es blanda usa solo ícono neutro.",
    contexto: "tabla",
    props: {
      icon: "pi pi-trash",
      severity: "danger",
      variant: "text",
      size: "small",
      rounded: true,
      title: "Quitar",
    },
  },
  {
    slug: "peligro-solido",
    nombre: "Peligro sólido",
    uso: "Acción destructiva e irreversible (elimina datos).",
    contexto: "suelto",
    props: { label: "Eliminar", severity: "danger" },
  },
  {
    slug: "ingreso",
    nombre: "Ingreso",
    uso: "Excepción semántica: registrar ingreso (verde).",
    contexto: "suelto",
    props: { label: "Registrar ingreso", severity: "success" },
  },
  {
    slug: "salida",
    nombre: "Salida",
    uso: "Excepción semántica: registrar salida (amarillo).",
    contexto: "suelto",
    props: { label: "Registrar salida", severity: "warn" },
  },
  {
    slug: "info",
    nombre: "Info de dominio",
    uso: "Excepción semántica: información propia del dominio (azul).",
    contexto: "suelto",
    props: { label: "Ver detalle", severity: "info" },
  },
  {
    slug: "texto-link",
    nombre: "Texto / link",
    uso: "Navegación terciaria o ver-más, sin peso de botón.",
    contexto: "suelto",
    props: { label: "Ver todas", variant: "text", severity: "secondary", size: "small" },
  },
];

// Claves de estilo que definen el "core" visual. Si una vista las sobrescribe,
// AppButton avisa en DEV: o es desvío con motivo, o falta una intención nueva.
export const CLAVES_ESTILO = ["severity", "variant", "size", "rounded"];

export const PROHIBICIONES = [
  "style inline en botones",
  "clases de color en botones (text-*, bg-*, border-*, surface-*)",
  "tokens {surface.N} directos en vistas",
  'props legadas text/outlined/link (usar variant="text"/"outlined")',
  'severity="primary" explícita (primary ya es el default)',
  "title genérico que no describa la acción (p. ej. Quitar en algo que no quita)",
];

export function intencionPorSlug(slug) {
  return ESTANDAR.find((i) => i.slug === slug) || null;
}

export function markupDe(props) {
  const partes = Object.entries(props).map(([k, v]) =>
    v === true ? k : `${k}="${v}"`,
  );
  return `<Button ${partes.join(" ")} />`;
}
