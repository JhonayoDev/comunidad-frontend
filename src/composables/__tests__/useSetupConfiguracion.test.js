import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { useSetupConfiguracion, SETUP_PASOS, marcarEnEdicion, marcarPasoGuardado, reiniciarGuardados } from "@/composables/useSetupConfiguracion";

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

vi.mock("@/services/encomiendasService", () => ({
  encomiendasService: {
    getAccesosEncomiendas: vi.fn(),
  },
}));

vi.mock("@/services/espaciosService", () => ({
  espaciosService: {
    getEspacios: vi.fn(),
  },
}));

import { dashboardService } from "@/services/dashboardService";
import { unidadesService } from "@/services/unidadesService";
import { encomiendasService } from "@/services/encomiendasService";
import { espaciosService } from "@/services/espaciosService";

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
    marcarEnEdicion(null);
    reiniciarGuardados();
    localStorage.clear();
    encomiendasService.getAccesosEncomiendas.mockResolvedValue({ data: [] });
    espaciosService.getEspacios.mockResolvedValue({ data: [] });
  });

  it("define unidades como paso 1, sectores como paso 2, pisos como paso 3 y 10 pasos en total", () => {
    expect(SETUP_PASOS).toHaveLength(10);
    expect(SETUP_PASOS[0].key).toBe("unidades");
    expect(SETUP_PASOS[0].routeName).toBe("SetupUnidades");
    expect(SETUP_PASOS[1].key).toBe("sectores");
    expect(SETUP_PASOS[1].routeName).toBe("SetupSectores");
    expect(SETUP_PASOS[2].key).toBe("pisos");
    expect(SETUP_PASOS[2].routeName).toBe("SetupPisos");
    expect(SETUP_PASOS[3].key).toBe("estacionamientos");
    expect(SETUP_PASOS[3].routeName).toBe("SetupEstacionamientos");
    expect(SETUP_PASOS[4].key).toBe("bodegas");
    expect(SETUP_PASOS[4].routeName).toBe("SetupBodegas");
    expect(SETUP_PASOS.map((p) => p.key)).toEqual([
      "unidades",
      "sectores",
      "pisos",
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
    expect(wrapper.vm.progreso).toBe(38); // 3 de 8 visibles (accesos y áreas pendientes)
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

    const est = wrapper.vm.pasos.find((p) => p.key === "estacionamientos");
    expect(wrapper.vm.pasos[0].completado).toBe(true);
    expect(wrapper.vm.pasos[1].completado).toBe(true); // sectores (unidades > 0)
    expect(wrapper.vm.pasos[2].completado).toBe(true); // pisos (unidades > 0)
    expect(est.completado).toBe(false);
    expect(est.oculto).toBe(false);
    expect(wrapper.vm.pasos[4].oculto).toBe(true); // bodegas no declaradas
    expect(wrapper.vm.pasos[5].completado).toBe(true); // planilla (residentes > 0)
    expect(wrapper.vm.primerPasoPendiente.key).toBe("estacionamientos");
    expect(wrapper.vm.configuraciónCompleta).toBe(false);
    expect(wrapper.vm.progreso).toBe(44); // 4 de 9 visibles (accesos y áreas pendientes)
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

  it("accesos queda pendiente sin accesos y completa con al menos uno", async () => {
    dashboardService.admin.mockResolvedValue({
      data: { totales: { unidades: 5, residentesActivos: 3, vehiculos: 0 } },
    });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();
    const acc = wrapper.vm.pasos.find((p) => p.key === "accesos");
    expect(acc.completado).toBe(false);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("accesos");
  });

  it("accesos sin datos (403) no bloquea: cae a unidades > 0", async () => {
    dashboardService.admin.mockResolvedValue({
      data: { totales: { unidades: 5, residentesActivos: 0, vehiculos: 0 } },
    });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    encomiendasService.getAccesosEncomiendas.mockRejectedValue({ response: { status: 403 } });
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();
    const acc = wrapper.vm.pasos.find((p) => p.key === "accesos");
    expect(acc.completado).toBe(true); // fallback no bloqueante
  });

  it("con estacionamientos y bodegas creados, ambos pasos quedan completados", async () => {
    encomiendasService.getAccesosEncomiendas.mockResolvedValue({
      data: [{ id: "a1", nombre: "Conserjería", activo: true }],
    });
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
    const est = wrapper.vm.pasos.find((p) => p.key === "estacionamientos");
    expect(est.completado).toBe(true);
    expect(wrapper.vm.pasos[6].completado).toBe(true); // accesos (≥1 creado)
    expect(wrapper.vm.primerPasoPendiente.key).toBe("areas-comunes");
  });

  it("sincronizarTotales deriva el estado sin refetch (capacidad desconocida → pasos ocultos)", () => {
    const wrapper = montar();
    wrapper.vm.sincronizarTotales({ unidades: 3, residentesActivos: 0, vehiculos: 0 });

    expect(wrapper.vm.pasos[0].completado).toBe(true);
    expect(wrapper.vm.pasos[1].oculto).toBe(false); // sectores siempre visible
    expect(wrapper.vm.pasos[1].completado).toBe(true);
    expect(wrapper.vm.pasos[2].oculto).toBe(false); // pisos siempre visible
    expect(wrapper.vm.pasos[2].completado).toBe(true);
    expect(wrapper.vm.pasos[3].oculto).toBe(true);
    expect(wrapper.vm.pasos[3].completado).toBe(true);
    expect(wrapper.vm.pasos[4].oculto).toBe(true);
    expect(wrapper.vm.pasos[4].completado).toBe(true);
    expect(wrapper.vm.pasos[5].completado).toBe(false);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("planilla");
    expect(dashboardService.admin).not.toHaveBeenCalled();
  });

  it("marcarEnEdicion pone el paso pendiente aunque tenga datos, y null lo restaura", () => {
    const wrapper = montar();
    wrapper.vm.sincronizarTotales({ unidades: 3, residentesActivos: 2, vehiculos: 0 });
    expect(wrapper.vm.pasos[5].completado).toBe(true);

    marcarEnEdicion("planilla");
    expect(wrapper.vm.pasos[5].completado).toBe(false);
    expect(wrapper.vm.primerPasoPendiente.key).toBe("planilla");

    marcarEnEdicion(null);
    expect(wrapper.vm.pasos[5].completado).toBe(true);
  });

  it("marcarEnEdicion de otro paso no afecta a planilla", () => {
    const wrapper = montar();
    wrapper.vm.sincronizarTotales({ unidades: 3, residentesActivos: 2, vehiculos: 0 });
    marcarEnEdicion("unidades");
    expect(wrapper.vm.pasos[5].completado).toBe(true);
    expect(wrapper.vm.pasos[0].completado).toBe(false);
  });

  it("areas-comunes pendiente sin espacios ni guardado; completa con conteo o flag", async () => {
    dashboardService.admin.mockResolvedValue({
      data: { totales: { unidades: 5, residentesActivos: 3, vehiculos: 0 } },
    });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();
    const acc = wrapper.vm.pasos.find((p) => p.key === "areas-comunes");
    expect(acc.completado).toBe(false);

    espaciosService.getEspacios.mockResolvedValue({
      data: [{ id: "e1", nombre: "Quincho", activo: true }],
    });
    await wrapper.vm.cargar();
    await flushPromises();
    expect(wrapper.vm.pasos.find((p) => p.key === "areas-comunes").completado).toBe(true);
  });

  it("areas-comunes completa con flag guardado aunque no haya conteo", async () => {
    dashboardService.admin.mockResolvedValue({
      data: { totales: { unidades: 5, residentesActivos: 3, vehiculos: 0 } },
    });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    marcarPasoGuardado("cid-1", "areas-comunes");
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();
    expect(wrapper.vm.pasos.find((p) => p.key === "areas-comunes").completado).toBe(true);
    // El flag sobrevive recargas vía localStorage.
    expect(localStorage.getItem("comunidad:setup-guardado:cid-1:areas-comunes")).toBe("1");
  });

  it("areas-comunes sin datos (403) queda pendiente con aviso", async () => {
    dashboardService.admin.mockResolvedValue({
      data: { totales: { unidades: 5, residentesActivos: 3, vehiculos: 0 } },
    });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    espaciosService.getEspacios.mockRejectedValue({ response: { status: 403 } });
    const wrapper = montar();
    await wrapper.vm.cargar();
    await flushPromises();
    expect(wrapper.vm.pasos.find((p) => p.key === "areas-comunes").completado).toBe(false);
  });
});