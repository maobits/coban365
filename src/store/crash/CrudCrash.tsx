import baseUrl from "../config/server"; // Importa la configuración del servidor

/**
 * Servicio para crear una nueva caja (cash).
 * Envía los datos al endpoint `create_cash.php` mediante una solicitud POST.
 *
 * @param {Object} cashData - Datos de la caja a registrar.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const createCash = async (cashData: {
  correspondent_id: number;
  cashier_id: number;
  capacity: number;
  state?: boolean; // Opcional: por defecto se considera true
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/create_cash.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cashData),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al crear caja:", error);
    throw error;
  }
};

/**
 * Servicio para obtener la lista de cajas (cash) registradas con detalles.
 * Llama al endpoint `list_cash.php` y devuelve los datos en formato JSON.
 *
 * @returns {Promise<any>} Una promesa que resuelve con la lista de cajas y sus detalles.
 */
export const getCash = async (): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/list_cash.php`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener la lista de cajas:", error);
    throw error;
  }
};

/**
 * Servicio para obtener la lista de cajas (cash) filtradas por corresponsal.
 * Llama al endpoint `list_cash.php?correspondent_id=ID` y devuelve los datos en formato JSON.
 *
 * @param {number} correspondentId - ID del corresponsal a consultar
 * @returns {Promise<any>} Una promesa que resuelve con la lista de cajas del corresponsal
 */
export const getCashByCorrespondent = async (
  correspondentId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/list_cash.php?correspondent_id=${correspondentId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener las cajas del corresponsal:", error);
    throw error;
  }
};

/**
 * Servicio para eliminar una caja (cash) del sistema.
 * Envía una solicitud POST al servidor con el ID de la caja a eliminar.
 *
 * @param {number} cashId - ID de la caja a eliminar.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const deleteCash = async (cashId: number): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/delete_cash.php`;

    console.log("📤 Eliminando caja ID:", cashId);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: cashId }),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al eliminar la caja:", error);
    throw error;
  }
};

/**
 * Servicio para actualizar los datos de una caja (cash).
 * Envía los nuevos datos al servidor mediante una solicitud POST.
 *
 * @param {Object} cashData - Objeto con los datos de la caja a actualizar.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const updateCash = async (cashData: {
  id: number;
  correspondent_id: number;
  cashier_id: number;
  capacity: number;
  state: number; // 1 para activo, 0 para inactivo
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/update_cash.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cashData),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar la caja:", error);
    throw error;
  }
};

/**
 * Servicio para actualizar el estado de una caja (activa o inactiva).
 * Envía una solicitud POST con el ID de la caja y el nuevo estado lógico.
 *
 * @param {number} id - ID de la caja.
 * @param {number} state - Nuevo estado (1 = activo, 0 = inactivo).
 * @returns {Promise<any>} Promesa con la respuesta del servidor.
 */
export const updateCashState = async (
  id: number,
  state: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/update_cash_state.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, state }),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar estado de la caja:", error);
    throw error;
  }
};

/**
 * Servicio para obtener todos los usuarios cuyo rol sea 'cajero'.
 * Realiza una solicitud GET al endpoint correspondiente.
 *
 * @returns {Promise<any>} Promesa que resuelve con la lista de cajeros.
 */
export const getCashiers = async (): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/list_cashiers.php`; // Ajusta el nombre del archivo si es diferente

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener la lista de cajeros:", error);
    throw error;
  }
};
