import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/queryClient", () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  },
}));

import { accessToken } from "@/utils/tokenStore";
import {
  iniciarStreamResidente,
  detenerStreamResidente,
  streamResidenteVivo,
} from "@/services/residenteStreamService";
import {
  useMisEncomiendasTiempoReal,
  pendientesResidente,
} from "@/composables/useMisEncomiendasTiempoReal";
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
  return `event: metrica\ndata: ${JSON.stringify(payload)}\n\n`;
}

async function flushAsync() {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

describe("useMisEncomiendasTiempoReal — stream SSE del residente", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
    });
    accessToken.value = "token-de-prueba";
    modo = "vivo";
    cerrarStreamActual = null;
    encolarEnStream = null;
    pendientesResidente.value = null;
    mockFetch();
  });

  afterEach(() => {
    detenerStreamResidente();
    vi.useRealTimers();
    accessToken.value = null;
    vi.clearAllMocks();
  });

  it("un evento de cambio invalida ['misEncomiendas', cid]", async () => {
    const { refetchIntervalResidente } = useMisEncomiendasTiempoReal();

    iniciarStreamResidente(CID);
    await flushAsync();
    expect(streamResidenteVivo.value).toBe(true);
    expect(refetchIntervalResidente.value).toBe(false);

    encolarEnStream(
      frameSSE({
        tipoEvento: "ENCOMIENDA_RECIBIDA",
        condominioId: CID,
        unidadId: "00000000-0000-0000-0002-000000000002",
        unidadNumero: "2",
        encomiendaId: "00000000-0000-0000-0000-0000000000ab",
        pendientes: null,
        timestamp: 1754000000000,
      }),
    );
    await flushAsync();

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["misEncomiendas", CID],
    });
  });

  it("SNAPSHOT_INICIAL siembra el badge y reconcilia; un cambio lo descarta", async () => {
    useMisEncomiendasTiempoReal();
    iniciarStreamResidente(CID);
    await flushAsync();

    encolarEnStream(
      frameSSE({
        tipoEvento: "SNAPSHOT_INICIAL",
        condominioId: CID,
        unidadId: null,
        unidadNumero: null,
        encomiendaId: null,
        pendientes: 3,
        timestamp: 1754000000000,
      }),
    );
    await flushAsync();

    expect(pendientesResidente.value).toBe(3);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["misEncomiendas", CID],
    });

    encolarEnStream(
      frameSSE({
        tipoEvento: "ENCOMIENDA_ENTREGADA",
        condominioId: CID,
        unidadId: "00000000-0000-0000-0002-000000000002",
        unidadNumero: "2",
        encomiendaId: "00000000-0000-0000-0000-0000000000cd",
        pendientes: null,
        timestamp: 1754000000000,
      }),
    );
    await flushAsync();

    // el cambio descarta el seed del snapshot → el badge vuelve a la lista
    expect(pendientesResidente.value).toBe(null);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["misEncomiendas", CID],
    });
  });

  it("gracia de caída sin polling; fallback 2 min; vuelve a SSE al reconectar", async () => {
    const { refetchIntervalResidente } = useMisEncomiendasTiempoReal();

    // ── Fase 1: stream vivo → sin polling ────────────────────────────────
    iniciarStreamResidente(CID);
    await flushAsync();
    expect(streamResidenteVivo.value).toBe(true);
    expect(refetchIntervalResidente.value).toBe(false);

    // ── Fase 2: caída → gracia (1 min) SIN polling ───────────────────────
    modo = "caido";
    cerrarStreamActual(); // cierra el stream → reconexión programada
    await flushAsync();
    expect(streamResidenteVivo.value).toBe(false);

    // durante la gracia (a los 30s del corte) NO hay polling
    await vi.advanceTimersByTimeAsync(30_000);
    expect(refetchIntervalResidente.value).toBe(false);
    expect(streamResidenteVivo.value).toBe(false);

    // ── Fase 3: pasada la gracia (61s) → fallback a 2 min ────────────────
    await vi.advanceTimersByTimeAsync(31_000);
    expect(refetchIntervalResidente.value).toBe(120_000);
    expect(streamResidenteVivo.value).toBe(false);

    // sigue caído → el intervalo de respaldo se mantiene en 2 min
    await vi.advanceTimersByTimeAsync(120_000);
    expect(refetchIntervalResidente.value).toBe(120_000);
    expect(streamResidenteVivo.value).toBe(false);

    // ── Fase 4: el stream se recupera → SSE puro, sin polling ────────────
    modo = "vivo";
    await vi.advanceTimersByTimeAsync(30_000); // siguiente intento de reconexión
    expect(streamResidenteVivo.value).toBe(true);
    expect(refetchIntervalResidente.value).toBe(false);
  });
});
