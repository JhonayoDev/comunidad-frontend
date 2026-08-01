import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { mount } from "@vue/test-utils";
import BottomNavigation from "@/components/layout/BottomNavigation.vue";

vi.mock("@/composables/useBottomNav", () => ({
  useBottomNav: vi.fn(),
}));

import { useBottomNav } from "@/composables/useBottomNav";

const go = vi.fn();

function setup(items) {
  useBottomNav.mockReturnValue({
    items: ref(items),
    visible: ref(items.length > 0),
    activo: (item) => item.routeName === "Bitacora",
    go,
  });
}

const ITEMS = [
  { label: "Visita", icon: "pi pi-user-plus", routeName: "RegistrarVisita" },
  { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
  {
    label: "Escanear",
    icon: "pi pi-qrcode",
    routeName: "Escanear",
    isCentralFab: true,
  },
  { label: "Autoriz.", icon: "pi pi-shield", routeName: "Autorizaciones" },
];

beforeEach(() => {
  go.mockClear();
});

describe("BottomNavigation", () => {
  it("no renderiza nada cuando no hay items", () => {
    setup([]);
    const wrapper = mount(BottomNavigation);
    expect(wrapper.find("nav").exists()).toBe(false);
  });

  it("renderiza items estándar y el FAB central", () => {
    setup(ITEMS);
    const wrapper = mount(BottomNavigation);

    const nav = wrapper.find("nav");
    expect(nav.exists()).toBe(true);

    const estandar = wrapper.findAll("button.bottom-nav-item");
    expect(estandar.length).toBe(3);

    const fab = wrapper.find(".p-button");
    expect(fab.exists()).toBe(true);
  });

  it("marca como activo el item cuyo routeName coincide", () => {
    setup(ITEMS);
    const wrapper = mount(BottomNavigation);

    const activo = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Bitácora"));
    expect(activo.classes()).toContain("text-primary");
  });

  it("llama go con el item al hacer click", async () => {
    setup(ITEMS);
    const wrapper = mount(BottomNavigation);

    await wrapper.findAll("button")[0].trigger("click");
    expect(go).toHaveBeenCalledWith(ITEMS[0]);

    await wrapper.find(".p-button").trigger("click");
    expect(go).toHaveBeenCalledWith(ITEMS[2]);
  });
});
