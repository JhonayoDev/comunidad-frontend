import { describe, it, expect } from "vitest";
import {
  TIPOS_SOLICITUD,
  TIPOS_SOLICITUD_ALTA,
  TIPOS_SOLICITUD_API,
  getTipoSolicitud,
  getTiposPorCategoria,
  labelTipoSolicitud,
  labelEstadoSolicitud,
  labelGrupoEstadoSolicitud,
  labelCategoriaSolicitud,
  labelPrioridadSolicitud,
  labelOrigenRuido,
  valorLegibleCampo,
  esCampoVisible,
  esRutChilenoValido,
  construirDatos,
  construirPayload,
} from "@/data/solicitudTipos";

describe("solicitudTipos · registro", () => {
  it("cubre todos los códigos del enum TipoSolicitud del backend", () => {
    expect(TIPOS_SOLICITUD_API.map((t) => t.value)).toEqual([
      "SOLICITUD",
      "RECLAMO",
      "CORRECCION_RUT",
      "SOLICITUD_MANTENCION",
      "RECLAMO_RUIDOS",
    ]);
  });

  it("separa solicitudes de reclamos por categoría", () => {
    expect(getTiposPorCategoria("SOLICITUD").map((t) => t.value)).toEqual([
      "SOLICITUD",
      "CORRECCION_RUT",
      "SOLICITUD_MANTENCION",
    ]);
    expect(getTiposPorCategoria("RECLAMO").map((t) => t.value)).toEqual([
      "RECLAMO",
      "RECLAMO_RUIDOS",
    ]);
  });

  it("ofrece en el alta los tipos genéricos y de mantención", () => {
    expect(TIPOS_SOLICITUD_ALTA.map((t) => t.value)).toEqual([
      "SOLICITUD",
      "RECLAMO",
      "SOLICITUD_MANTENCION",
      "RECLAMO_RUIDOS",
    ]);
  });

  it("mantiene CORRECCION_RUT en el catálogo y en los filtros, pero no en el alta", () => {
    expect(TIPOS_SOLICITUD.some((t) => t.value === "CORRECCION_RUT")).toBe(true);
    expect(TIPOS_SOLICITUD_API.map((t) => t.value)).toContain("CORRECCION_RUT");
    expect(TIPOS_SOLICITUD_ALTA.map((t) => t.value)).not.toContain(
      "CORRECCION_RUT",
    );
  });

  it("no resuelve códigos legados retirados del backend", () => {
    expect(getTipoSolicitud("OTRO")).toBeNull();
    expect(getTipoSolicitud("RECLAMO_MANTENCION")).toBeNull();
    expect(getTipoSolicitud("INSTALACION_FOCO")).toBeNull();
  });

  it("devuelve null para un tipo desconocido", () => {
    expect(getTipoSolicitud("NO_EXISTE")).toBeNull();
  });
});

describe("solicitudTipos · etiquetas", () => {
  it("traduce los enums del backend y cae al valor crudo", () => {
    expect(labelTipoSolicitud("CORRECCION_RUT")).toBe("Corrección de RUT");
    expect(labelTipoSolicitud("SOLICITUD")).toBe("Solicitud");
    expect(labelTipoSolicitud("RECLAMO")).toBe("Reclamo");
    expect(labelTipoSolicitud("SOLICITUD_MANTENCION")).toBe(
      "Solicitud de mantención",
    );
    expect(labelTipoSolicitud("DESCONOCIDO")).toBe("DESCONOCIDO");

    expect(labelEstadoSolicitud("EN_REVISION")).toBe("En revisión");
    expect(labelEstadoSolicitud("CANCELADA")).toBe("Cancelada");

    expect(labelGrupoEstadoSolicitud("ABIERTA")).toBe("Abiertas");
    expect(labelGrupoEstadoSolicitud("CERRADA")).toBe("Cerradas");

    expect(labelCategoriaSolicitud("RECLAMO")).toBe("Reclamo");
    expect(labelPrioridadSolicitud("URGENTE")).toBe("Urgente");
  });

  it("traduce el origen del ruido usando las opciones del formulario", () => {
    expect(labelOrigenRuido("UNIDAD_VECINA")).toBe("Unidad vecina");
    expect(labelOrigenRuido(null)).toBe("Sin especificar");
  });
});

describe("solicitudTipos · campos condicionales y valores legibles", () => {
  const campoOtro = getTipoSolicitud("CORRECCION_RUT").campos.find(
    (c) => c.key === "motivoOtro",
  );

  it("muestra el campo condicional solo cuando coincide showWhen", () => {
    expect(esCampoVisible(campoOtro, { motivo: "OTRO" })).toBe(true);
    expect(esCampoVisible(campoOtro, { motivo: "ERROR_TIPEO" })).toBe(false);
    expect(esCampoVisible(campoOtro, {})).toBe(false);
  });

  it("los campos sin showWhen siempre son visibles", () => {
    const campoSimple = getTipoSolicitud("SOLICITUD").campos[0];
    expect(esCampoVisible(campoSimple, {})).toBe(true);
  });

  it("legibiliza booleanos y selects", () => {
    const campoAfecta = getTipoSolicitud("SOLICITUD_MANTENCION").campos.find(
      (c) => c.key === "afectaSeguridad",
    );
    expect(
      valorLegibleCampo("SOLICITUD_MANTENCION", campoAfecta, true),
    ).toBe("Sí");
    expect(
      valorLegibleCampo("SOLICITUD_MANTENCION", campoAfecta, false),
    ).toBe("No");

    const campoOrigen = getTipoSolicitud("RECLAMO_RUIDOS").campos.find(
      (c) => c.key === "origen",
    );
    expect(valorLegibleCampo("RECLAMO_RUIDOS", campoOrigen, "OBRAS")).toBe(
      "Trabajos/obras",
    );
    expect(valorLegibleCampo("RECLAMO_RUIDOS", campoOrigen, null)).toBe("");
  });
});

describe("solicitudTipos · validación de RUT", () => {
  it("acepta RUT chileno con 6-8 dígitos y DV correcto", () => {
    expect(esRutChilenoValido("12.345.678-5")).toBe(true);
    expect(esRutChilenoValido("7.654.321-6")).toBe(true);
  });

  it("rechaza DV incorrecto y cuerpos fuera de rango", () => {
    expect(esRutChilenoValido("12.345.678-9")).toBe(false);
    expect(esRutChilenoValido("123.456-3")).toBe(false);
    expect(esRutChilenoValido("12.345.678")).toBe(false);
    expect(esRutChilenoValido("")).toBe(false);
  });

  it("valida los campos obligatorios de la corrección de RUT", () => {
    const tipo = getTipoSolicitud("CORRECCION_RUT");

    expect(tipo.validacion({})).toEqual({
      rutNuevo: "El RUT corregido es obligatorio",
      motivo: "El motivo es obligatorio",
    });

    expect(
      tipo.validacion({ rutNuevo: "12.345.678-9", motivo: "ERROR_TIPEO" }),
    ).toEqual({ rutNuevo: "El RUT corregido no es válido" });

    expect(
      tipo.validacion({
        rutActual: "12.345.678-5",
        rutNuevo: "12.345.678-5",
        motivo: "ERROR_TIPEO",
      }),
    ).toEqual({ rutNuevo: "El RUT corregido debe ser distinto del actual" });

    expect(
      tipo.validacion({
        rutActual: "12.345.678-5",
        rutNuevo: "11.111.111-1",
        motivo: "OTRO",
        motivoOtro: "  ",
      }),
    ).toEqual({ motivoOtro: "Debes especificar el motivo" });

    expect(
      tipo.validacion({
        rutActual: "12.345.678-5",
        rutNuevo: "11.111.111-1",
        motivo: "OTRO",
        motivoOtro: "Error del registro civil",
      }),
    ).toEqual({});
  });
});

describe("solicitudTipos · construcción del payload", () => {
  it("arma el payload de corrección de RUT con el RUT normalizado", () => {
    const payload = construirPayload(
      "CORRECCION_RUT",
      {
        rutActual: "12.345.678-5",
        rutNuevo: "111111111",
        motivo: "ERROR_TIPEO",
      },
      { unidadId: "unidad-1" },
    );

    expect(payload).toMatchObject({
      categoria: "SOLICITUD",
      tipo: "CORRECCION_RUT",
      titulo: "Corrección de RUT (11.111.111-1)",
      prioridad: "NORMAL",
      unidadId: "unidad-1",
    });
    expect(payload.datos.rutNuevo).toBe("11.111.111-1");
    expect(payload.datos.rutActual).toBe("12.345.678-5");
    expect(payload.descripcion).toBe("Motivo: Error de tipeo");
  });

  it("usa el detalle libre cuando el motivo es OTRO", () => {
    const payload = construirPayload("CORRECCION_RUT", {
      rutNuevo: "11.111.111-1",
      motivo: "OTRO",
      motivoOtro: "Trámite pendiente",
      evidenciaUrl: "https://example.com/cert.pdf",
    });

    expect(payload.descripcion).toBe(
      "Motivo: Trámite pendiente\nEvidencia: https://example.com/cert.pdf",
    );
    expect(payload.unidadId).toBeNull();
  });

  it("eleva la prioridad a URGENTE cuando hay riesgo", () => {
    const urgente = construirPayload("SOLICITUD_MANTENCION", {
      ubicacion: "Torre A",
      tipoFalla: "ELECTRICO",
      descripcion: "Corto circuito",
      afectaSeguridad: true,
    });
    expect(urgente.categoria).toBe("SOLICITUD");
    expect(urgente.tipo).toBe("SOLICITUD_MANTENCION");
    expect(urgente.titulo).toBe("Solicitud de mantención · Torre A");
    expect(urgente.prioridad).toBe("URGENTE");
    expect(urgente.datos.afectaSeguridad).toBe(true);

    const normal = construirPayload("SOLICITUD_MANTENCION", {
      ubicacion: "Torre A",
      tipoFalla: "ELECTRICO",
      descripcion: "Corto circuito",
      afectaSeguridad: false,
    });
    expect(normal.prioridad).toBe("NORMAL");
    expect(normal.datos.afectaSeguridad).toBe(false);
  });

  it("resume el reclamo de ruidos con el origen legible", () => {
    const payload = construirPayload("RECLAMO_RUIDOS", {
      origen: "UNIDAD_VECINA",
      unidadOrigen: "Casa 12",
      descripcion: "Música fuerte",
    });

    expect(payload.titulo).toBe("Reclamo por ruidos · Unidad vecina");
    expect(payload.descripcion).toBe("Música fuerte");
    expect(payload.datos.unidadOrigen).toBe("Casa 12");
  });

  it("recorta espacios y omite valores vacíos del JSON", () => {
    const datos = construirDatos("SOLICITUD", {
      titulo: "  Consulta  ",
      descripcion: "   ",
    });

    expect(datos).toEqual({ titulo: "Consulta" });
  });

  it("propaga la unidad opcional en el payload", () => {
    const payload = construirPayload(
      "SOLICITUD",
      { titulo: "Consulta", descripcion: "Detalle" },
      { unidadId: "u-9" },
    );
    expect(payload.unidadId).toBe("u-9");
    expect(payload.prioridad).toBe("NORMAL");
  });

  it("envía los códigos canónicos para solicitud y reclamo genéricos", () => {
    const solicitud = construirPayload("SOLICITUD", {
      titulo: "Consulta",
      descripcion: "Detalle",
    });
    expect(solicitud.categoria).toBe("SOLICITUD");
    expect(solicitud.tipo).toBe("SOLICITUD");
    expect(solicitud.titulo).toBe("Consulta");

    const reclamo = construirPayload("RECLAMO", {
      titulo: "Ruido",
      descripcion: "Detalle",
    });
    expect(reclamo.categoria).toBe("RECLAMO");
    expect(reclamo.tipo).toBe("RECLAMO");
  });

  it("envía SOLICITUD_MANTENCION con su propio código", () => {
    const payload = construirPayload("SOLICITUD_MANTENCION", {
      ubicacion: "Torre A",
      tipoFalla: "ELECTRICO",
      descripcion: "Corto circuito",
    });
    expect(payload.categoria).toBe("SOLICITUD");
    expect(payload.tipo).toBe("SOLICITUD_MANTENCION");
    expect(payload.titulo).toBe("Solicitud de mantención · Torre A");
  });

  it("lanza si el tipo no existe", () => {
    expect(() => construirPayload("NO_EXISTE", {})).toThrow(
      /Tipo de solicitud desconocido/,
    );
  });
});
