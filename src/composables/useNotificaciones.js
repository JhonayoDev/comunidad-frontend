import { computed } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { notificacionesService } from "../services/notificacionesService";
import { useNotificacionesTiempoReal } from "./useNotificacionesTiempoReal";

export function useNotificaciones() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();

  // SSE de la bandeja: con stream vivo NO hay polling (el SSE es la fuente
  // primaria del badge); si cae, gracia de 1 min y solo tras expirar, polling
  // de respaldo a 2 min. El SNAPSHOT_INICIAL siembra el badge y un
  // NOTIFICACION_CREADA lo descarta y deja que /sync se reconcilie.
  const { refetchIntervalNotificaciones, noLeidasNotificaciones } =
    useNotificacionesTiempoReal();

  const queryKey = computed(() => ["notificaciones", auth.condominioActualId]);

  const { data: notificaciones, isLoading: loading, error: queryError, refetch: cargar } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const cid = auth.condominioActualId;
      if (!cid) return [];
      const response = await notificacionesService.getTodas(cid);
      return response.data;
    },
    enabled: !!auth.condominioActualId,
  });

  const syncQueryKey = computed(() => ["notificaciones-sync", auth.condominioActualId]);

  const { data: syncData, isLoading: syncLoading, refetch: refreshSync } = useQuery({
    queryKey: syncQueryKey,
    queryFn: async () => {
      const cid = auth.condominioActualId;
      if (!cid) return { noLeidas: 0, notificaciones: [] };
      const response = await notificacionesService.getSync(cid);
      return response.data;
    },
    enabled: !!auth.condominioActualId,
    refetchInterval: refetchIntervalNotificaciones,
  });

  const noLeidasCount = computed(() => {
    // Seed del snapshot SSE mientras esté fresco; ante un cambio (el snapshot
    // se descarta) vuelve al valor real del sync ya reconciliado.
    if (noLeidasNotificaciones.value != null) return noLeidasNotificaciones.value;
    return syncData.value?.noLeidas || 0;
  });

  const syncNotificaciones = computed(() => syncData.value?.notificaciones || []);

  const hayNoLeidas = computed(() => noLeidasCount.value > 0);

  const error = computed(() => {
    if (queryError.value) return "Error al cargar notificaciones";
    return null;
  });

  const marcarLeidaMutation = useMutation({
    mutationFn: async (notif) => {
      const cid = auth.condominioActualId;
      if (!cid || notif.leido) return;
      await notificacionesService.marcarLeida(cid, notif.id);
      return notif;
    },
    onMutate: async (notif) => {
      await queryClient.cancelQueries({ queryKey: queryKey.value });
      queryClient.setQueryData(queryKey.value, (old) => {
        if (!old) return old;
        return old.map((n) =>
          n.id === notif.id ? { ...n, leido: true, fechaLectura: new Date().toISOString() } : n,
        );
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.value });
      queryClient.invalidateQueries({ queryKey: syncQueryKey.value });
    },
  });

  const marcarTodasMutation = useMutation({
    mutationFn: async () => {
      const cid = auth.condominioActualId;
      if (!cid) return;
      await notificacionesService.marcarTodasLeidas(cid);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKey.value });
      queryClient.setQueryData(queryKey.value, (old) => {
        if (!old) return old;
        return old.map((n) => ({ ...n, leido: true, fechaLectura: new Date().toISOString() }));
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.value });
      queryClient.invalidateQueries({ queryKey: syncQueryKey.value });
    },
  });

  function marcarLeida(notif) {
    marcarLeidaMutation.mutate(notif);
  }

  function marcarTodas() {
    marcarTodasMutation.mutate();
  }

  return {
    notificaciones,
    loading,
    error,
    hayNoLeidas,
    noLeidasCount,
    syncNotificaciones,
    syncLoading,
    cargar,
    refreshSync,
    marcarLeida,
    marcarTodas,
  };
}
