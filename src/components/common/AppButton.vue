<script setup>
import { computed, useAttrs } from "vue";
import Button from "primevue/button";
import { intencionPorSlug, CLAVES_ESTILO } from "@/data/estandarBotones";

// Botón estándar: elige la intención viendo el UI Lab (/dev/ui-lab).
// El core visual (severity/variant/size/rounded) sale del catálogo y los
// colores/hover del tema. La vista aporta contenido (label/icon/title…).
// Excepción puntual: pasa severity/variant/size/rounded explícitos + deja
// un comentario <!-- desvía del estándar: motivo -->. En DEV se avisa.
const props = defineProps({
  intencion: { type: String, default: "primaria" },
  label: { type: String, default: undefined },
  icon: { type: String, default: undefined },
  iconPos: { type: String, default: undefined },
  severity: { type: String, default: undefined },
  variant: { type: String, default: undefined },
  size: { type: String, default: undefined },
  rounded: { type: Boolean, default: undefined },
  loading: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  title: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
});

const catalogo = computed(() => intencionPorSlug(props.intencion)?.props || {});

const resueltas = computed(() => {
  const base = { ...catalogo.value };
  if (props.label !== undefined) base.label = props.label;
  if (props.icon !== undefined) base.icon = props.icon;
  if (props.iconPos !== undefined) base.iconPos = props.iconPos;
  if (props.severity !== undefined) base.severity = props.severity;
  if (props.variant !== undefined) base.variant = props.variant;
  if (props.size !== undefined) base.size = props.size;
  if (props.rounded !== undefined) base.rounded = props.rounded;
  if (props.loading !== undefined) base.loading = props.loading;
  if (props.disabled !== undefined) base.disabled = props.disabled;
  if (props.title !== undefined) base.title = props.title;
  if (props.ariaLabel !== undefined) base["aria-label"] = props.ariaLabel;
  return base;
});

// Aviso DEV: desvío del core sin pasar por el catálogo.
if (import.meta.env.DEV) {
  const desvios = CLAVES_ESTILO.filter(
    (k) => props[k] !== undefined && props[k] !== catalogo.value[k],
  );
  if (desvios.length) {
    console.warn(
      `[estandar] AppButton intencion="${props.intencion}" sobrescribe ${desvios.join(", ")}. ` +
        "Si es intencional deja el motivo en comentario; si se repite, pide intención nueva.",
    );
  }
}

defineOptions({ inheritAttrs: false });

defineSlots();
const attrs = useAttrs();
</script>

<template>
  <Button v-bind="{ ...resueltas, ...attrs }">
    <slot />
  </Button>
</template>
