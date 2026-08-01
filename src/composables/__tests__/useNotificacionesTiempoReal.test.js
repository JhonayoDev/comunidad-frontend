import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/queryClient", () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  },
}));

import { accessToken } from "@/utils/tokenStore";
import {
  iniciarStreamNotificaciones,
  detenerStreamNotificaciones,
  streamNotificacionesVivo,
} from "@/services/notificacionesStreamService";
import {
  useNotificacionesTiempoReal,
  noLeidasNotificaciones,
} from "@/composables/useNotificacionesTiempoReal";
import { queryClient } from "@/queryClient";

const CID = "00000000-0000-0000-0000-000000000001";

let modo; // "vivo" | "caido"
let cerrarStreamActual;
let encolarEnStream;

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
    encolar: (chunk) =>
      controller.enqueue(new TextEncoder().encode(chunk)),
  };
}

function mockFetch() {
  global.fetch = vi.fn((_url, _opts) => {
    if (modo === "caido") {
      return Promise.reject(new Error("network down"));
    }
    const { stream, cerrar, encolar } = crearStreamControlable();
    cerrarStreamActual = cerrar;
    encolarEnStream = encolar;
    return Promise.resolve({ ok: true, body: stream });
  });
}

function frameSSE(payload) {
  return `event: notificacion\ndata: ${JSON.stringify(payload)}\n\n`;
}

async function flushAsync() {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

describe("useNotificacionesTiempoReal — stream SSE de la bandeja", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
    });
    accessToken.value = "token-de-prueba";
    modo = "vivo";
    cerrarStreamActual = null;
    encolarEnStream = null;
    noLeidasNotificaciones.value = null;
    mockFetch();
  });

  afterEach(() => {
    detenerStreamNotificaciones();
    vi.useRealTimers();
    accessToken.value = null;
    vi.clearAllMocks();
  });

  it("un NOTIFICACION_CREADA invalida ['notificaciones-sync', cid]", async () => {
    const { refetchIntervalNotificaciones } = useNotificacionesTiempoReal();

    iniciarStreamNotificaciones(CID);
    await flushAsync();
    expect(streamNotificacionesVivo.value).toBe(true);
    expect(refetchIntervalNotificaciones.value).toBe(false);

    encolarEnStream(
      frameSSE({
        tipoEvento: "NOTIFICACION_CREADA",
        condominioId: CID,
        notificacionId: "00000000-0000-0000-0000-0000000000ab",
        noLeidas: null,
        timestamp: 1754000000000,
      }),
    );
    await flushAsync();

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["notificaciones-sync", CID],
    });
  });

  it("SNAPSHOT_INICIAL siembra el badge y reconcilia; un cambio lo descarta", async () => {
    useNotificacionesTiempoReal();
    iniciarStreamNotificaciones(CID);
    await flushAsync();

    encolarEnStream(
      frameSSE({
        tipoEvento: "SNAPSHOT_INICIAL",
        condominioId: CID,
        notificacionId: null,
        noLeidas: 3,
        timestamp: 1754000000000,
      }),
    );
    await flushAsync();

    expect(noLeidasNotificaciones.value).toBe(3);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["notificaciones-sync", CID],
    });

    encolarEnStream(
      frameSSE({
        tipoEvento: "NOTIFICACION_CREADA",
        condominioId: CID,
        notificacionId: "00000000-0000-0000-0000-0000000000cd",
        noLeidas: null,
        timestamp: 1754000000000,
      }),
    );
    await flushAsync();

    // el cambio descarta el seed del snapshot → el badge vuelve al sync
    expect(noLeidasNotificaciones.value).toBe(null);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["notificaciones-sync", CID],
    });
  });

  it("gracia de caída sin polling; fallback 2 min; vuelve a SSE al reconectar", async () => {
    const { refetchIntervalNotificaciones } = useNotificacionesTiempoReal();

    // ── Fase 1: stream vivo → sin polling ────────────────────────────────
    iniciarStreamNotificaciones(CID);
    await flushAsync();
    expect(streamNotificacionesVivo.value).toBe(true);
    expect(refetchIntervalNotificaciones.value).toBe(false);

    // ── Fase 2: caída → gracia (1 min) SIN polling ───────────────────────
    modo = "caido";
    cerrarStreamActual(); // cierra el stream → reconexión programada
    await flushAsync();
    expect(streamNotificacionesVivo.value).toBe(false);

    // durante la gracia (a los 30s del corte) NO hay polling
    await vi.advanceTimersByTimeAsync(30_000);
    expect(refetchIntervalNotificaciones.value).toBe(false);
    expect(streamNotificacionesVivo.value).toBe(false);

    // ── Fase 3: pasada la gracia (61s) → fallback a 2 min ────────────────
    await vi.advanceTimersByTimeAsync(31_000);
    expect(refetchIntervalNotificaciones.value).toBe(120_000);
    expect(streamNotificacionesVivo.value).toBe(false);

    // sigue caído → el intervalo de respaldo se mantiene en 2 min
    await vi.advanceTimersByTimeAsync(120_000);
    expect(refetchIntervalNotificaciones.value).toBe(120_000);
    expect(streamNotificacionesVivo.value).toBe(false);

    // ── Fase 4: el stream se recupera → SSE puro, sin polling ────────────
    modo = "vivo";
    await vi.advanceTimersByTimeAsync(30_000); // siguiente intento de reconexión
    expect(streamNotificacionesVivo.value).toBe(true);
    expect(refetchIntervalNotificaciones.value).toBe(false);
  });
});
