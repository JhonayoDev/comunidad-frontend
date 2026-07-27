import { useAuthStore } from "@/stores/authStore";

export const vPermiso = {
  mounted(el, binding) {
    const auth = useAuthStore();
    const required = binding.value;

    let hasPermission = false;
    if (typeof required === "string") {
      hasPermission = auth.permisos.includes(required);
    } else if (Array.isArray(required)) {
      hasPermission = required.some((p) => auth.permisos.includes(p));
    }

    if (!hasPermission) {
      el.remove();
    }
  },
};
