<template>
  <div class="p-4">
    <div class="card bg-base-100 shadow mb-4">
      <div class="card-body p-4">
        <p class="text-sm text-base-content/60">Sesión iniciada como</p>
        <p class="font-bold">{{ auth.user?.email }}</p>
        <p class="badge badge-primary badge-sm">{{ auth.userRole }}</p>
      </div>
    </div>

    <ul class="menu bg-base-100 rounded-box shadow">
      <li>
        <a @click="handleLogout" class="text-error">
          <span>🚪</span>
          Cerrar sesión
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";

const router = useRouter();
const auth = useAuthStore();

async function handleLogout() {
  await auth.logout();
  router.push({ name: "Login" });
}
</script>
