import { describe, it, expect } from "vitest";
import {
  RUTAS_COMPARTIDAS,
  contextosDeRuta,
} from "@/composables/useNavigation";

describe("contextosDeRuta", () => {
  it("ubica las rutas de residente en el contexto residente", () => {
    expect(contextosDeRuta("Inicio")).toContain("residente");
    expect(contextosDeRuta("MiUnidad")).toContain("residente");
    expect(contextosDeRuta("MisSolicitudes")).toContain("residente");
  });

  it("ubica el dashboard administrativo en los cargos del comité", () => {
    const contextos = contextosDeRuta("Dashboard");
    expect(contextos).toContain("administrador");
    expect(contextos).toContain("presidente");
    expect(contextos).toContain("tesorero");
    expect(contextos).toContain("secretario");
  });

  it("separa los módulos de administración de los de residente", () => {
    const personas = contextosDeRuta("Personas");
    expect(personas).not.toContain("residente");
    expect(personas).toContain("administrador");
    expect(contextosDeRuta("MisDeudas")).toEqual(["residente"]);
  });

  it("ubica los portales de staff", () => {
    expect(contextosDeRuta("TrabajadorDashboard")).toEqual(["trabajador"]);
    expect(contextosDeRuta("ProveedorDashboard")).toEqual(["proveedor"]);
  });

  it("deja sin contexto las rutas auxiliares fuera del menú", () => {
    expect(contextosDeRuta("BusquedaDetalle")).toEqual([]);
    expect(contextosDeRuta("RegistrarVisita")).toEqual([]);
    expect(contextosDeRuta(undefined)).toEqual([]);
  });
});

describe("RUTAS_COMPARTIDAS", () => {
  it("mantiene header y comunicaciones accesibles en todo contexto", () => {
    expect([...RUTAS_COMPARTIDAS].sort()).toEqual(
      ["Menu", "MisPermisos", "Notificaciones", "Perfil"].sort(),
    );
  });
});
