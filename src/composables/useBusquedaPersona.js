import { ref } from "vue";
import { personasService } from "@/services/personasService";

/**
 * Búsqueda global de personas por email o RUT.
 *
 * El backend (V85) devuelve la identidad global junto con sus membresías en
 * todos los condominios. Eso permite resolver el alta sin crear personas
 * huérfanas: si la persona ya existe, la UI reutiliza su `personaId` y solo
 * agrega la asociación en el condominio actual.
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
   * Busca por email o RUT. Devuelve la persona o `null` si no existe/no se
   * pudo consultar. El estado queda expuesto en `persona`, `noEncontrada` y
   * `error`.
   */
  async function buscar(cid, { email, rut } = {}) {
    const token = ++tokenBusqueda;
    buscando.value = true;
    persona.value = null;
    consultado.value = false;
    noEncontrada.value = false;
    error.value = null;

    const params = {};
    if (email) params.email = email;
    if (rut) params.rut = rut;

    try {
      const { data } = await service.buscar(cid, params);
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
      console.error("Error al buscar persona", e);
      error.value = e;
      return null;
    } finally {
      if (token === tokenBusqueda) {
        consultado.value = true;
        buscando.value = false;
      }
    }
  }

  function buscarPorEmail(cid, email) {
    return buscar(cid, { email });
  }

  function buscarPorRut(cid, rut) {
    return buscar(cid, { rut });
  }

  return {
    buscando,
    persona,
    consultado,
    noEncontrada,
    error,
    limpiar,
    buscar,
    buscarPorEmail,
    buscarPorRut,
  };
}
