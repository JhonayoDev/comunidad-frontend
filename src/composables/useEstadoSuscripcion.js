import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { suscripcionService } from "@/services/suscripcionService";

// Estado de suscripción del condominio actual. Solo consulta para contactos de
// facturación (mismo criterio que ContactoFacturacionService del backend):
// rol ADMINISTRADOR global o cargo ADMINISTRADOR/PRESIDENTE/TESORERO activo.
// El 403 del backend es neutral: la UI simplemente no muestra avisos.
export function useEstadoSuscripcion() {
  const auth = useAuthStore();
  const condominioId = computed(() => auth.condominioActualId);
  const habilitado = computed(
    () => !!condominioId.value && auth.esContactoFacturacion,
  );

  const query = useQuery({
    queryKey: computed(() => ["suscripcion-estado", condominioId.value]),
    queryFn: async () => {
      const { data } = await suscripcionService.getEstado(condominioId.value);
      return data;
    },
    enabled: habilitado,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
    retry: (intentos, error) => {
      const status = error?.response?.status;
      if (status === 403 || status === 404) return false;
      return intentos < 2;
    },
  });

  const estado = computed(() => query.data.value || null);
  const avisos = computed(() => estado.value?.avisos || []);
  const avisoPrincipal = computed(() => avisos.value[0] || null);
  const suspendido = computed(
    () =>
      estado.value?.estado === "SUSPENDIDO" ||
      estado.value?.statusPago === "SUSPENDIDO",
  );
  const atrasado = computed(() => estado.value?.estado === "ATRASADO");
  const porVencer = computed(() =>
    avisos.value.some((a) => a.tipo === "POR_VENCER"),
  );
  const puedeLeer = computed(() => estado.value?.puedeLeer !== false);
  const puedeEscribir = computed(() => estado.value?.puedeEscribir !== false);
  const cargando = computed(
    () => habilitado.value && (query.isPending.value || query.isLoading.value),
  );
  const error = computed(() => query.error.value || null);
  const sinAcceso = computed(() => query.error.value?.response?.status === 403);

  return {
    estado,
    avisos,
    avisoPrincipal,
    suspendido,
    atrasado,
    porVencer,
    puedeLeer,
    puedeEscribir,
    cargando,
    error,
    sinAcceso,
    habilitado,
    recargar: query.refetch,
  };
}
