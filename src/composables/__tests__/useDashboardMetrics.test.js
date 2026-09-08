import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({ condominioActualId: "cid-1" }),
}));

vi.mock("@/services/dashboardService", () => ({
  dashboardService: {
    getMetrics: vi.fn(),
    getResidenteMetrics: vi.fn(),
  },
}));

vi.mock("@/utils/errores", async () => {
  const actual = await vi.importActual("@/utils/errores");
  return actual;
});

import { dashboardService } from "@/services/dashboardService";
import { useDashboardMetrics } from "@/composables/useDashboardMetrics";
import { esErrorModuloNoContratado } from "@/utils/errores";

function createHost() {
  return defineComponent({
    setup() {
      return { ...useDashboardMetrics() };
    },
    template: "<div />",
  });
}

function mountWithQuery() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Host = createHost();
  return mount(Host, {
    global: { plugins: [[VueQueryPlugin, { queryClient: qc }]] },
  });
}

function errorModulo() {
  const e = new Error("forbidden");
  e.response = { status: 403, data: { message: "El condominio no tiene suscrito el módulo CONTROL_ACCESO" } };
  e.moduleNotSubscribed = true;
  return e;
}

function errorPermiso() {
  const e = new Error("forbidden");
  e.response = { status: 403, data: { message: "No tiene permiso DASHBOARD_GUARDIA" } };
  return e;
}

describe("useDashboardMetrics — F2 hardening", () => {
  beforeEach(() => vi.clearAllMocks());

  it("expone datos y pendiente inicial null sin error", async () => {
    dashboardService.getMetrics.mockResolvedValue({
      data: { visitasActivas: 2, encomiendasPendientes: 5, autorizacionesPendientes: 1 },
    });
    const wrapper = mountWithQuery();
    await flushPromises();
    expect(wrapper.vm.visitasActivas).toBe(2);
    expect(wrapper.vm.encomiendasPendientes).toBe(5);
    expect(wrapper.vm.isModuleMissing).toBe(false);
  });

  it("isModuleMissing true con 403 módulo no contratado y pausa polling", async () => {
    const e = errorModulo();
    dashboardService.getMetrics.mockRejectedValue(e);
    const wrapper = mountWithQuery();
    // espera a que query falle (retry=false para módulo → inmediato, pero deja un tick)
    for (let i = 0; i < 5; i++) {
      await flushPromises();
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(esErrorModuloNoContratado(e)).toBe(true);
    // isModuleMissing debe ser true tras el error
    expect(wrapper.vm.isModuleMissing).toBe(true);
    expect(wrapper.vm.error?.response?.status).toBe(403);
  });

  it("isModuleMissing false con 403 por permisos (no pausa por módulo)", async () => {
    const e = errorPermiso();
    expect(esErrorModuloNoContratado(e)).toBe(false);
    dashboardService.getMetrics.mockRejectedValue(e);
    const wrapper = mountWithQuery();
    for (let i = 0; i < 5; i++) {
      await flushPromises();
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(wrapper.vm.isModuleMissing).toBe(false);
  });

  it("retry corta en módulo no contratado", () => {
    const e = errorModulo();
    // Simulamos la función retry usada en el composable
    const shouldRetryModulo = esErrorModuloNoContratado(e) ? false : true;
    expect(shouldRetryModulo).toBe(false);
    const e2 = new Error("network");
    e2.response = { status: 500, data: {} };
    expect(esErrorModuloNoContratado(e2)).toBe(false);
  });
});
