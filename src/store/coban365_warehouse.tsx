import baseUrl from "./config/server"; // Importa la configuración del servidor

/**
 * Servicio para obtener la lista de negocios VIP.
 * Utiliza la ruta base del servidor y el endpoint correspondiente.
 *
 * @returns {Promise<any>} Una promesa que resuelve con la colección en formato JSON.
 */
export const getVipBusinesses = async (): Promise<any> => {
  try {
    // Construye la URL completa concatenando la baseUrl con el endpoint
    const url = `${baseUrl}/vendors/backend/api/vip_business_list.php`;

    // Muestra en consola la URL que se está solicitando
    console.log("URL de la solicitud:", url);

    // Realiza la solicitud HTTP al endpoint
    const response = await fetch(url);

    // Verifica que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    // Devuelve la respuesta parseada a JSON
    const data = await response.json();
    return data;
  } catch (error) {
    // Manejo de errores: se imprime el error en la consola y se relanza
    console.error("Error al obtener negocios VIP:", error);
    throw error;
  }
};
