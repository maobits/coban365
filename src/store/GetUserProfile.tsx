import baseUrl from "./config/server"; // Importa la configuración del servidor

/**
 * Servicio para obtener el perfil de un usuario en el sistema.
 * Realiza una solicitud al servidor para recuperar los datos del usuario sin incluir la contraseña.
 *
 * @param {number} userId - ID del usuario.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const GetUserProfile = async (userId: number): Promise<any> => {
  try {
    // Construye la URL completa del endpoint con el ID del usuario
    const url = `${baseUrl}/api/profile.php?id=${userId}`;

    // Muestra en consola la URL de la solicitud (para depuración)
    console.log("URL de obtención de perfil:", url);

    // Realiza la solicitud HTTP al endpoint con el método GET
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json", // Indica que el contenido es JSON
      },
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
    console.error("Error al obtener el perfil del usuario:", error);
    throw error;
  }
};
