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

vi.mock("@/services/unidadesService", () => ({
  unidadesService: {
    getCapacidad: vi.fn(),
  },
}));

import { dashboardService } from "@/services/dashboardService";
import { unidadesService } from "@/services/unidadesService";

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

  it("define unidades como paso 1, estacionamientos y bodegas como pasos 2-3 y 8 pasos en total", () => {
    expect(SETUP_PASOS).toHaveLength(8);
    expect(SETUP_PASOS[0].key).toBe("unidades");
    expect(SETUP_PASOS[0].routeName).toBe("SetupUnidades");
    expect(SETUP_PASOS[1].key).toBe("estacionamientos");
    expect(SETUP_PASOS[1].routeName).toBe("SetupEstacionamientos");
    expect(SETUP_PASOS[2].key).toBe("bodegas");
    expect(SETUP_PASOS[2].routeName).toBe("SetupBodegas");
    expect(SETUP_PASOS.map((p) => p.key)).toEqual([
      "unidades",
      "estacionamientos",
      "bodegas",
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
    unidadesService.getCapacidad.mockResolvedValue({
      data: {
        capacidadEstacionamientos: 0,
        totalEstacionamientos: 0,
        capacidadBodegas: 0,
        totalBodegas: 0,
      },
    });
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();

    expect(wrapper.vm.pasos[0].completado).toBe(false);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("unidades");
    expect(wrapper.vm.configuraciónCompleta).toBe(false);
    expect(wrapper.vm.progreso).toBe(0);
  });

  it("estacionamientos y bodegas se ocultan si no hay capacidad declarada ni creados", async () => {
    dashboardService.admin.mockResolvedValue({
      data: { totales: { unidades: 5, residentesActivos: 0, vehiculos: 0 } },
    });
    unidadesService.getCapacidad.mockResolvedValue({
      data: {
        capacidadEstacionamientos: 0,
        totalEstacionamientos: 0,
        capacidadBodegas: 0,
        totalBodegas: 0,
      },
    });
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();

    const est = wrapper.vm.pasos.find((p) => p.key === "estacionamientos");
    const bod = wrapper.vm.pasos.find((p) => p.key === "bodegas");
    expect(est.oculto).toBe(true);
    expect(est.completado).toBe(true);
    expect(bod.oculto).toBe(true);
    expect(bod.completado).toBe(true);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("planilla");
    expect(wrapper.vm.progreso).toBe(17); // 1 de 6 visibles (estac/bodegas ocultos)
  });

  it("con estacionamientos declarados y sin crear, el paso queda pendiente", async () => {
    dashboardService.admin.mockResolvedValue({
      data: { totales: { unidades: 5, residentesActivos: 3, vehiculos: 2 } },
    });
    unidadesService.getCapacidad.mockResolvedValue({
      data: {
        capacidadEstacionamientos: 10,
        totalEstacionamientos: 0,
        capacidadBodegas: 0,
        totalBodegas: 0,
      },
    });
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();

    expect(wrapper.vm.pasos[0].completado).toBe(true);
    expect(wrapper.vm.pasos[1].completado).toBe(false);
    expect(wrapper.vm.pasos[1].oculto).toBe(false);
    expect(wrapper.vm.pasos[2].oculto).toBe(true); // bodegas no declaradas
    expect(wrapper.vm.pasos[3].completado).toBe(true);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("estacionamientos");
    expect(wrapper.vm.configuraciónCompleta).toBe(false);
    expect(wrapper.vm.progreso).toBe(29);
  });

  it("con solo bodegas declaradas, solo el paso de bodegas queda visible y pendiente", async () => {
    dashboardService.admin.mockResolvedValue({
      data: { totales: { unidades: 5, residentesActivos: 3, vehiculos: 2 } },
    });
    unidadesService.getCapacidad.mockResolvedValue({
      data: {
        capacidadEstacionamientos: 0,
        totalEstacionamientos: 0,
        capacidadBodegas: 4,
        totalBodegas: 0,
      },
    });
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();

    const est = wrapper.vm.pasos.find((p) => p.key === "estacionamientos");
    const bod = wrapper.vm.pasos.find((p) => p.key === "bodegas");
    expect(est.oculto).toBe(true);
    expect(bod.oculto).toBe(false);
    expect(bod.completado).toBe(false);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("bodegas");
  });

  it("con estacionamientos y bodegas creados, ambos pasos quedan completados", async () => {
    dashboardService.admin.mockResolvedValue({
      data: { totales: { unidades: 5, residentesActivos: 3, vehiculos: 2 } },
    });
    unidadesService.getCapacidad.mockResolvedValue({
      data: {
        capacidadEstacionamientos: 10,
        totalEstacionamientos: 8,
        capacidadBodegas: 4,
        totalBodegas: 2,
      },
    });
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();

    expect(wrapper.vm.pasos[1].completado).toBe(true);
    expect(wrapper.vm.pasos[2].completado).toBe(true);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("accesos");
  });

  it("sincronizarTotales deriva el estado sin refetch (capacidad desconocida → pasos ocultos)", () => {
    const wrapper = montar();
    wrapper.vm.sincronizarTotales({ unidades: 3, residentesActivos: 0, vehiculos: 0 });

    expect(wrapper.vm.pasos[0].completado).toBe(true);
    expect(wrapper.vm.pasos[1].oculto).toBe(true);
    expect(wrapper.vm.pasos[1].completado).toBe(true);
    expect(wrapper.vm.pasos[2].oculto).toBe(true);
    expect(wrapper.vm.pasos[2].completado).toBe(true);
    expect(wrapper.vm.pasos[3].completado).toBe(false);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("planilla");
    expect(dashboardService.admin).not.toHaveBeenCalled();
  });
});