import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

const auth = vi.hoisted(() => ({
  condominioActualId: "cid-1",
  esContactoFacturacion: true,
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => auth,
}));

vi.mock("@/services/suscripcionService", () => ({
  suscripcionService: { getEstado: vi.fn() },
}));

import { suscripcionService } from "@/services/suscripcionService";
import { useEstadoSuscripcion } from "@/composables/useEstadoSuscripcion";

function createHost() {
  return defineComponent({
    setup() {
      return { ...useEstadoSuscripcion() };
    },
    template: "<div />",
  });
}

function mountWithQuery() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return mount(createHost(), {
    global: { plugins: [[VueQueryPlugin, { queryClient: qc }]] },
  });
}

async function esperarQuery() {
  for (let i = 0; i < 5; i++) {
    await flushPromises();
    await new Promise((r) => setTimeout(r, 10));
  }
}

const avisoGracia = {
  tipo: "EN_GRACIA",
  severidad: "warn",
  mensaje: "Tu suscripción está vencida; tienes 5 días de gracia.",
  cta: "Contactar soporte",
};

describe("useEstadoSuscripcion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.condominioActualId = "cid-1";
    auth.esContactoFacturacion = true;
  });

  it("no consulta el estado si el usuario no es contacto de facturación", async () => {
    auth.esContactoFacturacion = false;
    const wrapper = mountWithQuery();
    await esperarQuery();
    expect(suscripcionService.getEstado).not.toHaveBeenCalled();
    expect(wrapper.vm.estado).toBe(null);
    expect(wrapper.vm.avisoPrincipal).toBe(null);
  });

  it("expone la gracia con escritura habilitada", async () => {
    suscripcionService.getEstado.mockResolvedValue({
      data: {
        estado: "ATRASADO",
        statusPago: "ATRASADO",
        puedeLeer: true,
        puedeEscribir: true,
        avisos: [avisoGracia],
      },
    });
    const wrapper = mountWithQuery();
    await esperarQuery();
    expect(suscripcionService.getEstado).toHaveBeenCalledWith("cid-1");
    expect(wrapper.vm.estado.estado).toBe("ATRASADO");
    expect(wrapper.vm.avisoPrincipal.tipo).toBe("EN_GRACIA");
    expect(wrapper.vm.suspendido).toBe(false);
    expect(wrapper.vm.atrasado).toBe(true);
    expect(wrapper.vm.puedeEscribir).toBe(true);
  });

  it("marca suspensión y bloqueo cuando el backend lo informa", async () => {
    suscripcionService.getEstado.mockResolvedValue({
      data: {
        estado: "SUSPENDIDO",
        statusPago: "SUSPENDIDO",
        puedeLeer: false,
        puedeEscribir: false,
        avisos: [
          {
            tipo: "SUSPENDIDO",
            severidad: "error",
            mensaje: "El acceso fue suspendido por falta de pago.",
            cta: "Contactar soporte",
          },
        ],
      },
    });
    const wrapper = mountWithQuery();
    await esperarQuery();
    expect(wrapper.vm.suspendido).toBe(true);
    expect(wrapper.vm.puedeLeer).toBe(false);
    expect(wrapper.vm.puedeEscribir).toBe(false);
  });

  it("degrada en silencio ante un 403 neutral", async () => {
    const error = new Error("forbidden");
    error.response = { status: 403, data: { message: "No autorizado" } };
    suscripcionService.getEstado.mockRejectedValue(error);
    const wrapper = mountWithQuery();
    await esperarQuery();
    expect(wrapper.vm.sinAcceso).toBe(true);
    expect(wrapper.vm.estado).toBe(null);
    expect(wrapper.vm.avisoPrincipal).toBe(null);
  });
});
