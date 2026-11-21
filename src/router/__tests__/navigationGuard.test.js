import { describe, it, expect, beforeEach, vi } from "vitest";

const { auth } = vi.hoisted(() => ({
  auth: {
    isAuthenticated: true,
    user: { roles: ["RESIDENTE"] },
    condominioActualRol: "RESIDENTE",
    condominioActualCargo: null,
    condominioActualRolContextual: null,
    activeContext: "residente",
    contextDashboard: "Inicio",
    permisos: [],
    tryRestoreSession: vi.fn(),
  },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => auth,
}));

import router from "../index";

async function irA(path) {
  await router.replace("/recuperar-password");
  await router.push(path);
}

describe("navigation guard", () => {
  beforeEach(() => {
    auth.isAuthenticated = true;
    auth.user = { roles: ["RESIDENTE"] };
    auth.condominioActualRol = "RESIDENTE";
    auth.condominioActualCargo = null;
    auth.condominioActualRolContextual = null;
    auth.activeContext = "residente";
    auth.contextDashboard = "Inicio";
    auth.permisos = [];
  });

  it("permite Menu cuando hay sesión pero aún no hay roles", async () => {
    auth.user = { roles: [] };

    await irA("/menu");

    expect(router.currentRoute.value.name).toBe("Menu");
  });

  it("redirige un usuario autenticado desde Login a su dashboard", async () => {
    await irA("/login");

    expect(router.currentRoute.value.name).toBe("Inicio");
  });

  it("cae a Menu cuando el destino inicial no tiene permisos", async () => {
    auth.contextDashboard = "FinanzasDashboard";

    await irA("/finanzas");

    expect(router.currentRoute.value.name).toBe("Menu");
  });

  it("abre GuardiaDashboard para un residente con cargo guardia", async () => {
    auth.condominioActualCargo = "GUARDIA";
    auth.condominioActualRolContextual = "GUARDIA";
    auth.activeContext = "guardia";
    auth.contextDashboard = "GuardiaDashboard";

    await irA("/login");

    expect(router.currentRoute.value.name).toBe("GuardiaDashboard");
  });

  it("permite las rutas del portal guardia con el contexto guardia", async () => {
    auth.condominioActualCargo = "CONSERJE";
    auth.condominioActualRolContextual = "GUARDIA";
    auth.activeContext = "guardia";
    auth.contextDashboard = "GuardiaDashboard";

    await irA("/guardia");

    expect(router.currentRoute.value.name).toBe("GuardiaDashboard");
  });

  it("saca del portal guardia cuando el contexto activo es residencial", async () => {
    auth.condominioActualCargo = "GUARDIA";
    auth.condominioActualRolContextual = "GUARDIA";
    auth.activeContext = "residente";
    auth.contextDashboard = "Inicio";

    await irA("/guardia");

    expect(router.currentRoute.value.name).toBe("Inicio");
  });

  it("no deja al contexto guardia entrar en módulos de residente", async () => {
    auth.condominioActualCargo = "GUARDIA";
    auth.condominioActualRolContextual = "GUARDIA";
    auth.activeContext = "guardia";
    auth.contextDashboard = "GuardiaDashboard";

    await irA("/mi-unidad");

    expect(router.currentRoute.value.name).toBe("GuardiaDashboard");
  });
});
