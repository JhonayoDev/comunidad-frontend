import { ref } from "vue";
import { personasService } from "@/services/personasService";

/**
 * Búsqueda de personas por email y alta "crear o reutilizar".
 *
 * El listado de personas del condominio solo devuelve personas con vínculo
 * activo o cargo, así que una persona creada sin vincular queda invisible.
 * Este composable permite recuperarla por email (`GET /personas/buscar`) y
 * reutilizarla cuando el alta responde 409 (email/RUT ya registrado).
 *
 * Se inyecta `service` para poder testear sin red.
 */
export function useBusquedaPersona({ service = personasService } = {}) {
  const buscando = ref(false);
  const persona = ref(null);
  const consultado = ref(false);
  const noEncontrada = ref(false);
  const error = ref(null);

  let tokenBusqueda = 0;

  function limpiar() {
    tokenBusqueda += 1;
    buscando.value = false;
    persona.value = null;
    consultado.value = false;
    noEncontrada.value = false;
    error.value = null;
  }

  /**
   * Busca por email. Devuelve la persona, o `null` si no existe/no se pudo
   * consultar. El estado queda expuesto en `persona`, `noEncontrada` y `error`.
   */
  async function buscarPorEmail(cid, email) {
    const token = ++tokenBusqueda;
    buscando.value = true;
    persona.value = null;
    consultado.value = false;
    noEncontrada.value = false;
    error.value = null;

    try {
      const { data } = await service.buscarPorEmail(cid, email);
      if (token !== tokenBusqueda) return null;
      persona.value = data || null;
      noEncontrada.value = !data;
      return persona.value;
    } catch (e) {
      if (token !== tokenBusqueda) return null;
      if (e?.response?.status === 404) {
        noEncontrada.value = true;
        return null;
      }
      console.error("Error al buscar persona por email", e);
      error.value = e;
      return null;
    } finally {
      if (token === tokenBusqueda) {
        consultado.value = true;
        buscando.value = false;
      }
    }
  }

  /**
   * Crea la persona; si el backend responde 409 (email/RUT ya registrado)
   * intenta recuperar la existente por email en vez de dejar el alta huérfana.
   *
   * Devuelve `{ persona, reutilizada }`. Si el 409 no se puede resolver por
   * email, relanza el error original.
   */
  async function crearOReutilizar(cid, datos) {
    try {
      const { data } = await service.crear(cid, datos);
      return { persona: data, reutilizada: false };
    } catch (e) {
      if (e?.response?.status !== 409) throw e;
      const existente = await buscarPorEmail(cid, datos.email);
      if (!existente) throw e;
      return { persona: existente, reutilizada: true };
    }
  }

  return {
    buscando,
    persona,
    consultado,
    noEncontrada,
    error,
    limpiar,
    buscarPorEmail,
    crearOReutilizar,
  };
}
