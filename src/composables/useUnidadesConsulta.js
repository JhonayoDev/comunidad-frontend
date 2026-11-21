import { computed, reactive, ref } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";
import { estacionamientosService } from "@/services/estacionamientosService";
import { bodegasService } from "@/services/bodegasService";
import { espaciosService } from "@/services/espaciosService";
import { vehiculosService } from "@/services/vehiculosService";
import { personasService } from "@/services/personasService";
import { mensajeError } from "@/utils/errores";
import {
  admiteVehiculos,
  construirIndice,
  filtrarUnidades,
  recursosDeUnidad,
  resumenCondominio,
} from "@/utils/unidadesConsulta";

/**
 * Estado de la vista "Unidades" (consulta operativa).
 *
 * Estrategia de peticiones: 5 listados en paralelo al entrar (unidades,
 * estacionamientos, bodegas, áreas comunes y vehículos) que se indexan por
 * unidad; 1 petición por casa al expandirla (`/vinculos`) y caché en memoria.
 * Las mutaciones actualizan ese índice local sin recargar todo.
 */
export function useUnidadesConsulta() {
  const auth = useAuthStore();

  const cargando = ref(false);
  const errorCarga = ref(null);
  const advertencias = ref([]);
  const unidades = ref([]);
  const estacionamientos = ref([]);
  const bodegas = ref([]);
  const espacios = ref([]);
  const vehiculos = ref([]);

  const vinculosPorUnidad = reactive({});
  const cargandoVinculos = reactive({});
  const errorVinculos = reactive({});

  const indice = computed(() =>
    construirIndice({
      estacionamientos: estacionamientos.value,
      bodegas: bodegas.value,
      espacios: espacios.value,
      vehiculos: vehiculos.value,
    }),
  );

  const resumen = computed(() =>
    resumenCondominio({
      unidades: unidades.value,
      estacionamientos: estacionamientos.value,
      bodegas: bodegas.value,
      espacios: espacios.value,
    }),
  );

  const unidadCondominio = computed(
    () => unidades.value.find((u) => u.tipo === "CONDOMINIO") || null,
  );

  const recursosCondominio = computed(() =>
    unidadCondominio.value
      ? recursosDeUnidad(indice.value, unidadCondominio.value.id)
      : null,
  );

  const viviendas = computed(() => filtrarUnidades(unidades.value));

  // ─── Permisos (se ocultan acciones; no se amplían cargos) ───
  const puede = (codigo) => (auth.permisos || []).includes(codigo);
  const puedeVerVinculos = computed(() => puede("VINCULO_VER"));
  const puedeEditarPersona = computed(() => puede("PERSONA_EDITAR"));
  const puedeDesvincular = computed(() => puede("VINCULO_ELIMINAR"));
  const puedeQuitarPersona = computed(() => puede("PERSONA_ELIMINAR"));
  const puedeVerVehiculos = computed(() => puede("VEHICULO_VER"));
  const puedeCrearVehiculo = computed(() => puede("VEHICULO_CREAR"));
  const puedeEditarVehiculo = computed(() => puede("VEHICULO_EDITAR"));
  const puedeEliminarVehiculo = computed(() => puede("VEHICULO_ELIMINAR"));

  function cid() {
    return auth.condominioActualId;
  }

  async function cargar() {
    const id = cid();
    if (!id) {
      cargando.value = false;
      return;
    }
    cargando.value = true;
    errorCarga.value = null;
    advertencias.value = [];

    const peticiones = [
      {
        clave: "unidades",
        critica: true,
        ejecutar: () => unidadesService.getUnidades(id),
        asignar: (data) => {
          unidades.value = Array.isArray(data) ? data : [];
        },
      },
      {
        clave: "estacionamientos",
        ejecutar: () => estacionamientosService.getEstacionamientos(id),
        asignar: (data) => {
          estacionamientos.value = Array.isArray(data) ? data : [];
        },
      },
      {
        clave: "bodegas",
        ejecutar: () => bodegasService.getBodegas(id),
        asignar: (data) => {
          bodegas.value = Array.isArray(data) ? data : [];
        },
      },
      {
        clave: "espacios",
        ejecutar: () => espaciosService.getEspacios(id),
        asignar: (data) => {
          espacios.value = Array.isArray(data) ? data : [];
        },
      },
      {
        clave: "vehiculos",
        ejecutar: () => vehiculosService.listar(id),
        asignar: (data) => {
          vehiculos.value = Array.isArray(data) ? data : [];
        },
      },
    ];

    try {
      const resultados = await Promise.allSettled(
        peticiones.map((p) => p.ejecutar()),
      );

      resultados.forEach((resultado, i) => {
        const peticion = peticiones[i];
        if (resultado.status === "fulfilled") {
          peticion.asignar(resultado.value?.data);
          return;
        }
        console.error(`Error al cargar ${peticion.clave}`, resultado.reason);
        if (peticion.critica) {
          errorCarga.value = mensajeError(
            resultado.reason,
            "No se pudieron cargar las unidades",
          );
          return;
        }
        // Un 403/404 de un recurso auxiliar no rompe la consulta: la vista
        // sigue mostrando las casas y oculta la sección que no se pudo leer.
        advertencias.value = [
          ...advertencias.value,
          `No se pudo cargar ${peticion.clave}.`,
        ];
      });
    } catch (e) {
      console.error("Error inesperado al cargar la consulta de unidades", e);
      errorCarga.value = mensajeError(e, "No se pudieron cargar las unidades");
    } finally {
      cargando.value = false;
    }
  }

  // ─── Expansión de una casa (1 request, cacheado) ───────────
  async function cargarVinculos(unidadId, { forzar = false } = {}) {
    if (!unidadId) return [];
    if (!puedeVerVinculos.value) {
      vinculosPorUnidad[unidadId] = [];
      return [];
    }
    if (vinculosPorUnidad[unidadId] && !forzar) {
      return vinculosPorUnidad[unidadId];
    }

    cargandoVinculos[unidadId] = true;
    errorVinculos[unidadId] = null;
    try {
      const { data } = await personasService.vinculosUnidad(cid(), unidadId);
      vinculosPorUnidad[unidadId] = Array.isArray(data) ? data : [];
      return vinculosPorUnidad[unidadId];
    } catch (e) {
      console.error("Error al cargar vínculos de la unidad", e);
      errorVinculos[unidadId] = mensajeError(
        e,
        "No se pudieron cargar las personas de esta unidad",
      );
      vinculosPorUnidad[unidadId] = [];
      return [];
    } finally {
      cargandoVinculos[unidadId] = false;
    }
  }

  function vinculosDe(unidadId) {
    return vinculosPorUnidad[unidadId] || [];
  }

  // ─── Acciones sobre personas ───────────────────────────────
  async function obtenerPersona(personaId) {
    const { data } = await personasService.obtener(cid(), personaId);
    return data;
  }

  async function actualizarPersona(personaId, { nombre, telefono }) {
    const { data } = await personasService.actualizar(cid(), personaId, {
      nombre,
      telefono,
    });
    // Refresca el nombre en todas las unidades cacheadas donde aparece.
    for (const lista of Object.values(vinculosPorUnidad)) {
      for (const vinculo of lista) {
        if (vinculo.personaId === personaId) {
          vinculo.personaNombre = data?.nombre || nombre;
        }
      }
    }
    return data;
  }

  async function desvincularPersonaDeUnidad(vinculo) {
    await personasService.desactivarVinculo(cid(), vinculo.id);
    const lista = vinculosPorUnidad[vinculo.unidadId] || [];
    vinculosPorUnidad[vinculo.unidadId] = lista.filter(
      (v) => v.id !== vinculo.id,
    );
  }

  async function quitarPersonaDelCondominio(personaId, motivo = "") {
    const texto = String(motivo || "").trim();
    await personasService.desactivar(
      cid(),
      personaId,
      texto ? { motivo: texto } : {},
    );
    // La baja local desactiva todos los vínculos de la persona: se refleja en
    // la caché de todas las casas visitadas.
    for (const unidadId of Object.keys(vinculosPorUnidad)) {
      vinculosPorUnidad[unidadId] = vinculosPorUnidad[unidadId].filter(
        (v) => v.personaId !== personaId,
      );
    }
  }

  // ─── Acciones sobre vehículos ──────────────────────────────
  async function desvincularVehiculo(vehiculo) {
    await vehiculosService.desactivar(cid(), vehiculo.id);
    vehiculos.value = vehiculos.value.filter((v) => v.id !== vehiculo.id);
  }

  async function moverVehiculo(vehiculo, unidadId) {
    const { data } = await vehiculosService.actualizar(cid(), vehiculo.id, {
      tipo: vehiculo.tipo,
      unidadId,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      color: vehiculo.color,
    });
    vehiculos.value = vehiculos.value.map((v) =>
      v.id === vehiculo.id ? data : v,
    );
    return data;
  }

  async function crearVehiculo(payload) {
    const { data } = await vehiculosService.crear(cid(), payload);
    vehiculos.value = [...vehiculos.value, data];
    return data;
  }

  function vehiculosFueraDe(unidadId) {
    return vehiculos.value.filter(
      (v) => v.activo !== false && v.unidadId !== unidadId,
    );
  }

  function vehiculosDe(unidadId) {
    return vehiculos.value.filter(
      (v) => v.activo !== false && v.unidadId === unidadId,
    );
  }

  return {
    // estado
    cargando,
    errorCarga,
    advertencias,
    unidades,
    estacionamientos,
    bodegas,
    espacios,
    vehiculos,
    indice,
    resumen,
    unidadCondominio,
    recursosCondominio,
    viviendas,
    vinculosPorUnidad,
    cargandoVinculos,
    errorVinculos,
    // permisos
    puedeVerVinculos,
    puedeEditarPersona,
    puedeDesvincular,
    puedeQuitarPersona,
    puedeVerVehiculos,
    puedeCrearVehiculo,
    puedeEditarVehiculo,
    puedeEliminarVehiculo,
    // acciones
    cargar,
    cargarVinculos,
    vinculosDe,
    obtenerPersona,
    actualizarPersona,
    desvincularPersonaDeUnidad,
    quitarPersonaDelCondominio,
    desvincularVehiculo,
    moverVehiculo,
    crearVehiculo,
    vehiculosFueraDe,
    vehiculosDe,
    admiteVehiculos,
  };
}
