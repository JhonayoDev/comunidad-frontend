import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useNavigation } from "@/composables/useNavigation";
import { BOTTOM_NAV_BY_ROLE } from "@/config/navegacionAccesoRapido";

export function useBottomNav() {
  const router = useRouter();
  const route = useRoute();
  const auth = useAuthStore();
  const { puedeAcceder, portalResidente } = useNavigation();

  const items = computed(() => {
    const rolesGlobales = auth.user?.roles || [];
    let rol = rolesGlobales.includes("SUPER_ADMIN")
      ? "SUPER_ADMIN"
      : auth.condominioActualRol || rolesGlobales[0] || "";
    // Un usuario con rol base RESIDENTE pero portal trabajador/proveedor no
    // debe ver la barra de residente.
    if (rol === "RESIDENTE") {
      const portal = portalResidente();
      if (portal === "TRABAJADOR" || portal === "PROVEEDOR") rol = portal;
    }
    const set = BOTTOM_NAV_BY_ROLE[rol] || [];
    return set.filter((item) => puedeAcceder(item.routeName));
  });

  const visible = computed(() => items.value.length > 0);

  function activo(item) {
    const resolved = router.resolve({ name: item.routeName });
    return (
      route.path === resolved.path || route.path.startsWith(resolved.path + "/")
    );
  }

  function go(item) {
    if (!puedeAcceder(item.routeName)) return;
    const target = { name: item.routeName };
    if (item.query) target.query = item.query;
    router.push(target);
  }

  return { items, visible, activo, go };
}
