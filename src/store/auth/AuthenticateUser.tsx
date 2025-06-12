import { baseUrl } from "../config/server"; // Importa la configuración del servidor

/**
 * Servicio para autenticar un usuario en el sistema.
 * Envía las credenciales al servidor y maneja la respuesta.
 *
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña del usuario.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const AuthenticateUser = async (
  email: string,
  password: string
): Promise<any> => {
  try {
    // Construye la URL completa del endpoint de autenticación
    const url = `${baseUrl}/api/auth/login.php`;

    // Muestra en consola la URL de la solicitud (para depuración)
    console.log("URL de autenticación:", url);

    // Configura el cuerpo de la solicitud con los datos del usuario
    const body = JSON.stringify({ email, password });

    // Realiza la solicitud HTTP al endpoint con el método POST
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Indica que el contenido es JSON
      },
      body, // Envía los datos en formato JSON
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
    console.error("Error en la autenticación:", error);
    throw error;
  }
};
