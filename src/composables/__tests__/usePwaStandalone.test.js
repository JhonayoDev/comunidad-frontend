import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { usePwaStandalone } from "@/composables/usePwaStandalone";

function crearMql({ matches = false } = {}) {
  const listeners = new Set();
  return {
    matches,
    media: "",
    addEventListener: vi.fn((type, fn) => {
      if (type === "change") listeners.add(fn);
    }),
    removeEventListener: vi.fn((type, fn) => {
      if (type === "change") listeners.delete(fn);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    emitChange(m = matches) {
      this.matches = m;
      listeners.forEach((fn) => fn({ matches: m }));
    },
  };
}

const Host = defineComponent({
  setup() {
    return { ...usePwaStandalone() };
  },
  template: "<div/>",
});

let displayMql;
let touchMql;

beforeEach(() => {
  vi.stubEnv("DEV", false);
  displayMql = crearMql();
  touchMql = crearMql({ matches: true });
  window.matchMedia = vi.fn((q) =>
    q.includes("standalone") ? displayMql : touchMql,
  );
  Object.defineProperty(window.navigator, "standalone", {
    value: undefined,
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("usePwaStandalone", () => {
  it("activa mostrar cuando display-mode standalone + pointer coarse", () => {
    displayMql = crearMql({ matches: true });
    window.matchMedia = vi.fn((q) =>
      q.includes("standalone") ? displayMql : touchMql,
    );
    const wrapper = mount(Host);

    expect(wrapper.vm.isStandalone).toBe(true);
    expect(wrapper.vm.esTouch).toBe(true);
    expect(wrapper.vm.mostrar).toBe(true);
  });

  it("detecta iOS Safari via navigator.standalone", () => {
    Object.defineProperty(window.navigator, "standalone", {
      value: true,
      configurable: true,
    });
    const wrapper = mount(Host);

    expect(wrapper.vm.isStandalone).toBe(true);
    expect(wrapper.vm.mostrar).toBe(true);
  });

  it("no muestra la barra en navegador de escritorio", () => {
    const wrapper = mount(Host);

    expect(wrapper.vm.isStandalone).toBe(false);
    expect(wrapper.vm.esTouch).toBe(true);
    expect(wrapper.vm.mostrar).toBe(false);
  });

  it("reacciona al evento change del media query", async () => {
    const wrapper = mount(Host);
    expect(wrapper.vm.isStandalone).toBe(false);

    displayMql.emitChange(true);
    await Promise.resolve();

    expect(wrapper.vm.isStandalone).toBe(true);
    expect(wrapper.vm.mostrar).toBe(true);
  });

  it("reescribe al disparar pageshow (instalación tardía)", async () => {
    const wrapper = mount(Host);
    expect(wrapper.vm.isStandalone).toBe(false);

    displayMql.matches = true;
    window.dispatchEvent(new Event("pageshow"));
    await Promise.resolve();

    expect(wrapper.vm.isStandalone).toBe(true);
  });

  it("esTouch depende de pointer: coarse", () => {
    touchMql = crearMql({ matches: false });
    window.matchMedia = vi.fn((q) =>
      q.includes("standalone") ? displayMql : touchMql,
    );
    const wrapper = mount(Host);

    expect(wrapper.vm.esTouch).toBe(false);
    expect(wrapper.vm.mostrar).toBe(false);
  });
});
