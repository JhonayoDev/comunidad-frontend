import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { useSetupConfiguracion, SETUP_PASOS } from "@/composables/useSetupConfiguracion";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({
    condominioActualId: "cid-1",
    condominioActualNombre: "Condominio Test",
  }),
}));

vi.mock("@/services/dashboardService", () => ({
  dashboardService: {
    admin: vi.fn(),
  },
}));

import { dashboardService } from "@/services/dashboardService";

const Host = defineComponent({
  setup() {
    return { ...useSetupConfiguracion() };
  },
  template: "<div/>",
});

function montar() {
  return mount(Host);
}

describe("useSetupConfiguracion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("define las unidades como primer paso y 6 pasos en total", () => {
    expect(SETUP_PASOS).toHaveLength(6);
    expect(SETUP_PASOS[0].key).toBe("unidades");
    expect(SETUP_PASOS[0].routeName).toBe("SetupUnidades");
    expect(SETUP_PASOS.map((p) => p.key)).toEqual([
      "unidades",
      "planilla",
      "accesos",
      "areas-comunes",
      "cargos",
      "personal",
    ]);
  });

  it("sin unidades ni residentes todo queda pendiente", async () => {
    dashboardService.admin.mockResolvedValue({
      data: { totales: { unidades: 0, residentesActivos: 0, vehiculos: 0 } },
    });
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();

    expect(wrapper.vm.pasos[0].completado).toBe(false);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("unidades");
    expect(wrapper.vm.configuraciónCompleta).toBe(false);
    expect(wrapper.vm.progreso).toBe(0);
  });

  it("con unidades y residentes, unidades y planilla completadas; pasos 3-6 pendientes", async () => {
    dashboardService.admin.mockResolvedValue({
      data: { totales: { unidades: 5, residentesActivos: 3, vehiculos: 2 } },
    });
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();

    expect(wrapper.vm.pasos[0].completado).toBe(true);
    expect(wrapper.vm.pasos[1].completado).toBe(true);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("accesos");
    expect(wrapper.vm.configuraciónCompleta).toBe(false);
    expect(wrapper.vm.progreso).toBe(33);
  });

  it("sincronizarTotales deriva el estado sin refetch", () => {
    const wrapper = montar();
    wrapper.vm.sincronizarTotales({ unidades: 3, residentesActivos: 0, vehiculos: 0 });

    expect(wrapper.vm.pasos[0].completado).toBe(true);
    expect(wrapper.vm.pasos[1].completado).toBe(false);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("planilla");
    expect(dashboardService.admin).not.toHaveBeenCalled();
  });
});