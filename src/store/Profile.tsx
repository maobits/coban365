import baseUrl from "./config/server"; // Importa la configuración del servidor

/**
 * Servicio para obtener la lista de perfiles de usuarios.
 * Llama al endpoint `profiles.php` y devuelve los datos en formato JSON.
 *
 * @returns {Promise<any>} Una promesa que resuelve con la lista de perfiles de usuarios.
 */
export const getProfiles = async (): Promise<any> => {
  try {
    // Construye la URL del endpoint
    const url = `${baseUrl}/api/profiles.php`;

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
    console.error("Error al obtener los perfiles de usuarios:", error);
    throw error;
  }
};
