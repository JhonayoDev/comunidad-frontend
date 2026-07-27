import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { almacenamientoService } from "@/services/almacenamientoService";
import { useAuthStore } from "@/stores/authStore";

export function useConfiguracionAlmacenamiento() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const cid = auth.condominioActualId;

  const query = useQuery({
    queryKey: ["configuracion-almacenamiento", cid],
    queryFn: () => almacenamientoService.obtener(cid).then((r) => r.data),
    enabled: !!cid,
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      almacenamientoService.guardar(cid, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["configuracion-almacenamiento", cid],
      });
    },
    onError: (error) => {
      console.error("Error al guardar configuración de almacenamiento", error);
    },
  });

  return { query, mutation };
}
