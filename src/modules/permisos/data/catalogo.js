// Re-export del catálogo real — single source para el módulo BFF.
// Cuando exista GET /admin/permisos/catalogo, este archivo hidratará desde API.
export { PERMISOS, MODULOS, permisosPorModulo } from "@/data/permisosCatalogo";
