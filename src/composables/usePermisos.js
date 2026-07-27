import { computed } from "vue";
import { useAuthStore } from "@/stores/authStore";

export function usePermisos() {
  const auth = useAuthStore();

  const permisosSet = computed(() => new Set(auth.permisos));

  function tienePermiso(codigo) {
    return permisosSet.value.has(codigo);
  }

  function tieneAlguno(permisos) {
    return permisos.some((p) => permisosSet.value.has(p));
  }

  function tieneTodos(permisos) {
    return permisos.every((p) => permisosSet.value.has(p));
  }

  return { tienePermiso, tieneAlguno, tieneTodos };
}
