<script setup>
import { ref, computed } from "vue";
import Card from "primevue/card";
import Tag from "primevue/tag";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import SelectButton from "primevue/selectbutton";
import Stepper from "primevue/stepper";
import StepList from "primevue/steplist";
import Step from "primevue/step";
import StepPanels from "primevue/steppanels";
import StepPanel from "primevue/steppanel";
import Accordion from "primevue/accordion";
import AccordionPanel from "primevue/accordionpanel";
import AccordionHeader from "primevue/accordionheader";
import AccordionContent from "primevue/accordioncontent";
import iconos from "./datosIconos.json";

// Disponible pero NO aplicado: referencia para reusar con el mismo estándar.
// Si algo de aquí entra a una vista, se agrega al catálogo
// (src/data/estandarBotones.js) y pasa a "Estándar propuesto".
// Cada icono: { cls: "pi-trash" (clase completa), nombre: "trash" }.

// Sinónimos en español para lo más buscado (el resto se busca en inglés).
const SINONIMOS = {
  eliminar: "trash",
  borrar: "trash",
  basura: "trash",
  ojo: "eye",
  ver: "eye",
  buscar: "search",
  lupa: "search",
  guardar: "save",
  editar: "pencil",
  lapiz: "pencil",
  agregar: "plus",
  mas: "plus",
  cerrar: "times",
  equis: "times",
  casa: "home",
  usuario: "user",
  usuarios: "users",
  salir: "sign-out",
  entrar: "sign-in",
  coche: "car",
  auto: "car",
  correo: "envelope",
  carta: "envelope",
  campana: "bell",
  candado: "lock",
  engranaje: "cog",
  ajustes: "cog",
  calendario: "calendar",
  reloj: "clock",
  dinero: "money-bill",
  dolar: "dollar",
  check: "check",
  visto: "check",
  cruz: "times",
  flecha: "arrow",
  subir: "upload",
  bajar: "download",
  descargar: "download",
  imprimir: "print",
  filtro: "filter",
  lista: "list",
  tabla: "table",
  mapa: "map",
  imagen: "image",
  foto: "camera",
  llave: "key",
  estrella: "star",
  corazon: "heart",
  marca: "bookmark",
};

const busqueda = ref("");
const copiado = ref("");

const filtrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase();
  const terminos = [q, SINONIMOS[q]].filter(Boolean);
  if (!q) return iconos.slice(0, 60);
  return iconos
    .filter((i) => terminos.some((t) => i.nombre.includes(t) || i.cls.includes(t)))
    .slice(0, 60);
});

async function copiar(icono) {
  const clase = `pi ${icono.cls}`;
  try {
    await navigator.clipboard.writeText(clase);
    copiado.value = icono.cls;
    setTimeout(() => {
      if (copiado.value === icono.cls) copiado.value = "";
    }, 1500);
  } catch (error) {
    console.error("[ui-lab] no se pudo copiar", error);
  }
}

const modoFiltro = ref("lista");
const modosFiltro = [
  { label: "Lista", value: "lista" },
  { label: "Tabla", value: "tabla" },
];
const paso = ref("1");
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="text-sm text-text-muted m-0">
      Disponible pero no aplicado en el proyecto. ¿Lo usaste en una vista?
      Agrégalo al catálogo (<code>src/data/estandarBotones.js</code>) y aparecerá en "Estándar propuesto".
    </p>

    <!-- Iconos primeicons con buscador -->
    <Card id="disponible-iconos" class="scroll-mt-24">
      <template #title>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-base font-bold">Iconos ({{ iconos.length }})</span>
          <Tag value="clic para copiar" severity="secondary" />
        </div>
      </template>
      <template #content>
        <InputText
          v-model="busqueda"
          placeholder="Buscar icono… (p. ej. eliminar, trash, ojo, eye)"
          fluid
          class="mb-2"
        />
        <p class="text-xs text-text-muted m-0 mb-2">
          {{ filtrados.length }} visibles · uso: <code>&lt;Button icon="pi pi-trash" … /&gt;</code>
        </p>
        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2">
          <button
            v-for="icono in filtrados"
            :key="icono.cls"
            type="button"
            :title="`pi ${icono.cls}`"
            class="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:bg-emphasis cursor-pointer bg-transparent"
            @click="copiar(icono)"
          >
            <i :class="`pi ${icono.cls} text-lg`" />
            <span class="text-[10px] break-all leading-tight text-center">{{ icono.nombre }}</span>
            <span v-if="copiado === icono.cls" class="text-[10px] font-bold text-success">¡copiado!</span>
          </button>
        </div>
      </template>
    </Card>

    <!-- Variantes de botón fuera del estándar -->
    <Card>
      <template #title>
        <span class="text-base font-bold">Variantes fuera del estándar</span>
      </template>
      <template #content>
        <div class="flex flex-wrap items-center gap-2">
          <Button label="Ayuda" severity="help" />
          <Button label="Contraste" severity="contrast" />
          <Button label="Elevado" raised />
          <span class="text-xs text-text-muted">Muestras tal cual las pinta el preset; no usar sin pasar por el catálogo.</span>
        </div>
      </template>
    </Card>

    <!-- Candidatos propuestos (FASE2 duda 9), aún no aplicados -->
    <Card>
      <template #title>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-base font-bold">Candidatos (aún no aplicados)</span>
          <Tag value="FASE2 duda 9" severity="info" />
        </div>
      </template>
      <template #content>
        <div class="flex flex-col gap-4">
          <div>
            <p class="text-xs text-text-muted m-0 mb-1">SelectButton — filtros segmentados y selector de modo</p>
            <SelectButton v-model="modoFiltro" :options="modosFiltro" optionLabel="label" optionValue="value" size="small" />
          </div>
          <div>
            <p class="text-xs text-text-muted m-0 mb-1">Stepper — wizard por pasos</p>
            <Stepper value="1">
              <StepList>
                <Step value="1">Uno</Step>
                <Step value="2">Dos</Step>
              </StepList>
              <StepPanels>
                <StepPanel value="1"><p class="m-0 text-sm">Contenido paso uno.</p></StepPanel>
                <StepPanel value="2"><p class="m-0 text-sm">Contenido paso dos.</p></StepPanel>
              </StepPanels>
            </Stepper>
          </div>
          <div>
            <p class="text-xs text-text-muted m-0 mb-1">Accordion — cabeceras colapsables</p>
            <Accordion value="0">
              <AccordionPanel value="0">
                <AccordionHeader>Sección ejemplo</AccordionHeader>
                <AccordionContent><p class="m-0 text-sm">Contenido colapsable.</p></AccordionContent>
              </AccordionPanel>
            </Accordion>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
