import api from "./api";

const MOCK_ENCOMIENDAS = [
  {
    id: "1",
    unidadNumero: "1",
    receptorNombre: "Juan Pérez",
    estado: "PENDIENTE",
    descripcion: "Caja mediana — Amazon",
    fechaRecepcion: new Date().toISOString(),
    fechaEntrega: null,
  },
  {
    id: "2",
    unidadNumero: "2",
    receptorNombre: "María González",
    estado: "ENTREGADA",
    descripcion: "Sobre — Correos Chile",
    fechaRecepcion: new Date(Date.now() - 86400000).toISOString(),
    fechaEntrega: new Date().toISOString(),
  },
];

export const encomiendасService = {
  async getEncomiendas(filtros = {}) {
    try {
      return await api.get("/encomiendas", { params: filtros });
    } catch {
      return { data: MOCK_ENCOMIENDAS };
    }
  },

  async getEncomienda(id) {
    try {
      return await api.get(`/encomiendas/${id}`);
    } catch {
      return { data: MOCK_ENCOMIENDAS.find((e) => e.id === id) };
    }
  },

  async registrar(data) {
    try {
      return await api.post("/encomiendas", data);
    } catch {
      return {
        data: {
          ...data,
          id: Date.now().toString(),
          estado: "PENDIENTE",
          fechaRecepcion: new Date().toISOString(),
        },
      };
    }
  },

  async entregar(id) {
    try {
      return await api.post(`/encomiendas/${id}/entregar`);
    } catch {
      return {
        data: {
          id,
          estado: "ENTREGADA",
          fechaEntrega: new Date().toISOString(),
        },
      };
    }
  },

  async getMisEncomiendas() {
    try {
      return await api.get("/me/encomiendas");
    } catch {
      return { data: MOCK_ENCOMIENDAS.filter((e) => e.estado === "PENDIENTE") };
    }
  },
};
