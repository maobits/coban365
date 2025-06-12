import { baseUrl } from "../config/server";

/**
 * Servicio para listar los terceros (others) asociados a un corresponsal específico.
 * Llama al endpoint `list_other_correspondent_id.php` con el ID del corresponsal.
 *
 * @param {number} correspondentId - ID del corresponsal
 * @returns {Promise<any>} Lista de terceros asociados
 */
export const listOthersByCorrespondent = async (
  correspondentId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/other/list_other_correspondent_id.php?correspondent_id=${correspondentId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al obtener los terceros:", error);
    throw error;
  }
};

/**
 * Servicio para crear un nuevo tercero (other).
 *
 * @param {Object} otherData - Datos del tercero
 * @returns {Promise<any>} Respuesta del servidor
 */
export const createOther = async (otherData: {
  correspondent_id: number;
  name: string;
  credit: number;
  state?: number; // opcional
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/other/create_other.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(otherData),
    });

    if (!response.ok) {
      throw new Error(`Error al crear el tercero: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al crear tercero:", error);
    throw error;
  }
};

/**
 * Servicio para actualizar un tercero existente.
 *
 * @param {Object} otherData - Datos del tercero
 * @returns {Promise<any>} Respuesta del servidor
 */
export const updateOther = async (otherData: {
  id: number;
  correspondent_id: number;
  name: string;
  credit: number;
  state: number;
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/other/update_other.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(otherData),
    });

    if (!response.ok) {
      throw new Error(`Error al actualizar tercero: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al actualizar tercero:", error);
    throw error;
  }
};

/**
 * Servicio para eliminar un tercero por ID.
 *
 * @param {number} id - ID del tercero a eliminar
 * @returns {Promise<any>} Respuesta del servidor
 */
export const deleteOther = async (id: number): Promise<any> => {
  try {
    const url = `${baseUrl}/api/other/delete_other.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(`Error al eliminar tercero: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al eliminar tercero:", error);
    throw error;
  }
};

/**
 * Servicio para actualizar el estado (activo/inactivo) de un tercero.
 *
 * @param {number} id - ID del tercero
 * @param {number} state - Nuevo estado lógico (1 o 0)
 * @returns {Promise<any>} Respuesta del servidor
 */
export const updateOtherState = async (
  id: number,
  state: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/other/update_other_state.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, state }),
    });

    if (!response.ok) {
      throw new Error(`Error al actualizar estado: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al actualizar estado del tercero:", error);
    throw error;
  }
};

/**
 * Servicio para listar los terceros (others) asociados a un corresponsal específico
 * con su balance financiero (calculado desde account_statement_others).
 * Llama al endpoint `other_account_statement.php`.
 *
 * @param {number} correspondentId - ID del corresponsal
 * @returns {Promise<any>} Lista de terceros con su balance
 */
export const listOtherAccountStatement = async (
  correspondentId: number
): Promise<any> => {
  if (!correspondentId || correspondentId <= 0) {
    throw new Error("ID del corresponsal inválido.");
  }

  try {
    const url = `${baseUrl}/api/other/utils/other_account_statement.php?correspondent_id=${correspondentId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "Error desconocido al obtener la información."
      );
    }

    return data.data;
  } catch (error) {
    console.error("❌ Error al obtener estados de cuenta de terceros:", error);
    throw error;
  }
};
