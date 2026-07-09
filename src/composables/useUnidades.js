import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";

export function useUnidades() {
  const auth = useAuthStore();

  const { data: unidades, isLoading: loading } = useQuery({
    queryKey: ["unidades", auth.condominioActualId],
    queryFn: async () => {
      const cid = auth.condominioActualId;
      if (!cid) return [];
      const { data } = await unidadesService.getUnidades(cid);
      return data;
    },
    enabled: !!auth.condominioActualId,
  });

  return { unidades, cargarUnidades: () => {} };
}