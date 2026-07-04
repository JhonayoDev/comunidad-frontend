import { ref } from "vue";

// El accessToken vive SOLO en memoria.
// Al recargar la página se pierde — el browser restaura la sesión
// automáticamente via la cookie httpOnly en /auth/refresh.
// El refreshToken nunca llega al JavaScript: el browser lo gestiona.
export const accessToken = ref(null);
