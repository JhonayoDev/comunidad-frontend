import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/queryClient", () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  },
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({
    condominioActualId: "00000000-0000-0000-0000-000000000001",
  }),
}));

import { ref } from "vue";
import { accessToken } from "@/utils/tokenStore";
import {
  iniciarStream,
  detenerStream,
  streamVivo,
} from "@/services/dashboardStreamService";
import { useMetricasTiempoReal } from "@/composables/useMetricasTiempoReal";

const CID = "00000000-0000-0000-0000-000000000001";

let modo; // "vivo" | "caido"
let cerrarStreamActual;

function crearStreamControlable() {
  let controller;
  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });
  return {
    stream,
    cerrar: () => controller.close(),
  };
}

function mockFetch() {
  global.fetch = vi.fn((_url, _opts) => {
    if (modo === "caido") {
      return Promise.reject(new Error("network down"));
    }
    const { stream, cerrar } = crearStreamControlable();
    cerrarStreamActual = cerrar;
    return Promise.resolve({ ok: true, body: stream });
  });
}

async function flushAsync() {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

describe("useMetricasTiempoReal — gracia de caída + polling de respaldo", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
    });
    accessToken.value = "token-de-prueba";
    modo = "vivo";
    cerrarStreamActual = null;
    mockFetch();
  });

  afterEach(() => {
    detenerStream();
    vi.useRealTimers();
    accessToken.value = null;
    vi.clearAllMocks();
  });

  it("sin polling con stream vivo; gracia sin polling; fallback 2 min; vuelve a SSE al reconectar", async () => {
    const { refetchIntervalMetrica } = useMetricasTiempoReal();

    // ── Fase 1: stream vivo → sin polling ────────────────────────────────
    iniciarStream(CID);
    await flushAsync();
    expect(streamVivo.value).toBe(true);
    expect(refetchIntervalMetrica.value).toBe(false);

    // ── Fase 2: caída → gracia (1 min) SIN polling ───────────────────────
    modo = "caido";
    cerrarStreamActual(); // cierra el stream → reconexión programada
    await flushAsync();
    expect(streamVivo.value).toBe(false);

    // durante la gracia (a los 30s del corte) NO hay polling
    await vi.advanceTimersByTimeAsync(30_000);
    expect(refetchIntervalMetrica.value).toBe(false);
    expect(streamVivo.value).toBe(false);

    // ── Fase 3: pasada la gracia (61s) → fallback a 2 min ────────────────
    await vi.advanceTimersByTimeAsync(31_000);
    expect(refetchIntervalMetrica.value).toBe(120_000);
    expect(streamVivo.value).toBe(false);

    // sigue caído → el intervalo de respaldo se mantiene en 2 min
    await vi.advanceTimersByTimeAsync(120_000);
    expect(refetchIntervalMetrica.value).toBe(120_000);
    expect(streamVivo.value).toBe(false);

    // ── Fase 4: el stream se recupera → SSE puro, sin polling ────────────
    modo = "vivo";
    await vi.advanceTimersByTimeAsync(30_000); // siguiente intento de reconexión
    expect(streamVivo.value).toBe(true);
    expect(refetchIntervalMetrica.value).toBe(false);
  });

  it("un parpadeo breve (caída < 1 min) NO activa el polling de respaldo", async () => {
    const { refetchIntervalMetrica } = useMetricasTiempoReal();

    iniciarStream(CID);
    await flushAsync();
    expect(streamVivo.value).toBe(true);

    // caída breve: se corta y se recupera a los 10s
    modo = "caido";
    cerrarStreamActual();
    await flushAsync();
    expect(streamVivo.value).toBe(false);

    await vi.advanceTimersByTimeAsync(10_000);

    modo = "vivo";
    await vi.advanceTimersByTimeAsync(30_000); // cubre el backoff máx (30s)
    await flushAsync();
    expect(streamVivo.value).toBe(true);

    // la gracia nunca expiró → el intervalo de respaldo nunca se activó
    expect(refetchIntervalMetrica.value).toBe(false);
  });
});
