export const MODULOS = [
  { codigo: "GESTION", nombre: "Gestión" },
  { codigo: "FINANZAS", nombre: "Finanzas" },
  { codigo: "SEGURIDAD", nombre: "Seguridad" },
  { codigo: "COMUNICACION", nombre: "Comunicación" },
  { codigo: "BITACORA", nombre: "Bitácora" },
  { codigo: "ARCHIVO", nombre: "Archivos" },
  { codigo: "SAAS", nombre: "SaaS" },
  { codigo: "SISTEMA", nombre: "Sistema" },
];

export const PERMISOS = [
  // ── GESTIÓN ──
  { codigo: "UNIDAD_VER", nombre: "Ver unidades", modulo: "GESTION", descripcion: "Visualizar lista de unidades" },
  { codigo: "UNIDAD_CREAR", nombre: "Crear unidades", modulo: "GESTION", descripcion: "Crear nuevas unidades" },
  { codigo: "UNIDAD_EDITAR", nombre: "Editar unidades", modulo: "GESTION", descripcion: "Modificar datos de unidades" },
  { codigo: "UNIDAD_ELIMINAR", nombre: "Eliminar unidades", modulo: "GESTION", descripcion: "Eliminar unidades" },
  { codigo: "PERSONA_VER", nombre: "Ver personas", modulo: "GESTION", descripcion: "Visualizar personas del condominio" },
  { codigo: "PERSONA_CREAR", nombre: "Crear personas", modulo: "GESTION", descripcion: "Registrar nuevas personas" },
  { codigo: "PERSONA_EDITAR", nombre: "Editar personas", modulo: "GESTION", descripcion: "Modificar datos de personas" },
  { codigo: "PERSONA_ELIMINAR", nombre: "Eliminar personas", modulo: "GESTION", descripcion: "Desactivar personas" },
  { codigo: "VINCULO_VER", nombre: "Ver vínculos", modulo: "GESTION", descripcion: "Ver relaciones persona-unidad" },
  { codigo: "VINCULO_CREAR", nombre: "Crear vínculos", modulo: "GESTION", descripcion: "Asignar personas a unidades" },
  { codigo: "VINCULO_ELIMINAR", nombre: "Eliminar vínculos", modulo: "GESTION", descripcion: "Desactivar vínculos" },
  { codigo: "VEHICULO_VER", nombre: "Ver vehículos", modulo: "GESTION", descripcion: "Visualizar vehículos" },
  { codigo: "VEHICULO_CREAR", nombre: "Crear vehículos", modulo: "GESTION", descripcion: "Registrar vehículos" },
  { codigo: "VEHICULO_ELIMINAR", nombre: "Eliminar vehículos", modulo: "GESTION", descripcion: "Eliminar vehículos" },
  { codigo: "CARGO_VER", nombre: "Ver cargos", modulo: "GESTION", descripcion: "Visualizar miembros del comité" },
  { codigo: "CARGO_ASIGNAR", nombre: "Asignar cargos", modulo: "GESTION", descripcion: "Asignar cargos organizacionales" },
  { codigo: "USUARIO_GESTIONAR", nombre: "Gestionar usuarios", modulo: "GESTION", descripcion: "Crear/activar/desactivar cuentas" },
  // ── FINANZAS ──
  { codigo: "FINANZAS_VER", nombre: "Ver finanzas", modulo: "FINANZAS", descripcion: "Ver dashboard financiero" },
  { codigo: "CUENTA_VER", nombre: "Ver cuentas", modulo: "FINANZAS", descripcion: "Visualizar cuentas financieras" },
  { codigo: "CUENTA_GESTIONAR", nombre: "Gestionar cuentas", modulo: "FINANZAS", descripcion: "Crear/editar cuentas" },
  { codigo: "CATEGORIA_VER", nombre: "Ver categorías", modulo: "FINANZAS", descripcion: "Ver categorías de movimiento" },
  { codigo: "CATEGORIA_GESTIONAR", nombre: "Gestionar categorías", modulo: "FINANZAS", descripcion: "Crear/editar categorías" },
  { codigo: "GASTO_VER", nombre: "Ver gastos", modulo: "FINANZAS", descripcion: "Visualizar gastos" },
  { codigo: "GASTO_CREAR", nombre: "Crear gastos", modulo: "FINANZAS", descripcion: "Registrar gastos" },
  { codigo: "GASTO_EDITAR", nombre: "Editar gastos", modulo: "FINANZAS", descripcion: "Modificar gastos" },
  { codigo: "GASTO_ELIMINAR", nombre: "Eliminar gastos", modulo: "FINANZAS", descripcion: "Eliminar gastos" },
  { codigo: "GASTO_GESTIONAR", nombre: "Gestionar gastos", modulo: "FINANZAS", descripcion: "Full CRUD gastos" },
  { codigo: "PLANTILLA_GASTO_VER", nombre: "Ver plantillas gasto", modulo: "FINANZAS", descripcion: "Ver plantillas predefinidas" },
  { codigo: "PLANTILLA_GASTO_GESTIONAR", nombre: "Gestionar plantillas gasto", modulo: "FINANZAS", descripcion: "CRUD plantillas" },
  { codigo: "PAGO_VER", nombre: "Ver pagos", modulo: "FINANZAS", descripcion: "Visualizar pagos recibidos" },
  { codigo: "PAGO_REGISTRAR", nombre: "Registrar pagos", modulo: "FINANZAS", descripcion: "Registrar pagos de residentes" },
  { codigo: "LEDGER_VER", nombre: "Ver ledger", modulo: "FINANZAS", descripcion: "Visualizar libro contable" },
  { codigo: "GASTO_COMUN_GENERAR", nombre: "Generar gastos comunes", modulo: "FINANZAS", descripcion: "Generar periodos de GC" },
  { codigo: "CARGO_ADICIONAL_GESTIONAR", nombre: "Gestionar cargos adicionales", modulo: "FINANZAS", descripcion: "Crear multas y cargos" },
  { codigo: "MIS_DEUDAS_VER", nombre: "Ver mis deudas", modulo: "FINANZAS", descripcion: "Residente ve su deuda" },
  // ── SEGURIDAD ──
  { codigo: "ENCOMIENDA_VER", nombre: "Ver encomiendas", modulo: "SEGURIDAD", descripcion: "Visualizar encomiendas" },
  { codigo: "ENCOMIENDA_REGISTRAR", nombre: "Registrar encomiendas", modulo: "SEGURIDAD", descripcion: "Registrar nueva encomienda" },
  { codigo: "ENCOMIENDA_ENTREGAR", nombre: "Entregar encomiendas", modulo: "SEGURIDAD", descripcion: "Registrar entrega" },
  { codigo: "ACCESO_VER", nombre: "Ver accesos", modulo: "SEGURIDAD", descripcion: "Visualizar registro de accesos" },
  { codigo: "ACCESO_REGISTRAR", nombre: "Registrar accesos", modulo: "SEGURIDAD", descripcion: "Registrar ingreso/salida" },
  { codigo: "AUTORIZACION_VER", nombre: "Ver autorizaciones", modulo: "SEGURIDAD", descripcion: "Ver pre-autorizaciones" },
  { codigo: "AUTORIZACION_CREAR", nombre: "Crear autorizaciones", modulo: "SEGURIDAD", descripcion: "Pre-autorizar visitas" },
  { codigo: "AUTORIZACION_GESTIONAR", nombre: "Gestionar autorizaciones", modulo: "SEGURIDAD", descripcion: "Modificar/revocar autorizaciones" },
  // ── COMUNICACIÓN ──
  { codigo: "ANUNCIO_VER", nombre: "Ver anuncios", modulo: "COMUNICACION", descripcion: "Visualizar anuncios" },
  { codigo: "ANUNCIO_CREAR", nombre: "Crear anuncios", modulo: "COMUNICACION", descripcion: "Publicar anuncios" },
  { codigo: "NOTIFICACION_GESTIONAR", nombre: "Gestionar notificaciones", modulo: "COMUNICACION", descripcion: "Enviar notificaciones masivas" },
  { codigo: "PLANTILLA_NOTIF_VER", nombre: "Ver plantillas notif.", modulo: "COMUNICACION", descripcion: "Ver plantillas de notificación" },
  { codigo: "PLANTILLA_NOTIF_GESTIONAR", nombre: "Gestionar plantillas notif.", modulo: "COMUNICACION", descripcion: "CRUD plantillas" },
  // ── BITÁCORA ──
  { codigo: "BITACORA_VER", nombre: "Ver bitácora", modulo: "BITACORA", descripcion: "Visualizar entradas de bitácora" },
  { codigo: "BITACORA_CREAR", nombre: "Crear bitácora", modulo: "BITACORA", descripcion: "Registrar eventos" },
  { codigo: "BITACORA_GESTIONAR", nombre: "Gestionar bitácora", modulo: "BITACORA", descripcion: "Editar/eliminar entradas" },
  { codigo: "CHECKLIST_GESTIONAR", nombre: "Gestionar checklist", modulo: "BITACORA", descripcion: "CRUD templates checklist" },
  // ── ARCHIVOS ──
  { codigo: "ARCHIVO_VER", nombre: "Ver archivos", modulo: "ARCHIVO", descripcion: "Listar/descargar archivos" },
  { codigo: "ARCHIVO_SUBIR", nombre: "Subir archivos", modulo: "ARCHIVO", descripcion: "Subir nuevos archivos" },
  { codigo: "ARCHIVO_ELIMINAR", nombre: "Eliminar archivos", modulo: "ARCHIVO", descripcion: "Eliminar archivos" },
  // ── SAAS ──
  { codigo: "SAAS_CONDOMINIO_VER", nombre: "Ver condominios", modulo: "SAAS", descripcion: "Listar condominios del SaaS" },
  { codigo: "SAAS_CONDOMINIO_GESTIONAR", nombre: "Gestionar condominios", modulo: "SAAS", descripcion: "Crear/editar condominios" },
  { codigo: "SAAS_SUSCRIPCION_VER", nombre: "Ver suscripciones", modulo: "SAAS", descripcion: "Ver planes y suscripciones" },
  { codigo: "SAAS_SUSCRIPCION_GESTIONAR", nombre: "Gestionar suscripciones", modulo: "SAAS", descripcion: "Cambiar plan, gestionar pagos" },
  { codigo: "SAAS_USUARIO_GESTIONAR", nombre: "Gestionar usuarios SaaS", modulo: "SAAS", descripcion: "Admin de usuarios del sistema" },
  { codigo: "SAAS_MODULO_GESTIONAR", nombre: "Gestionar módulos", modulo: "SAAS", descripcion: "Habilitar/deshabilitar módulos" },
  { codigo: "SAAS_AUDITORIA_VER", nombre: "Ver auditoría", modulo: "SAAS", descripcion: "Visualizar log de auditoría" },
  { codigo: "SAAS_PLAN_GESTIONAR", nombre: "Gestionar planes", modulo: "SAAS", descripcion: "CRUD de planes de suscripción" },
  { codigo: "SAAS_ONBOARDING_GESTIONAR", nombre: "Gestionar onboarding", modulo: "SAAS", descripcion: "Administrar tareas de onboarding" },
  // ── SISTEMA ──
  { codigo: "ROL_VER", nombre: "Ver roles", modulo: "SISTEMA", descripcion: "Visualizar roles del sistema" },
  { codigo: "ROL_GESTIONAR", nombre: "Gestionar roles", modulo: "SISTEMA", descripcion: "Asignar permisos a roles" },
  { codigo: "PERMISO_VER", nombre: "Ver permisos", modulo: "SISTEMA", descripcion: "Visualizar matriz de permisos" },
  { codigo: "SISTEMA_CONFIGURAR", nombre: "Configurar sistema", modulo: "SISTEMA", descripcion: "Ajustes globales del sistema" },
];

export const ROLES = [
  {
    codigo: "SUPER_ADMIN",
    nombre: "Super Administrador",
    descripcion: "Acceso total al sistema SaaS",
    permisos: [
      "UNIDAD_VER", "PERSONA_VER", "VINCULO_VER", "VEHICULO_VER",
      "FINANZAS_VER", "GASTO_VER", "PAGO_VER", "LEDGER_VER",
      "ENCOMIENDA_VER", "ACCESO_VER", "AUTORIZACION_VER",
      "ANUNCIO_VER", "BITACORA_VER",
      "ARCHIVO_VER", "ARCHIVO_SUBIR", "ARCHIVO_ELIMINAR",
      "SAAS_CONDOMINIO_VER", "SAAS_CONDOMINIO_GESTIONAR",
      "SAAS_SUSCRIPCION_VER", "SAAS_SUSCRIPCION_GESTIONAR",
      "SAAS_USUARIO_GESTIONAR", "SAAS_MODULO_GESTIONAR",
      "SAAS_AUDITORIA_VER", "SAAS_PLAN_GESTIONAR", "SAAS_ONBOARDING_GESTIONAR",
      "ROL_VER", "ROL_GESTIONAR", "PERMISO_VER", "SISTEMA_CONFIGURAR",
    ],
  },
  {
    codigo: "SOPORTE",
    nombre: "Soporte",
    descripcion: "Soporte técnico del SaaS",
    permisos: [
      "SAAS_CONDOMINIO_VER", "SAAS_AUDITORIA_VER",
      "SAAS_CONDOMINIO_GESTIONAR",
      "SAAS_USUARIO_GESTIONAR", "SAAS_ONBOARDING_GESTIONAR",
      "ROL_VER", "PERMISO_VER",
    ],
  },
  {
    codigo: "ADMINISTRADOR",
    nombre: "Administrador",
    descripcion: "Administrador de condominio",
    permisos: [
      "UNIDAD_VER", "UNIDAD_CREAR", "UNIDAD_EDITAR",
      "PERSONA_VER", "PERSONA_CREAR", "PERSONA_EDITAR", "PERSONA_ELIMINAR",
      "VINCULO_VER", "VINCULO_CREAR", "VINCULO_ELIMINAR",
      "VEHICULO_VER", "VEHICULO_CREAR", "VEHICULO_ELIMINAR",
      "CARGO_VER", "CARGO_ASIGNAR", "USUARIO_GESTIONAR",
      "ENCOMIENDA_VER", "ENCOMIENDA_REGISTRAR", "ENCOMIENDA_ENTREGAR",
      "ACCESO_VER", "AUTORIZACION_VER",
      "ANUNCIO_VER", "ANUNCIO_CREAR",
      "NOTIFICACION_GESTIONAR", "PLANTILLA_NOTIF_VER", "PLANTILLA_NOTIF_GESTIONAR",
      "BITACORA_VER", "CHECKLIST_GESTIONAR",
      "ARCHIVO_VER", "ARCHIVO_SUBIR", "ARCHIVO_ELIMINAR",
    ],
  },
  {
    codigo: "GUARDIA",
    nombre: "Guardia",
    descripcion: "Personal de seguridad y recepción",
    permisos: [
      "ENCOMIENDA_VER", "ENCOMIENDA_REGISTRAR", "ENCOMIENDA_ENTREGAR",
      "ACCESO_VER", "ACCESO_REGISTRAR",
      "AUTORIZACION_VER",
      "BITACORA_VER", "BITACORA_CREAR",
      "CHECKLIST_GESTIONAR",
      "VEHICULO_VER",
    ],
  },
  {
    codigo: "RESIDENTE",
    nombre: "Residente",
    descripcion: "Residente del condominio",
    permisos: [
      "MIS_DEUDAS_VER",
      "ENCOMIENDA_VER",
      "AUTORIZACION_VER", "AUTORIZACION_CREAR",
      "ANUNCIO_VER",
    ],
  },
];

export const CARGOS = [
  {
    codigo: "PRESIDENTE",
    nombre: "Presidente",
    descripcion: "Presidente del comité de administración",
    permisos: [
      "FINANZAS_VER", "CUENTA_VER", "CUENTA_GESTIONAR",
      "CATEGORIA_VER", "CATEGORIA_GESTIONAR",
      "GASTO_VER", "GASTO_CREAR", "GASTO_EDITAR", "GASTO_ELIMINAR", "GASTO_GESTIONAR",
      "PLANTILLA_GASTO_VER", "PLANTILLA_GASTO_GESTIONAR",
      "PAGO_VER", "PAGO_REGISTRAR", "LEDGER_VER",
      "GASTO_COMUN_GENERAR", "CARGO_ADICIONAL_GESTIONAR",
      "UNIDAD_VER", "UNIDAD_CREAR", "UNIDAD_EDITAR",
      "PERSONA_VER", "PERSONA_CREAR", "PERSONA_EDITAR",
      "VINCULO_VER", "VINCULO_CREAR",
      "VEHICULO_VER", "VEHICULO_CREAR",
      "CARGO_VER",
      "ENCOMIENDA_VER", "ACCESO_VER", "AUTORIZACION_VER", "AUTORIZACION_CREAR",
      "ANUNCIO_VER", "ANUNCIO_CREAR",
      "NOTIFICACION_GESTIONAR", "PLANTILLA_NOTIF_VER",
      "BITACORA_VER", "CHECKLIST_GESTIONAR",
      "ARCHIVO_VER", "ARCHIVO_SUBIR", "ARCHIVO_ELIMINAR",
    ],
  },
  {
    codigo: "TESORERO",
    nombre: "Tesorero",
    descripcion: "Tesorero del comité",
    permisos: [
      "FINANZAS_VER", "CUENTA_VER", "CATEGORIA_VER",
      "GASTO_VER", "GASTO_CREAR", "GASTO_EDITAR", "GASTO_GESTIONAR",
      "PLANTILLA_GASTO_VER", "PLANTILLA_GASTO_GESTIONAR",
      "PAGO_VER", "PAGO_REGISTRAR", "LEDGER_VER",
      "GASTO_COMUN_GENERAR", "CARGO_ADICIONAL_GESTIONAR",
      "MIS_DEUDAS_VER",
      "ARCHIVO_VER", "ARCHIVO_SUBIR",
    ],
  },
  {
    codigo: "SECRETARIO",
    nombre: "Secretario",
    descripcion: "Secretario del comité",
    permisos: [
      "UNIDAD_VER", "PERSONA_VER", "PERSONA_CREAR", "PERSONA_EDITAR",
      "VINCULO_VER", "VINCULO_CREAR",
      "CARGO_VER", "CARGO_ADICIONAL_GESTIONAR",
      "ENCOMIENDA_VER", "ACCESO_VER", "AUTORIZACION_VER",
      "ANUNCIO_VER", "ANUNCIO_CREAR",
      "BITACORA_VER",
      "ARCHIVO_VER", "ARCHIVO_SUBIR",
    ],
  },
  {
    codigo: "DELEGADO",
    nombre: "Delegado",
    descripcion: "Delegado del comité",
    permisos: [
      "ENCOMIENDA_VER", "BITACORA_VER",
    ],
  },
  {
    codigo: "CONSERJE",
    nombre: "Conserje",
    descripcion: "Conserje del condominio",
    permisos: [
      "ENCOMIENDA_VER", "ENCOMIENDA_REGISTRAR", "ENCOMIENDA_ENTREGAR",
      "ACCESO_VER", "ACCESO_REGISTRAR",
      "AUTORIZACION_VER",
    ],
  },
  {
    codigo: "GUARDIA",
    nombre: "Guardia (cargo)",
    descripcion: "Guardia de seguridad",
    permisos: [
      "ENCOMIENDA_VER", "ENCOMIENDA_REGISTRAR", "ENCOMIENDA_ENTREGAR",
      "ACCESO_VER", "ACCESO_REGISTRAR",
      "AUTORIZACION_VER",
      "BITACORA_VER", "BITACORA_CREAR",
      "CHECKLIST_GESTIONAR",
      "VEHICULO_VER",
    ],
  },
  {
    codigo: "MANTENCION",
    nombre: "Mantención",
    descripcion: "Personal de mantenimiento",
    permisos: [
      "BITACORA_VER",
    ],
  },
  {
    codigo: "JARDINERO",
    nombre: "Jardinero",
    descripcion: "Personal de jardinería",
    permisos: [
      "BITACORA_VER",
    ],
  },
];

export function permisosPorModulo(modulo) {
  return PERMISOS.filter((p) => p.modulo === modulo);
}

export function permisosPorRol(codigoRol) {
  const rol = ROLES.find((r) => r.codigo === codigoRol);
  return rol ? rol.permisos : [];
}

export function permisosPorCargo(codigoCargo) {
  const cargo = CARGOS.find((c) => c.codigo === codigoCargo);
  return cargo ? cargo.permisos : [];
}

export function permisosEfectivos(rolCodigo, cargoCodigo) {
  const rolPermisos = new Set(permisosPorRol(rolCodigo));
  const cargoPermisos = new Set(permisosPorCargo(cargoCodigo));
  return [...new Set([...rolPermisos, ...cargoPermisos])];
}
