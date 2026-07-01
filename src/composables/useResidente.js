import { ref } from "vue";

export function useResidente() {
  const dashboard = ref(null);
  const vinculos = ref([]);
  const vehiculos = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const gastoComun = ref({
    periodo: "—",
    deudaActual: 0,
    disponible: false,
  });

  // Ya no se usa directamente — ahora InicioView
  // llama a perfilService.getDashboardResidente(condominioId)

  return {
    dashboard,
    vinculos,
    vehiculos,
    gastoComun,
    loading,
    error,
  };
}
