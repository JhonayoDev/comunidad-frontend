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

import { dashboardService } from "@/services/dashboardService";
import { useResidenteMetrics } from "@/composables/useResidenteMetrics";
import { esErrorModuloNoContratado } from "@/utils/errores";

function createHost() {
  return defineComponent({
    setup() {
      return { ...useResidenteMetrics() };
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
  e.response = { status: 403, data: { message: "El condominio no tiene suscrito el módulo ENCOMIENDAS" } };
  e.moduleNotSubscribed = true;
  return e;
}

describe("useResidenteMetrics — F2 hardening", () => {
  beforeEach(() => vi.clearAllMocks());

  it("expone encomiendasPendientes y isModuleMissing false en éxito", async () => {
    dashboardService.getResidenteMetrics.mockResolvedValue({
      data: { encomiendasPendientes: 3 },
    });
    const wrapper = mountWithQuery();
    await flushPromises();
    expect(wrapper.vm.encomiendasPendientes).toBe(3);
    expect(wrapper.vm.isModuleMissing).toBe(false);
  });

  it("isModuleMissing true con 403 ENCOMIENDAS", async () => {
    const e = errorModulo();
    dashboardService.getResidenteMetrics.mockRejectedValue(e);
    const wrapper = mountWithQuery();
    for (let i = 0; i < 5; i++) {
      await flushPromises();
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(wrapper.vm.isModuleMissing).toBe(true);
    expect(esErrorModuloNoContratado(e)).toBe(true);
  });
});
