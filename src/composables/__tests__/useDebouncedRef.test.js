import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { effectScope, nextTick } from "vue";
import { useDebouncedRef } from "@/composables/useDebouncedRef";

function crear(valor = "", espera = 300) {
  const scope = effectScope();
  const api = scope.run(() => useDebouncedRef(valor, espera));
  return { ...api, scope };
}

describe("useDebouncedRef", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("actualiza la copia solo después del retardo", async () => {
    const { valor, valorDebounced, scope } = crear("", 300);

    valor.value = "cintya";
    await nextTick();
    expect(valorDebounced.value).toBe("");

    vi.advanceTimersByTime(299);
    expect(valorDebounced.value).toBe("");

    vi.advanceTimersByTime(1);
    expect(valorDebounced.value).toBe("cintya");

    scope.stop();
  });

  it("reinicia el temporizador con cada cambio", async () => {
    const { valor, valorDebounced, scope } = crear("", 300);

    valor.value = "cin";
    await nextTick();
    vi.advanceTimersByTime(200);

    valor.value = "cintya";
    await nextTick();
    vi.advanceTimersByTime(200);
    expect(valorDebounced.value).toBe("");

    vi.advanceTimersByTime(100);
    expect(valorDebounced.value).toBe("cintya");

    scope.stop();
  });

  it("flush aplica lo pendiente de inmediato", async () => {
    const { valor, valorDebounced, flush, scope } = crear("", 300);

    valor.value = "cintya";
    await nextTick();
    flush();
    expect(valorDebounced.value).toBe("cintya");

    vi.advanceTimersByTime(300);
    expect(valorDebounced.value).toBe("cintya");

    scope.stop();
  });

  it("cancelar descarta el cambio pendiente", async () => {
    const { valor, valorDebounced, cancelar, scope } = crear("inicial", 300);

    valor.value = "cintya";
    await nextTick();
    cancelar();
    vi.advanceTimersByTime(1000);
    expect(valorDebounced.value).toBe("inicial");

    scope.stop();
  });

  it("fijar cambia ambos valores sin esperar", async () => {
    const { valor, valorDebounced, fijar, scope } = crear("inicial", 300);

    fijar("cintya@gmail.com");
    expect(valor.value).toBe("cintya@gmail.com");
    expect(valorDebounced.value).toBe("cintya@gmail.com");

    scope.stop();
  });

  it("al detener el scope no queda un temporizador activo", async () => {
    const { valor, valorDebounced, scope } = crear("", 300);

    valor.value = "cintya";
    await nextTick();
    scope.stop();

    vi.advanceTimersByTime(1000);
    expect(valorDebounced.value).toBe("");
  });
});
