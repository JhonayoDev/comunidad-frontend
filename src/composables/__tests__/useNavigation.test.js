import { describe, it, expect, vi } from "vitest";
import { reactive } from "vue";

const auth = reactive({
  user: { roles: ["RESIDENTE"] },
  condominioActualRol: "ADMINISTRADOR",
  condominioActualRolContextual: "ADMINISTRADOR",
  condominioActualCargo: "ADMINISTRADOR",
  condominioActualCargos: ["ADMINISTRADOR", "CONSERJE"],
  condominioActualRolesContextuales: ["ADMINISTRADOR", "GUARDIA"],
  activeContext: "guardia",
  contextos: [
    { key: "residente", label: "Residente" },
    { key: "administrador", label: "Administrador" },
    { key: "guardia", label: "Conserje" },
  ],
  esParticipacionResidencial: true,
});

vi.mock("vue-router", () => ({
  useRouter: () => ({
    resolve: (r) => ({ path: `/${r.name}`, meta: {} }),
    push: vi.fn(),
  }),
  useRoute: () => ({ name: "Inicio", path: "/inicio" }),
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => auth,
}));

import {
  RUTAS_COMPARTIDAS,
  contextosDeRuta,
  useNavigation,
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

  it("ubica el portal del cargo guardia/conserje", () => {
    expect(contextosDeRuta("GuardiaDashboard")).toEqual(["guardia"]);
    expect(contextosDeRuta("Porton")).toContain("guardia");
    expect(contextosDeRuta("Encomiendas")).toContain("guardia");
    expect(contextosDeRuta("Bitacora")).toContain("guardia");
    expect(contextosDeRuta("Autorizaciones")).toContain("guardia");
    expect(contextosDeRuta("ChecklistTemplates")).toContain("guardia");
    expect(contextosDeRuta("Inicio")).not.toContain("guardia");
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

describe("navItems con varios cargos", () => {
  it("sigue el espacio operativo activo aunque el rol base sea ADMINISTRADOR", () => {
    auth.activeContext = "guardia";
    const { navItems } = useNavigation();

    expect(navItems.value[0].routeName).toBe("GuardiaDashboard");
  });

  it("mantiene el menú administrativo en el espacio administrador", () => {
    auth.activeContext = "administrador";
    const { navItems } = useNavigation();

    expect(navItems.value[0].routeName).toBe("Dashboard");
  });
});
