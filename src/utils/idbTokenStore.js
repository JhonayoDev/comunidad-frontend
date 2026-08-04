/**
 * idbTokenStore.js
 *
 * Almacén compartido del access token en IndexedDB.
 *
 * El Service Worker no tiene acceso a localStorage, por lo que el access
 * token se guarda aquí para que el SW pueda usarlo (ej. pushsubscriptionchange).
 *
 * Consumidores:
 * - pushManager.js   → guarda el token al inicializar y lo limpia al destruir.
 * - refreshCoordinator.js → lo refresca en CADA rotación para que el SW nunca
 *   trabaje con un token expirado.
 *
 * Toda la comunicación con IndexedDB pasa por obtenerDB(), un helper singleton
 * que garantiza:
 * - Una sola apertura concurrente (deduplica llamadas paralelas).
 * - Creación automática del store 'tokens' via onupgradeneeded.
 * - Auto-reparación: si el store no existe pese al upgrade, fuerza versión+1.
 */

const IDB_NAME = "Briku-auth";
const IDB_VERSION = 2;
const IDB_STORE = "tokens";

let _dbOpenPromise = null;

async function obtenerDB() {
  if (_dbOpenPromise) return _dbOpenPromise;
  _dbOpenPromise = abrirDB(IDB_VERSION);
  return _dbOpenPromise;
}

async function abrirDB(version) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, version);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };

    req.onerror = () => {
      _dbOpenPromise = null;
      reject(req.error);
    };

    req.onsuccess = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const nextVersion = db.version + 1;
        db.close();
        resolve(abrirDB(nextVersion));
        return;
      }

      db.onclose = () => {
        _dbOpenPromise = null;
      };
      db.onversionchange = () => {
        db.close();
        _dbOpenPromise = null;
      };

      resolve(db);
    };
  });
}

export async function guardarTokenEnIDB(token) {
  const db = await obtenerDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.put(token, "accessToken");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function limpiarTokenEnIDB() {
  try {
    const db = await obtenerDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.delete("accessToken");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Limpieza best-effort — no debe romper el flujo de logout
  }
}

export async function leerTokenDeIDB() {
  try {
    const db = await obtenerDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const get = store.get("accessToken");
      get.onsuccess = () => resolve(get.result ?? null);
      get.onerror = () => reject(get.error);
    });
  } catch {
    return null;
  }
}
