import baseUrl from "../config/server"; // Importa la configuración del servidor

/**
 * Servicio para crear una nueva tarifa (rate).
 * Envía los datos al endpoint `create_rate.php` mediante una solicitud POST.
 *
 * @param {Object} rateData - Datos de la tarifa a registrar.
 * @param {number} rateData.transaction_type_id - ID del tipo de transacción.
 * @param {number} rateData.price - Precio asignado a la tarifa.
 * @param {number} rateData.correspondent_id - ID del corresponsal asociado.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const createRate = async (rateData: {
  transaction_type_id: number;
  price: number;
  correspondent_id: number;
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/rates/create_rate.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rateData),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al crear tarifa:", error);
    throw error;
  }
};

/**
 * Servicio para obtener las tarifas (rates) por corresponsal.
 * Consulta el endpoint `list_rates_correspondent_id.php?correspondent_id=ID`.
 *
 * @param {number} correspondentId - ID del corresponsal a consultar.
 * @returns {Promise<any>} Una promesa que resuelve con la lista de tarifas.
 */
export const listRatesByCorrespondent = async (
  correspondentId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/rates/list_rates_correspondent_id.php?correspondent_id=${correspondentId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener tarifas por corresponsal:", error);
    throw error;
  }
};

/**
 * Servicio para actualizar una tarifa existente.
 * Envía los datos al endpoint `update_rate.php` mediante una solicitud POST.
 *
 * @param {Object} rateData - Datos actualizados de la tarifa.
 * @param {number} rateData.id - ID de la tarifa.
 * @param {number} rateData.transaction_type_id - ID del tipo de transacción.
 * @param {number} rateData.correspondent_id - ID del corresponsal.
 * @param {number} rateData.price - Precio de la tarifa.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const updateRate = async (rateData: {
  id: number;
  transaction_type_id: number;
  correspondent_id: number;
  price: number;
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/rates/update_rate.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rateData),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar la tarifa:", error);
    throw error;
  }
};

/**
 * Servicio para eliminar una tarifa por su ID.
 * Envía una solicitud POST al endpoint `delete_rate.php`.
 *
 * @param {number} rateId - ID de la tarifa a eliminar.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const deleteRate = async (rateId: number): Promise<any> => {
  try {
    const url = `${baseUrl}/api/rates/delete_rate.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: rateId }),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al eliminar la tarifa:", error);
    throw error;
  }
};
