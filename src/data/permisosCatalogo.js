// Catálogo real de permisos del backend (tabla `permisos`, migraciones V2→V72).
// Nombres/descripciones copiados de los seeds del backend. `MODULOS` es agrupación
// solo de frontend (el backend no entrega `modulo` en `GET /admin/permisos/catalogo`;
// se enriquece en `useCargoPermisos.js` con este mapa). Al agregar un permiso nuevo
// en backend (ej. V62 SECTOR_*, V66 PISO_*, V67 IMPORTACION_DATOS, V72 EMAIL_CONFIG_*),
// actualizar este archivo para que `MisPermisos` y `CargosPermisos` agrupen bien y no caiga
// en “Permisos sin catalogar”. A futuro, si el backend añade `modulo` al DTO, este mapa
// puede hidratarse desde la API.

export const MODULOS = [
  { codigo: "GESTION", nombre: "Gestión" },
  { codigo: "ACCESOS", nombre: "Accesos y Seguridad" },
  { codigo: "CASOS", nombre: "Casos" },
  { codigo: "RESERVAS", nombre: "Reservas" },
  { codigo: "FINANZAS", nombre: "Finanzas" },
  { codigo: "COMUNICACION", nombre: "Comunicación" },
  { codigo: "BITACORA", nombre: "Bitácora" },
  { codigo: "ALMACENAMIENTO", nombre: "Archivos" },
  { codigo: "DASHBOARDS", nombre: "Dashboards" },
  { codigo: "SAAS", nombre: "SaaS" },
];

export const PERMISOS = [
  // ── GESTIÓN ──
  { codigo: "PERSONA_VER", nombre: "Ver personas", modulo: "GESTION", descripcion: "Consultar listado y detalle de personas registradas." },
  { codigo: "PERSONA_CREAR", nombre: "Crear personas", modulo: "GESTION", descripcion: "Registrar nuevas personas en el sistema." },
  { codigo: "PERSONA_EDITAR", nombre: "Editar personas", modulo: "GESTION", descripcion: "Modificar datos de personas existentes." },
  { codigo: "PERSONA_ELIMINAR", nombre: "Eliminar personas", modulo: "GESTION", descripcion: "Desactivar personas del sistema (soft delete)." },
  { codigo: "UNIDAD_VER", nombre: "Ver unidades", modulo: "GESTION", descripcion: "Consultar unidades del condominio." },
  { codigo: "UNIDAD_CREAR", nombre: "Crear unidades", modulo: "GESTION", descripcion: "Registrar nuevas unidades en el condominio." },
  { codigo: "UNIDAD_EDITAR", nombre: "Editar unidades", modulo: "GESTION", descripcion: "Modificar datos de unidades existentes." },
  { codigo: "UNIDAD_ELIMINAR", nombre: "Eliminar unidades", modulo: "GESTION", descripcion: "Desactivar unidades del condominio (soft delete)." },
  { codigo: "VINCULO_VER", nombre: "Ver vínculos", modulo: "GESTION", descripcion: "Consultar vínculos entre personas y unidades." },
  { codigo: "VINCULO_CREAR", nombre: "Crear vínculos", modulo: "GESTION", descripcion: "Registrar nuevos vínculos persona-unidad." },
  { codigo: "VINCULO_EDITAR", nombre: "Editar vínculos", modulo: "GESTION", descripcion: "Modificar vínculos existentes." },
  { codigo: "VINCULO_ELIMINAR", nombre: "Eliminar vínculos", modulo: "GESTION", descripcion: "Desactivar vínculos persona-unidad (soft delete)." },
  { codigo: "VEHICULO_VER", nombre: "Ver vehículos", modulo: "GESTION", descripcion: "Consultar vehículos registrados en el condominio." },
  { codigo: "VEHICULO_CREAR", nombre: "Crear vehículos", modulo: "GESTION", descripcion: "Registrar nuevos vehículos." },
  { codigo: "VEHICULO_EDITAR", nombre: "Editar vehículos", modulo: "GESTION", descripcion: "Modificar datos de vehículos existentes." },
  { codigo: "VEHICULO_ELIMINAR", nombre: "Eliminar vehículos", modulo: "GESTION", descripcion: "Desactivar vehículos del sistema (soft delete)." },
  { codigo: "CONDOMINIO_VER", nombre: "Ver condominio", modulo: "GESTION", descripcion: "Consultar datos del condominio." },
  { codigo: "CONDOMINIO_EDITAR", nombre: "Editar condominio", modulo: "GESTION", descripcion: "Modificar datos del condominio." },
  { codigo: "USUARIO_GESTIONAR", nombre: "Gestionar usuarios", modulo: "GESTION", descripcion: "Crear, editar y desactivar usuarios del sistema." },
  { codigo: "ROL_GESTIONAR", nombre: "Gestionar roles", modulo: "GESTION", descripcion: "Asignar y revocar roles a usuarios." },
  { codigo: "SECTOR_VER", nombre: "Ver sectores", modulo: "GESTION", descripcion: "Consultar sectores del condominio." },
  { codigo: "SECTOR_CREAR", nombre: "Crear sectores", modulo: "GESTION", descripcion: "Registrar nuevos sectores en el condominio." },
  { codigo: "SECTOR_EDITAR", nombre: "Editar sectores", modulo: "GESTION", descripcion: "Modificar datos de sectores existentes." },
  { codigo: "SECTOR_ELIMINAR", nombre: "Eliminar sectores", modulo: "GESTION", descripcion: "Desactivar sectores del condominio (soft delete)." },
  { codigo: "PISO_VER", nombre: "Ver pisos", modulo: "GESTION", descripcion: "Consultar pisos del condominio." },
  { codigo: "PISO_CREAR", nombre: "Crear pisos", modulo: "GESTION", descripcion: "Registrar nuevos pisos en el condominio." },
  { codigo: "PISO_EDITAR", nombre: "Editar pisos", modulo: "GESTION", descripcion: "Modificar datos de pisos existentes." },
  { codigo: "PISO_ELIMINAR", nombre: "Eliminar pisos", modulo: "GESTION", descripcion: "Desactivar pisos del condominio (soft delete)." },
  { codigo: "IMPORTACION_DATOS", nombre: "Importar datos", modulo: "GESTION", descripcion: "Cargar la planilla de integrantes del condominio (preview/ejecutar/plantilla)." },
  // ── ACCESOS Y SEGURIDAD ──
  { codigo: "ACCESO_VER", nombre: "Ver accesos", modulo: "ACCESOS", descripcion: "Consultar registros de ingreso y salida." },
  { codigo: "ACCESO_REGISTRAR_INGRESO", nombre: "Registrar ingreso", modulo: "ACCESOS", descripcion: "Registrar el ingreso de un visitante al condominio." },
  { codigo: "ACCESO_REGISTRAR_SALIDA", nombre: "Registrar salida", modulo: "ACCESOS", descripcion: "Registrar la salida de un visitante del condominio." },
  { codigo: "AUTORIZACION_VER", nombre: "Ver autorizaciones", modulo: "ACCESOS", descripcion: "Consultar preautorizaciones de visitas." },
  { codigo: "AUTORIZACION_CREAR", nombre: "Crear autorizaciones", modulo: "ACCESOS", descripcion: "Registrar preautorizaciones de visitas." },
  { codigo: "AUTORIZACION_CANCELAR", nombre: "Cancelar autorizaciones", modulo: "ACCESOS", descripcion: "Cancelar preautorizaciones vigentes." },
  { codigo: "ENCOMIENDA_VER", nombre: "Ver encomiendas", modulo: "ACCESOS", descripcion: "Consultar encomiendas del condominio." },
  { codigo: "ENCOMIENDA_CREAR", nombre: "Registrar encomienda", modulo: "ACCESOS", descripcion: "Registrar la recepción de una encomienda." },
  { codigo: "ENCOMIENDA_ENTREGAR", nombre: "Entregar encomienda", modulo: "ACCESOS", descripcion: "Registrar la entrega de una encomienda al residente." },
  { codigo: "ENCOMIENDA_CONFIGURAR", nombre: "Configurar encomiendas", modulo: "ACCESOS", descripcion: "Gestionar accesos del condominio para recepción de encomiendas." },
  // ── CASOS ──
  { codigo: "CASO_VER", nombre: "Ver casos", modulo: "CASOS", descripcion: "Consultar casos del condominio." },
  { codigo: "CASO_CREAR", nombre: "Crear casos", modulo: "CASOS", descripcion: "Registrar nuevos casos." },
  { codigo: "CASO_GESTIONAR", nombre: "Gestionar casos", modulo: "CASOS", descripcion: "Cambiar estado de casos y asignar responsables." },
  // ── RESERVAS ──
  { codigo: "RESERVA_VER", nombre: "Ver reservas", modulo: "RESERVAS", descripcion: "Consultar reservas de espacios comunes." },
  { codigo: "RESERVA_CREAR", nombre: "Crear reservas", modulo: "RESERVAS", descripcion: "Registrar nuevas reservas." },
  { codigo: "RESERVA_CANCELAR", nombre: "Cancelar reservas", modulo: "RESERVAS", descripcion: "Cancelar reservas existentes." },
  // ── FINANZAS ──
  { codigo: "FINANZA_VER", nombre: "Ver finanzas", modulo: "FINANZAS", descripcion: "Consultar movimientos, cobros y estado de cuentas." },
  { codigo: "FINANZA_GESTIONAR", nombre: "Gestionar finanzas", modulo: "FINANZAS", descripcion: "Registrar cobros, pagos, egresos e ingresos." },
  { codigo: "CUENTA_VER", nombre: "Ver cuentas financieras", modulo: "FINANZAS", descripcion: "Consultar cuentas bancarias y de caja del condominio." },
  { codigo: "CUENTA_GESTIONAR", nombre: "Gestionar cuentas financieras", modulo: "FINANZAS", descripcion: "Crear y editar cuentas financieras del condominio." },
  { codigo: "CATEGORIA_VER", nombre: "Ver categorías de movimiento", modulo: "FINANZAS", descripcion: "Consultar categorías de ingresos y egresos." },
  { codigo: "CATEGORIA_GESTIONAR", nombre: "Gestionar categorías", modulo: "FINANZAS", descripcion: "Crear y editar categorías de movimiento." },
  { codigo: "LEDGER_VER", nombre: "Ver libro mayor", modulo: "FINANZAS", descripcion: "Consultar el historial de transacciones del ledger." },
  { codigo: "REVERSO", nombre: "Reversar movimientos", modulo: "FINANZAS", descripcion: "Reversar movimientos financieros (genera asiento inverso en el ledger)." },
  { codigo: "PAGO_RESIDENTE_VER", nombre: "Ver pagos de residentes", modulo: "FINANZAS", descripcion: "Consultar pagos registrados de los residentes." },
  { codigo: "PAGO_RESIDENTE_CREAR", nombre: "Registrar pago de residente", modulo: "FINANZAS", descripcion: "Registrar un pago recibido de un residente." },
  { codigo: "GASTO_VER", nombre: "Ver gastos", modulo: "FINANZAS", descripcion: "Consultar egresos y gastos del condominio." },
  { codigo: "GASTO_CREAR", nombre: "Registrar gasto", modulo: "FINANZAS", descripcion: "Registrar un egreso o gasto del condominio." },
  { codigo: "GASTO_ANULAR", nombre: "Anular gasto", modulo: "FINANZAS", descripcion: "Anular un gasto registrado (genera reverso en ledger)." },
  { codigo: "PLANTILLA_GASTO_VER", nombre: "Ver plantillas de gasto", modulo: "FINANZAS", descripcion: "Consultar plantillas de gastos frecuentes." },
  { codigo: "PLANTILLA_GASTO_GESTIONAR", nombre: "Gestionar plantillas de gasto", modulo: "FINANZAS", descripcion: "Crear y editar plantillas de gastos frecuentes." },
  { codigo: "CARGO_ADICIONAL_VER", nombre: "Ver cargos adicionales", modulo: "FINANZAS", descripcion: "Consultar multas y cargos extraordinarios." },
  { codigo: "CARGO_ADICIONAL_GESTIONAR", nombre: "Gestionar cargos adicionales", modulo: "FINANZAS", descripcion: "Crear, editar y anular cargos adicionales." },
  { codigo: "MANTENCION_VER", nombre: "Ver mantenciones", modulo: "FINANZAS", descripcion: "Consultar mantenciones del condominio." },
  { codigo: "MANTENCION_GESTIONAR", nombre: "Gestionar mantenciones", modulo: "FINANZAS", descripcion: "Crear y actualizar estado de mantenciones." },
  { codigo: "MIS_DEUDAS_VER", nombre: "Ver mis deudas", modulo: "FINANZAS", descripcion: "Consultar sus propias cuotas de gasto común y cargos pendientes." },
  // ── COMUNICACIÓN ──
  { codigo: "NOTIFICACION_VER", nombre: "Ver notificaciones", modulo: "COMUNICACION", descripcion: "Consultar notificaciones del sistema." },
  { codigo: "NOTIFICACION_ENVIAR", nombre: "Enviar notificaciones", modulo: "COMUNICACION", descripcion: "Enviar notificaciones manuales a residentes." },
  { codigo: "PLANTILLA_NOTIF_VER", nombre: "Ver plantillas notif.", modulo: "COMUNICACION", descripcion: "Consultar plantillas de notificación." },
  { codigo: "PLANTILLA_NOTIF_GESTIONAR", nombre: "Gestionar plantillas notif.", modulo: "COMUNICACION", descripcion: "Crear y editar plantillas de notificación." },
  { codigo: "REGLA_NOTIF_VER", nombre: "Ver reglas notif.", modulo: "COMUNICACION", descripcion: "Consultar reglas de notificación del condominio." },
  { codigo: "REGLA_NOTIF_GESTIONAR", nombre: "Gestionar reglas notif.", modulo: "COMUNICACION", descripcion: "Configurar reglas de notificación por tipo de evento." },
  { codigo: "MENSAJE_GLOBAL_ENVIAR", nombre: "Enviar mensajes globales", modulo: "COMUNICACION", descripcion: "Enviar notificaciones a todos los condominios. Solo SUPER_ADMIN." },
  { codigo: "EMAIL_CONFIG_VER", nombre: "Ver config email", modulo: "COMUNICACION", descripcion: "Consultar configuración SMTP y routing email del condominio." },
  { codigo: "EMAIL_CONFIG_EDITAR", nombre: "Editar config email", modulo: "COMUNICACION", descripcion: "Crear, actualizar, eliminar y testear configuración SMTP y routing email del condominio." },
  // ── BITÁCORA ──
  { codigo: "BITACORA_VER", nombre: "Ver bitácora", modulo: "BITACORA", descripcion: "Consultar eventos de turno, colación y novedades." },
  { codigo: "BITACORA_REGISTRAR", nombre: "Registrar bitácora", modulo: "BITACORA", descripcion: "Registrar eventos propios de turno, colación y novedades." },
  { codigo: "BITACORA_GESTIONAR", nombre: "Gestionar bitácora", modulo: "BITACORA", descripcion: "Configurar checklists de bitácora por tipo de evento." },
  // ── ARCHIVOS ──
  { codigo: "ARCHIVO_VER", nombre: "Ver archivos", modulo: "ALMACENAMIENTO", descripcion: "Listar y descargar archivos del condominio." },
  { codigo: "ARCHIVO_SUBIR", nombre: "Subir archivos", modulo: "ALMACENAMIENTO", descripcion: "Subir nuevos archivos al condominio." },
  { codigo: "ARCHIVO_ELIMINAR", nombre: "Eliminar archivos", modulo: "ALMACENAMIENTO", descripcion: "Eliminar archivos del condominio." },
  { codigo: "ALMACENAMIENTO_CONFIGURAR", nombre: "Configurar almacenamiento", modulo: "ALMACENAMIENTO", descripcion: "Configurar el proveedor de almacenamiento del condominio." },
  // ── DASHBOARDS ──
  { codigo: "DASHBOARD_ADMIN", nombre: "Dashboard administración", modulo: "DASHBOARDS", descripcion: "Acceso al dashboard de administración del condominio." },
  { codigo: "DASHBOARD_GUARDIA", nombre: "Dashboard portería", modulo: "DASHBOARDS", descripcion: "Acceso al dashboard operativo de portería." },
  { codigo: "DASHBOARD_RESIDENTE", nombre: "Dashboard residente", modulo: "DASHBOARDS", descripcion: "Acceso al dashboard personal del residente." },
  { codigo: "DASHBOARD_FINANZAS", nombre: "Dashboard finanzas", modulo: "DASHBOARDS", descripcion: "Acceso al dashboard financiero del condominio." },
  { codigo: "DASHBOARD_TESORERO", nombre: "Dashboard tesorero", modulo: "DASHBOARDS", descripcion: "Acceso al dashboard financiero detallado con saldos y movimientos." },
  // ── SAAS ──
  { codigo: "METRICAS_VER", nombre: "Ver métricas SaaS", modulo: "SAAS", descripcion: "Acceso al dashboard de métricas globales del SaaS." },
  { codigo: "SUSCRIPCION_VER", nombre: "Ver suscripciones", modulo: "SAAS", descripcion: "Consultar planes y suscripciones de condominios." },
  { codigo: "SUSCRIPCION_GESTIONAR", nombre: "Gestionar suscripciones", modulo: "SAAS", descripcion: "Cambiar plan, registrar pagos, suspender y reactivar condominios." },
  { codigo: "PLAN_GESTIONAR", nombre: "Gestionar planes", modulo: "SAAS", descripcion: "Crear, editar y desactivar planes de suscripción. Solo SUPER_ADMIN." },
  { codigo: "ONBOARDING_GESTIONAR", nombre: "Gestionar onboarding", modulo: "SAAS", descripcion: "Administrar y completar tareas de onboarding de condominios." },
  { codigo: "AUDITORIA_VER", nombre: "Ver auditoría SaaS", modulo: "SAAS", descripcion: "Consultar el registro de auditoría empresarial." },
  { codigo: "CONDOMINIO_CREAR", nombre: "Crear condominios", modulo: "SAAS", descripcion: "Crear nuevos condominios en la plataforma SaaS." },
  { codigo: "CONDOMINIO_ELIMINAR", nombre: "Eliminar condominios", modulo: "SAAS", descripcion: "Desactivar condominios. Solo SUPER_ADMIN." },
  { codigo: "MODULO_GESTIONAR", nombre: "Gestionar módulos", modulo: "SAAS", descripcion: "Habilitar y deshabilitar módulos (feature flags) por condominio." },
  { codigo: "IMPERSONAR_USUARIO", nombre: "Impersonar usuario", modulo: "SAAS", descripcion: "Actuar en nombre de un usuario del sistema." },
];

export function permisosPorModulo(modulo) {
  return PERMISOS.filter((p) => p.modulo === modulo);
}
