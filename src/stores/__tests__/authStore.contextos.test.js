import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";

vi.mock("@/composables/usePushNotifications", () => ({
  usePushNotifications: () => ({
    inicializar: vi.fn(),
    destruir: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/services/permisosService", () => ({
  permisosService: {
    getPermisos: vi.fn().mockResolvedValue({
      data: { permisos: [], rolEnCondominio: null },
    }),
  },
}));

import { useAuthStore } from "@/stores/authStore";

function condominio(extra = {}) {
  return {
    id: "cid-1",
    nombre: "Condominio de prueba",
    rolAcceso: "RESIDENTE",
    tiposParticipacion: [],
    cargo: null,
    cargos: [],
    rolesContextuales: [],
    rolContextual: null,
    ...extra,
  };
}

const CARGOS = [
  ["ADMINISTRADOR", "ADMINISTRADOR", "administrador", "Dashboard"],
  ["PRESIDENTE", "ADMINISTRADOR", "presidente", "Dashboard"],
  ["TESORERO", "ADMINISTRADOR", "tesorero", "FinanzasDashboard"],
  ["SECRETARIO", "ADMINISTRADOR", "secretario", "Dashboard"],
  ["DELEGADO", "ADMINISTRADOR", "delegado", "Dashboard"],
  ["GUARDIA", "GUARDIA", "guardia", "GuardiaDashboard"],
  ["CONSERJE", "GUARDIA", "guardia", "GuardiaDashboard"],
  ["JARDINERO", "TRABAJADOR", "trabajador", "TrabajadorDashboard"],
  ["MANTENCION", "TRABAJADOR", "trabajador", "TrabajadorDashboard"],
];

describe("authStore — contextos por cargo", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it.each(CARGOS)(
    "seleccionarCondominio deja el contexto %s en %s",
    (cargo, rolContextual, clave, dashboard) => {
      const auth = useAuthStore();
      auth.condominios = [condominio({ cargo, rolContextual })];

      auth.seleccionarCondominio("cid-1");

      expect(auth.activeContext).toBe(clave);
      expect(auth.contextos).toHaveLength(1);
      expect(auth.contextos[0].key).toBe(clave);
      expect(auth.contextDashboard).toBe(dashboard);
    },
  );

  it("ofrece Residente y Guardia a un propietario con cargo guardia", () => {
    const auth = useAuthStore();
    auth.condominios = [
      condominio({
        cargo: "GUARDIA",
        rolContextual: "GUARDIA",
        tiposParticipacion: ["PROPIETARIO", "TRABAJADOR"],
      }),
    ];

    auth.seleccionarCondominio("cid-1");

    expect(auth.activeContext).toBe("residente");
    expect(auth.contextos.map((c) => c.key)).toEqual(["residente", "guardia"]);
    expect(auth.contextDashboard).toBe("Inicio");
  });

  it("cae en Residente sin señales de participación", () => {
    const auth = useAuthStore();
    auth.condominios = [condominio()];

    auth.seleccionarCondominio("cid-1");

    expect(auth.contextos).toEqual([
      { key: "residente", label: "Residente" },
    ]);
    expect(auth.contextDashboard).toBe("Inicio");
  });

  it("muestra las píldoras de todos los cargos activos (ADMINISTRADOR + CONSERJE)", () => {
    const auth = useAuthStore();
    auth.condominios = [
      condominio({
        cargo: "ADMINISTRADOR",
        cargos: ["ADMINISTRADOR", "CONSERJE"],
        rolesContextuales: ["ADMINISTRADOR", "GUARDIA"],
        rolContextual: "ADMINISTRADOR",
        tiposParticipacion: ["PROPIETARIO", "ADMINISTRACION"],
      }),
    ];

    auth.seleccionarCondominio("cid-1");

    expect(auth.activeContext).toBe("residente");
    expect(auth.condominioActualCargos).toEqual([
      "ADMINISTRADOR",
      "CONSERJE",
    ]);
    expect(auth.condominioActualRolesContextuales).toEqual([
      "ADMINISTRADOR",
      "GUARDIA",
    ]);
    expect(auth.contextos).toEqual([
      { key: "residente", label: "Residente" },
      { key: "administrador", label: "Administrador" },
      { key: "guardia", label: "Conserje" },
    ]);
  });

  it("corrige el contexto activo si el condominio cambia a otro con contextos distintos", async () => {
    const auth = useAuthStore();
    auth.condominios = [condominio({ cargo: "PRESIDENTE" })];
    auth.seleccionarCondominio("cid-1");
    expect(auth.activeContext).toBe("presidente");

    auth.condominioActual = condominio({
      cargo: "GUARDIA",
      rolContextual: "GUARDIA",
    });
    await nextTick();

    expect(auth.activeContext).toBe("guardia");
    expect(auth.contextDashboard).toBe("GuardiaDashboard");
  });
});
