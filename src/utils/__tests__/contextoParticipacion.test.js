import { describe, it, expect } from "vitest";
import {
  CONTEXT_DASHBOARDS,
  contextoDeCargo,
  construirContextos,
  contextoInicial,
} from "@/utils/contextoParticipacion";

// Los 9 cargos del enum CargoCondominio con su rol contextual real del backend
// (CargoService.ROL_CONTEXTUAL_POR_CARGO) y el portal que debe abrir cada uno.
const CARGOS = [
  ["ADMINISTRADOR", "ADMINISTRADOR", "administrador", "Administrador"],
  ["PRESIDENTE", "ADMINISTRADOR", "presidente", "Presidente"],
  ["TESORERO", "ADMINISTRADOR", "tesorero", "Tesorero"],
  ["SECRETARIO", "ADMINISTRADOR", "secretario", "Secretario"],
  ["DELEGADO", "ADMINISTRADOR", "delegado", "Delegado"],
  ["GUARDIA", "GUARDIA", "guardia", "Guardia"],
  ["CONSERJE", "GUARDIA", "guardia", "Guardia"],
  ["JARDINERO", "TRABAJADOR", "trabajador", "Trabajador"],
  ["MANTENCION", "TRABAJADOR", "trabajador", "Trabajador"],
];

describe("contextoDeCargo", () => {
  it("mapea los 9 cargos a su portal", () => {
    for (const [cargo, , clave] of CARGOS) {
      expect(contextoDeCargo(cargo), cargo).toBe(clave);
    }
  });

  it("comparte portal entre guardia/conserje y jardinero/mantención", () => {
    expect(contextoDeCargo("GUARDIA")).toBe(contextoDeCargo("CONSERJE"));
    expect(contextoDeCargo("JARDINERO")).toBe(contextoDeCargo("MANTENCION"));
  });

  it("devuelve null sin cargo y conserva cargos no catalogados", () => {
    expect(contextoDeCargo(null)).toBeNull();
    expect(contextoDeCargo(undefined)).toBeNull();
    expect(contextoDeCargo("NUEVO_CARGO")).toBe("nuevo_cargo");
  });
});

describe("contextoInicial (portal al seleccionar condominio)", () => {
  it.each(CARGOS)(
    "abre el portal del cargo %s",
    (cargo, rolContextual, clave) => {
      expect(
        contextoInicial({ cargo, rolContextual, tiposParticipacion: [] }),
      ).toBe(clave);
    },
  );

  it("prioriza la participación residencial sobre el cargo", () => {
    expect(
      contextoInicial({
        cargo: "GUARDIA",
        rolContextual: "GUARDIA",
        tiposParticipacion: ["PROPIETARIO", "TRABAJADOR"],
      }),
    ).toBe("residente");
  });

  it("usa el rol contextual cuando no hay cargo", () => {
    expect(
      contextoInicial({
        cargo: null,
        rolContextual: "GUARDIA",
        tiposParticipacion: [],
      }),
    ).toBe("guardia");
    expect(
      contextoInicial({
        cargo: null,
        rolContextual: "TRABAJADOR",
        tiposParticipacion: [],
      }),
    ).toBe("trabajador");
    expect(
      contextoInicial({
        cargo: null,
        rolContextual: "PROVEEDOR",
        tiposParticipacion: [],
      }),
    ).toBe("proveedor");
  });

  it("cae en residente sin ninguna señal contextual", () => {
    expect(contextoInicial({})).toBe("residente");
  });

  it("no confunde la participación TRABAJADOR con un cargo de guardia", () => {
    // Una membresía mal derivada como TRABAJADOR no inventa portal: sin cargo
    // ni rolContextual, el portal sigue siendo residente.
    expect(
      contextoInicial({ tiposParticipacion: ["TRABAJADOR"], cargo: null }),
    ).toBe("residente");
  });
});

describe("construirContextos (píldoras del header)", () => {
  it.each(CARGOS)(
    "muestra solo el contexto del cargo %s",
    (cargo, rolContextual, clave, etiqueta) => {
      expect(
        construirContextos({ cargo, rolContextual, tiposParticipacion: [] }),
      ).toEqual([{ key: clave, label: etiqueta }]);
    },
  );

  it("ofrece Residente y Guardia a quien es propietario y guardia", () => {
    expect(
      construirContextos({
        cargo: "GUARDIA",
        rolContextual: "GUARDIA",
        tiposParticipacion: ["PROPIETARIO", "TRABAJADOR"],
      }),
    ).toEqual([
      { key: "residente", label: "Residente" },
      { key: "guardia", label: "Guardia" },
    ]);
  });

  it("no duplica el contexto de trabajador", () => {
    expect(
      construirContextos({
        cargo: "JARDINERO",
        rolContextual: "TRABAJADOR",
        tiposParticipacion: ["TRABAJADOR"],
      }),
    ).toEqual([{ key: "trabajador", label: "Trabajador" }]);
  });

  it("ofrece Residente y el cargo de comité a un residente", () => {
    expect(
      construirContextos({
        cargo: "PRESIDENTE",
        rolContextual: "ADMINISTRADOR",
        tiposParticipacion: ["PROPIETARIO", "ADMINISTRACION"],
      }).map((c) => c.key),
    ).toEqual(["residente", "presidente"]);
  });

  it("muestra Proveedor cuando la membresía lo indica", () => {
    expect(
      construirContextos({
        tiposParticipacion: ["PROVEEDOR"],
        rolContextual: "PROVEEDOR",
      }),
    ).toEqual([{ key: "proveedor", label: "Proveedor" }]);
  });

  it("cae en Residente sin señales", () => {
    expect(construirContextos({})).toEqual([
      { key: "residente", label: "Residente" },
    ]);
  });
});

describe("CONTEXT_DASHBOARDS", () => {
  it("define un dashboard para cada portal", () => {
    expect(CONTEXT_DASHBOARDS.guardia).toBe("GuardiaDashboard");
    expect(CONTEXT_DASHBOARDS.trabajador).toBe("TrabajadorDashboard");
    expect(CONTEXT_DASHBOARDS.proveedor).toBe("ProveedorDashboard");
    expect(CONTEXT_DASHBOARDS.residente).toBe("Inicio");
    for (const [, , clave] of CARGOS) {
      expect(CONTEXT_DASHBOARDS[clave], clave).toBeTruthy();
    }
  });
});
