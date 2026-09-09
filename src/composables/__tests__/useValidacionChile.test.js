import { describe, it, expect, vi } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { useValidacionChile } from "@/composables/useValidacionChile";

const Host = defineComponent({
  setup() {
    return { ...useValidacionChile() };
  },
  template: "<div/>",
});

function montar() {
  return mount(Host);
}

describe("useValidacionChile", () => {
  it("valida nombre y limpia el error al corregir", () => {
    const wrapper = montar();
    expect(wrapper.vm.validarNombre("A", "nombre")).toBe(false);
    expect(wrapper.vm.errores.nombre).toBeTruthy();

    expect(wrapper.vm.validarNombre("Juan Pérez", "nombre")).toBe(true);
    expect(wrapper.vm.errores.nombre).toBeUndefined();
  });

  it("valida RUT solo si viene con valor (opcional)", () => {
    const wrapper = montar();
    expect(wrapper.vm.validarRut("", "rut")).toBe(true);
    expect(wrapper.vm.validarRut("12.345.678-5", "rut")).toBe(true);
    expect(wrapper.vm.validarRut("12.345.678-6", "rut")).toBe(false);
    expect(wrapper.vm.errores.rut).toBeTruthy();
    expect(wrapper.vm.validarRut("2.899.981-K", "rut")).toBe(true);
    expect(wrapper.vm.errores.rut).toBeUndefined();
  });

  it("valida email obligatorio", () => {
    const wrapper = montar();
    expect(wrapper.vm.validarEmail("", "email")).toBe(false);
    expect(wrapper.vm.validarEmail("admin@condominio.cl", "email")).toBe(true);
    expect(wrapper.vm.errores.email).toBeUndefined();
  });

  it("valida teléfono solo si viene con valor (opcional)", () => {
    const wrapper = montar();
    expect(wrapper.vm.validarTelefono("", "telefono")).toBe(true);
    expect(wrapper.vm.validarTelefono("+56 9 1234 5678", "telefono")).toBe(true);
    expect(wrapper.vm.validarTelefono("+56 2 1234 5678", "telefono")).toBe(true);
    expect(wrapper.vm.validarTelefono("123", "telefono")).toBe(false);
  });

  it("formatea RUT en input y completa en blur", () => {
    const wrapper = montar();
    expect(wrapper.vm.onRutInput("12345678")).toBe("12.345.678");
    expect(wrapper.vm.onRutBlur("12.345.678-5")).toBe("12.345.678-5");
    expect(wrapper.vm.onRutBlur("12345678")).toBe("12.345.678");
  });

  it("formatea teléfono en input y blur", () => {
    const wrapper = montar();
    expect(wrapper.vm.onTelefonoInput("912345678")).toBe("+56 9 1234 5678");
    expect(wrapper.vm.onTelefonoBlur("+56 9 1234 5678")).toBe("+56 9 1234 5678");
  });

  it("normaliza RUT, teléfono y email para el body", () => {
    const wrapper = montar();
    expect(wrapper.vm.normalizarRut("12.345.678-5")).toBe("12.345.678-5");
    expect(wrapper.vm.normalizarTelefono("+56 9 1234 5678")).toBe("+56912345678");
    expect(wrapper.vm.normalizarEmail("  Admin@Condominio.CL ")).toBe("admin@condominio.cl");
  });

  it("focusPrimerError enfoca el primer campo con error", () => {
    const wrapper = montar();
    const foco = { $el: { focus: () => {} } };
    const focusSpy = vi.spyOn(foco.$el, "focus");
    wrapper.vm.validarNombre("A", "nombre");
    wrapper.vm.focusPrimerError([
      ["nombre", { value: foco }],
      ["email", { value: { $el: { focus: () => {} } } }],
    ]);
    expect(focusSpy).toHaveBeenCalled();
  });

  it("focusPrimerError no falla sin refs", () => {
    const wrapper = montar();
    wrapper.vm.validarNombre("A", "nombre");
    expect(() =>
      wrapper.vm.focusPrimerError([
        ["nombre", { value: null }],
        ["email", { value: null }],
      ]),
    ).not.toThrow();
  });
});