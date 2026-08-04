import { ref } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { personalService } from "../services/personalService";
import { mensajeError } from "@/utils/errores";

export function usePersonal() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const error = ref(null);

  const personalQuery = useQuery({
    queryKey: ["personal", auth.condominioActualId],
    queryFn: async () => {
      const cid = auth.condominioActualId;
      if (!cid) return [];
      const { data } = await personalService.listar(cid);
      return data;
    },
    enabled: !!auth.condominioActualId,
  });

  const asignarRolMutation = useMutation({
    mutationFn: async ({ usuarioId, rolId }) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("selecciona un condominio");
      const { data } = await personalService.asignarRol(cid, { usuarioId, rolId });
      return data;
    },
    onMutate: async ({ usuarioId, rolId }) => {
      await queryClient.cancelQueries({ queryKey: ["personal", auth.condominioActualId] });
      const previousData = queryClient.getQueryData(["personal", auth.condominioActualId]);
      queryClient.setQueryData(["personal", auth.condominioActualId], (old) => {
        if (!old) return old;
        return old.map((p) =>
          p.usuarioId === usuarioId ? { ...p, rolEnCondominio: String(rolId), activo: true } : p,
        );
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["personal", auth.condominioActualId], context.previousData);
      }
      console.error("Error al asignar rol:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["personal", auth.condominioActualId] });
    },
  });

  const revocarMutation = useMutation({
    mutationFn: async (usuarioId) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("selecciona un condominio");
      await personalService.revocarAcceso(cid, usuarioId);
    },
    onMutate: async (usuarioId) => {
      await queryClient.cancelQueries({ queryKey: ["personal", auth.condominioActualId] });
      const previousData = queryClient.getQueryData(["personal", auth.condominioActualId]);
      queryClient.setQueryData(["personal", auth.condominioActualId], (old) => {
        if (!old) return old;
        return old.map((p) =>
          p.usuarioId === usuarioId ? { ...p, activo: false } : p,
        );
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["personal", auth.condominioActualId], context.previousData);
      }
      console.error("Error al revocar acceso:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["personal", auth.condominioActualId] });
    },
  });

  async function asignarRol(usuarioId, rolId) {
    try {
      await asignarRolMutation.mutateAsync({ usuarioId, rolId });
      return true;
    } catch (e) {
      error.value = mensajeError(e, "Error al asignar rol");
      return false;
    }
  }

  async function revocar(usuarioId) {
    try {
      await revocarMutation.mutateAsync(usuarioId);
      return true;
    } catch (e) {
      error.value = mensajeError(e, "Error al revocar acceso");
      return false;
    }
  }

  return {
    personal: personalQuery.data,
    loading: personalQuery.isLoading,
    error,
    asignarRol,
    revocar,
  };
}
