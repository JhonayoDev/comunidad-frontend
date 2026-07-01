import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";

export function useCondominioSelector() {
  const auth = useAuthStore();
  const selectedCondominioId = ref(auth.condominioActualId || "");

  // Si el condominio activo cambia desde otro lugar (ej. tras login),
  // el selector debe reflejarlo sin necesidad de recargar el componente.
  watch(
    () => auth.condominioActualId,
    (id) => {
      selectedCondominioId.value = id || "";
    },
  );

  function onCondominioChange() {
    if (!selectedCondominioId.value) return;
    auth.seleccionarCondominio(selectedCondominioId.value);
    // Recarga completa: hoy varias vistas cargan datos en onMounted
    // sin reaccionar a cambios de condominioId, así que es la forma
    // segura de refrescar todo. Se puede quitar el día que las vistas
    // reaccionen a auth.condominioActualId con un watcher.
    window.location.reload();
  }

  return { selectedCondominioId, onCondominioChange };
}
