import { describe, it, expect, beforeEach, vi } from "vitest";

const { auth } = vi.hoisted(() => ({
  auth: {
    isAuthenticated: true,
    user: { roles: ["RESIDENTE"] },
    condominioActualRol: "RESIDENTE",
    condominioActualCargo: null,
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
});
