import baseUrl from "./config/server"; // Importa la configuración del servidor

/**
 * Servicio para obtener los tipos de corresponsales.
 * Llama al endpoint `types_correspondent.php` y devuelve los datos en formato JSON.
 *
 * @returns {Promise<any>} Una promesa que resuelve con los tipos de corresponsales.
 */
export const getTypesCorrespondent = async (): Promise<any> => {
  try {
    // Construye la URL del endpoint
    const url = `${baseUrl}/api/types_correspondent.php`;

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
export const createCorrespondent = async (correspondentData: {
  type_id: number;
  code: string;
  operator_id: number;
  name: string;
  location: { departamento: string; ciudad: string };
}): Promise<any> => {
  try {
    // Construye la URL del endpoint
    const url = `${baseUrl}/api/create_correspondent.php`;

    // Configura la solicitud POST con el cuerpo en formato JSON
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(correspondentData),
    });

    // Verifica que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    // Convierte la respuesta en JSON y la devuelve
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
    const url = `${baseUrl}/api/list_correspondent.php`;

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
    const url = `${baseUrl}/api/delete_correspondent.php`;

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
}): Promise<any> => {
  try {
    // Construye la URL del endpoint
    const url = `${baseUrl}/api/update_correspondent.php`;

    // Muestra en consola la URL y los datos enviados (para depuración)
    console.log("URL de actualización:", url);
    console.log("Datos enviados:", correspondentData);

    // Realiza la solicitud HTTP al endpoint con el método POST
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Indica que el contenido es JSON
      },
      body: JSON.stringify(correspondentData),
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
    console.error("Error al actualizar el corresponsal:", error);
    throw error;
  }
};
