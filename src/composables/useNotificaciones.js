import { computed } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { notificacionesService } from "../services/notificacionesService";

export function useNotificaciones() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();

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

  const hayNoLeidas = computed(() =>
    (notificaciones.value || []).some((n) => !n.leida),
  );

  const error = computed(() => {
    if (queryError.value) return "Error al cargar notificaciones";
    return null;
  });

  const marcarLeidaMutation = useMutation({
    mutationFn: async (notif) => {
      const cid = auth.condominioActualId;
      if (!cid || notif.leida) return;
      await notificacionesService.marcarLeida(cid, notif.id);
      return notif;
    },
    onMutate: async (notif) => {
      await queryClient.cancelQueries({ queryKey: queryKey.value });
      queryClient.setQueryData(queryKey.value, (old) => {
        if (!old) return old;
        return old.map((n) =>
          n.id === notif.id ? { ...n, leida: true, fechaLectura: new Date().toISOString() } : n,
        );
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.value });
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
        return old.map((n) => ({ ...n, leida: true, fechaLectura: new Date().toISOString() }));
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.value });
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
    cargar,
    marcarLeida,
    marcarTodas,
  };
}