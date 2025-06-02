import baseUrl from "../config/server"; // Importa la configuración del servidor

/**
 * Servicio para obtener los tipos de corresponsales.
 * Llama al endpoint `types_correspondent.php` y devuelve los datos en formato JSON.
 *
 * @returns {Promise<any>} Una promesa que resuelve con los tipos de corresponsales.
 */
export const getTypesCorrespondent = async (): Promise<any> => {
  try {
    // Construye la URL del endpoint
    const url = `${baseUrl}/api/correspondent/types_correspondent.php`;

    // Realiza la solicitud GET
    const response = await fetch(url);

    // Verifica que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    // Convierte la respuesta a JSON y la devuelve
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener los tipos de corresponsales:", error);
    throw error;
  }
};

/**
 * Servicio para crear un nuevo corresponsal.
 * Envía los datos al endpoint `create_correspondent.php` mediante una solicitud POST.
 *
 * @param {Object} correspondentData - Datos del corresponsal a registrar.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
/**
 * Servicio para crear un nuevo corresponsal.
 * Envía los datos al endpoint `create_correspondent.php` mediante una solicitud POST.
 *
 * @param {Object} correspondentData - Datos del corresponsal a registrar.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const createCorrespondent = async (correspondentData: {
  type_id: number;
  code: string;
  operator_id: number;
  name: string;
  location: { departamento: string; ciudad: string };
  transactions: { id: number; name: string }[]; // ⬅️ Nuevo campo
  credit_limit: number; // ✅ Añade esta línea
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/correspondent/create_correspondent.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(correspondentData),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al crear corresponsal:", error);
    throw error;
  }
};

/**
 * Servicio para obtener la lista de corresponsales con detalles completos.
 * Llama al endpoint `list_correspondent.php` y devuelve los datos en formato JSON.
 *
 * @returns {Promise<any>} Una promesa que resuelve con la lista de corresponsales y sus detalles.
 */
export const getCorrespondents = async (): Promise<any> => {
  try {
    // Construye la URL del endpoint
    const url = `${baseUrl}/api/correspondent/list_correspondent.php`;

    // Realiza la solicitud GET
    const response = await fetch(url);

    // Verifica que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    // Convierte la respuesta en JSON y la devuelve
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener la lista de corresponsales:", error);
    throw error;
  }
};

/**
 * Servicio para eliminar un corresponsal en el sistema.
 * Envía una solicitud al servidor para eliminar el corresponsal por su ID.
 *
 * @param {number} correspondentId - ID del corresponsal a eliminar.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const deleteCorrespondent = async (
  correspondentId: number
): Promise<any> => {
  try {
    // Construye la URL del endpoint
    const url = `${baseUrl}/api/correspondent/delete_correspondent.php`;

    // Muestra en consola la URL y los datos enviados (para depuración)
    console.log("URL de eliminación:", url);
    console.log("ID a eliminar:", correspondentId);

    // Realiza la solicitud HTTP al endpoint con el método POST
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Indica que el contenido es JSON
      },
      body: JSON.stringify({ id: correspondentId }),
    });

    // Verifica que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    // Convierte la respuesta en formato JSON
    const data = await response.json();

    // Retorna la respuesta del servidor
    return data;
  } catch (error) {
    // Manejo de errores: se imprime en la consola y se relanza
    console.error("Error al eliminar el corresponsal:", error);
    throw error;
  }
};

/**
 * Servicio para actualizar un corresponsal en el sistema.
 * Realiza una solicitud al servidor para modificar los datos de un corresponsal existente.
 *
 * @param {Object} correspondentData - Datos del corresponsal a actualizar.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const updateCorrespondent = async (correspondentData: {
  id: number;
  type_id: number;
  code: string;
  operator_id: number;
  name: string;
  location: { departamento: string; ciudad: string };
  transactions: { id: number; name: string }[]; // ⬅️ Nuevo campo
  state: number; // ⬅️ Nuevo campo para activar o desactivar (1 o 0)
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/correspondent/update_correspondent.php`;

    console.log("URL de actualización:", url);
    console.log("Datos enviados:", correspondentData);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(correspondentData),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al actualizar el corresponsal:", error);
    throw error;
  }
};

/**
 * Servicio para actualizar el estado (activo/inactivo) de un corresponsal.
 * Envía una solicitud al endpoint `update_state.php` con el ID y el nuevo estado.
 *
 * @param {number} id - ID del corresponsal.
 * @param {number} state - Estado lógico (1 para activo, 0 para inactivo).
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const updateCorrespondentState = async (
  id: number,
  state: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/correspondent/update_state.php`;

    console.log("📤 Enviando cambio de estado:", { id, state });

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
    console.error("❌ Error al actualizar estado:", error);
    throw error;
  }
};

/**
 * Servicio para obtener los corresponsales asignados a un operador (usuario).
 * Llama al endpoint `list_my_correspondent.php` y devuelve los datos.
 *
 * @param {number} id - ID del operador (usuario) para filtrar corresponsales.
 * @returns {Promise<any>} Una promesa que resuelve con los datos filtrados.
 */
export const getMyCorrespondent = async (id: number): Promise<any> => {
  try {
    const url = `${baseUrl}/api/correspondent/list_my_correspondent.php?id=${id}`;

    // Realiza la solicitud GET
    const response = await fetch(url);

    // Verifica que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    // Convierte la respuesta en JSON y la devuelve
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener la lista de corresponsales:", error);
    throw error;
  }
};
/**
 * Servicio para obtener el corresponsal asignado a una caja específica.
 * Realiza una solicitud GET al endpoint `list_correspondent_by_cash.php`.
 *
 * @param {number} cashId - ID de la caja.
 * @returns {Promise<any>} Promesa que resuelve con los datos del corresponsal.
 */
export const getCorrespondentByCash = async (cashId: number): Promise<any> => {
  try {
    const url = `${baseUrl}/api/correspondent/list_correspondent_by_cash.php?cash_id=${cashId}`;

    console.log("🔍 Consultando corresponsal por caja ID:", cashId);
    console.log("🔗 URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.warn("⚠️ No se obtuvo corresponsal:", data.message);
    } else {
      console.log("✅ Corresponsal obtenido:", data.data);
    }

    return data;
  } catch (error) {
    console.error("❌ Error al obtener el corresponsal por caja:", error);
    throw error;
  }
};

/**
 * Servicio para actualizar el estado de premium de un corresponsal.
 * Envia una solicitud POST al endpoint `update_premium.php`.
 *
 * @param {number} id - ID del corresponsal.
 * @param {number} premium - Nuevo valor del campo premium (1 = Premium, 0 = Básico).
 * @returns {Promise<any>} Promesa que resuelve con la respuesta del servidor.
 */
export const updatePremium = async (
  id: number,
  premium: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/correspondent/update_premium.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, premium }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.warn("⚠️ Error en actualización de premium:", data.message);
    }

    return data;
  } catch (error) {
    console.error("❌ Error al actualizar premium:", error);
    throw error;
  }
};
