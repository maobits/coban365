import { baseUrl } from "../config/server"; // Ruta base del servidor

/**
 * Servicio para registrar un nuevo cajero en el sistema.
 * Envía una solicitud POST al endpoint `create_cashier.php`.
 *
 * @param {Object} cashierData - Datos del cajero a crear.
 * @param {string} cashierData.email - Correo electrónico del cajero.
 * @param {string} cashierData.fullname - Nombre completo del cajero.
 * @param {string} cashierData.password - Contraseña del cajero.
 * @param {string} [cashierData.phone] - Número de teléfono (opcional).
 * @param {string} [cashierData.role] - Rol del usuario, por defecto "cajero".
 * @param {Array<number>} cashierData.correspondents - Array con los IDs de corresponsales asociados.
 * @returns {Promise<any>} Promesa con la respuesta del servidor.
 */
export const createCashier = async (cashierData: {
  email: string;
  fullname: string;
  password: string;
  phone?: string;
  role?: string; // por defecto será "cajero"
  correspondents: number[];
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/cashier/create_cashier.php`;

    // Definir valores por defecto
    const dataToSend = {
      ...cashierData,
      role: cashierData.role || "cajero", // por defecto cajero
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al crear cajero:", error);
    throw error;
  }
};

/**
 * Servicio para eliminar un cajero del sistema.
 * Envía una solicitud POST al endpoint `delete_cashier.php`.
 *
 * @param {number} id - ID del cajero a eliminar.
 * @returns {Promise<any>} Promesa con la respuesta del servidor.
 */
export const deleteCashier = async (id: number): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/cashier/delete_cashier.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al eliminar cajero:", error);
    throw error;
  }
};

/**
 * Servicio para obtener cajeros filtrados por el ID de un corresponsal.
 * Llama al endpoint `list_cashier.php?correspondent_id=ID`.
 *
 * @param {number} correspondentId - ID del corresponsal.
 * @returns {Promise<any>} Una promesa que resuelve con la lista de cajeros asociados.
 */
export const getCashiersByCorrespondent = async (
  correspondentId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/cashier/list_cashiers.php?correspondent_id=${correspondentId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener cajeros por corresponsal:", error);
    throw error;
  }
};

/**
 * Servicio para actualizar un cajero.
 * Envía datos al endpoint `update_cashier.php`.
 */
export const updateCashier = async (cashierData: {
  id: number;
  fullname: string;
  phone?: string;
  password?: string;
  permissions?: string[];
  correspondents: number[];
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/cashier/update_cashier.php`;

    console.log("📤 Enviando datos para actualizar cajero:");
    console.log(
      "📤 JSON que se enviará:",
      JSON.stringify(cashierData, null, 2)
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cashierData),
    });

    console.log("📡 Esperando respuesta del servidor...");

    if (!response.ok) {
      console.error("❌ Error HTTP:", response.status, response.statusText);
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const result = await response.json();

    console.log("✅ Respuesta del servidor:", result);
    return result;
  } catch (error) {
    console.error("❌ Error al actualizar el cajero:", error);
    throw error;
  }
};

/**
 * Servicio para actualizar el estado de un cajero (activo/inactivo).
 * Envía una solicitud POST al endpoint `update_cashier_state.php`.
 *
 * @param {number} id - ID del cajero.
 * @param {number} status - Nuevo estado (1 = activo, 0 = inactivo).
 * @returns {Promise<any>} Promesa con la respuesta del servidor.
 */
export const updateCashierState = async (
  id: number,
  status: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/cash/cashier/update_cashier_state.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar estado del cajero:", error);
    throw error;
  }
};
