import { ref, watch } from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";

export function useCondominioSelector() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const selectedCondominioId = ref(auth.condominioActualId || "");

  watch(
    () => auth.condominioActualId,
    (id) => {
      selectedCondominioId.value = id || "";
    },
  );

  function onCondominioChange() {
    if (!selectedCondominioId.value) return;
    auth.seleccionarCondominio(selectedCondominioId.value);
    queryClient.invalidateQueries();
  }

  return { selectedCondominioId, onCondominioChange };
}