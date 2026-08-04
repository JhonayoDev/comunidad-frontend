import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  refrescarToken,
  scheduleProactiveRefresh,
  clearProactiveRefresh,
  msHastaExpiracion,
  verificarTokenAlDespertar,
  iniciarCoordinadorRefresh,
  detenerCoordinadorRefresh,
} from "@/utils/refreshCoordinator";
import { accessToken } from "@/utils/tokenStore";
import { authService } from "@/services/authService";
import { guardarTokenEnIDB } from "@/utils/idbTokenStore";
import {
  emitirTokenRotado,
  suscribirseARotacionToken,
} from "@/utils/tokenBroadcast";

vi.mock("@/services/authService", () => ({
  authService: { refresh: vi.fn() },
}));

vi.mock("@/utils/idbTokenStore", () => ({
  guardarTokenEnIDB: vi.fn().mockResolvedValue(undefined),
  limpiarTokenEnIDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/utils/tokenBroadcast", () => ({
  emitirTokenRotado: vi.fn(),
  suscribirseARotacionToken: vi.fn(),
}));

const refreshMock = authService.refresh;
const SEG = 1000;

function jwtConExp(expS) {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ exp: expS }));
  return `${header}.${payload}.firma`;
}

beforeEach(() => {
  vi.useFakeTimers();
  refreshMock.mockReset();
  guardarTokenEnIDB.mockClear();
  emitirTokenRotado.mockClear();
  suscribirseARotacionToken.mockClear();
  suscribirseARotacionToken.mockReturnValue(() => {});
  accessToken.value = null;
  clearProactiveRefresh();
  detenerCoordinadorRefresh();
  Object.defineProperty(navigator, "locks", {
    value: undefined,
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  accessToken.value = null;
  clearProactiveRefresh();
  detenerCoordinadorRefresh();
});

describe("refrescarToken — single-flight", () => {
  it("ejecuta un solo /auth/refresh para llamadas concurrentes y propaga el token", async () => {
    refreshMock.mockResolvedValue({ data: { accessToken: "token-nuevo" } });

    const [t1, t2] = await Promise.all([refrescarToken(), refrescarToken()]);

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(t1).toBe("token-nuevo");
    expect(t2).toBe("token-nuevo");
    expect(accessToken.value).toBe("token-nuevo");
    expect(guardarTokenEnIDB).toHaveBeenCalledWith("token-nuevo");
    expect(emitirTokenRotado).toHaveBeenCalledWith("token-nuevo");
  });

  it("usa Web Locks cuando están disponibles (coordinación cross-tab)", async () => {
    const fakeLocks = { request: vi.fn(async (_name, cb) => cb()) };
    Object.defineProperty(navigator, "locks", {
      value: fakeLocks,
      configurable: true,
    });
    refreshMock.mockResolvedValue({ data: { accessToken: "token-lock" } });

    await refrescarToken();

    expect(fakeLocks.request).toHaveBeenCalledWith(
      "Briku:refresh",
      expect.any(Function),
    );
  });

  it("libera el single-flight tras un error para poder reintentar", async () => {
    refreshMock.mockRejectedValueOnce(new Error("boom"));
    await expect(refrescarToken()).rejects.toThrow("boom");

    refreshMock.mockResolvedValue({ data: { accessToken: "token-ok" } });
    await refrescarToken();

    expect(refreshMock).toHaveBeenCalledTimes(2);
    expect(accessToken.value).toBe("token-ok");
  });

  it("reprograma el timer proactivo tras una rotación exitosa", async () => {
    refreshMock.mockResolvedValue({ data: { accessToken: "token-timer" } });

    expect(vi.getTimerCount()).toBe(0);
    await refrescarToken();

    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });

  it("el timer proactivo dispara un refresh a los 14 minutos", async () => {
    refreshMock.mockResolvedValue({ data: { accessToken: "token-ciclo" } });
    scheduleProactiveRefresh();

    expect(refreshMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(14 * 60 * SEG);

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(accessToken.value).toBe("token-ciclo");
  });
});

describe("msHastaExpiracion", () => {
  it("devuelve ms restantes para un JWT sin expirar", () => {
    const exp = Math.floor(Date.now() / 1000) + 900;
    const ms = msHastaExpiracion(jwtConExp(exp));
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(900 * SEG);
  });

  it("devuelve negativo para un token ya expirado", () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    expect(msHastaExpiracion(jwtConExp(exp))).toBeLessThan(0);
  });

  it("devuelve Infinity para tokens no decodificables o ausentes", () => {
    expect(msHastaExpiracion(null)).toBe(Infinity);
    expect(msHastaExpiracion("no-es-un-jwt")).toBe(Infinity);
    expect(msHastaExpiracion("abc.def.ghi")).toBe(Infinity);
  });
});

describe("verificarTokenAlDespertar", () => {
  it("refresca si el token expira pronto", async () => {
    refreshMock.mockResolvedValue({ data: { accessToken: "token-renovado" } });
    accessToken.value = jwtConExp(Math.floor(Date.now() / 1000) + 30);

    await verificarTokenAlDespertar();

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(accessToken.value).toBe("token-renovado");
  });

  it("no refresca si el token aún es válido", async () => {
    accessToken.value = jwtConExp(Math.floor(Date.now() / 1000) + 900);

    await verificarTokenAlDespertar();

    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("no hace nada sin sesión activa", async () => {
    accessToken.value = null;
    await verificarTokenAlDespertar();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

describe("iniciarCoordinadorRefresh — BroadcastChannel", () => {
  it("aplica el token rotado por otra pestaña", async () => {
    let callback = null;
    suscribirseARotacionToken.mockImplementation((cb) => {
      callback = cb;
      return () => {};
    });

    iniciarCoordinadorRefresh();
    expect(suscribirseARotacionToken).toHaveBeenCalledTimes(1);

    callback("token-broadcast");
    await Promise.resolve();

    expect(accessToken.value).toBe("token-broadcast");
    expect(guardarTokenEnIDB).toHaveBeenCalledWith("token-broadcast");
    expect(emitirTokenRotado).toHaveBeenCalledWith("token-broadcast");
  });

  it("no registra dos veces los listeners", () => {
    iniciarCoordinadorRefresh();
    iniciarCoordinadorRefresh();
    expect(suscribirseARotacionToken).toHaveBeenCalledTimes(1);
  });

  it("desregistra los listeners al detener", () => {
    iniciarCoordinadorRefresh();
    detenerCoordinadorRefresh();
    iniciarCoordinadorRefresh();
    expect(suscribirseARotacionToken).toHaveBeenCalledTimes(2);
  });
});
