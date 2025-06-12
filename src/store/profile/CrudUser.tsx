import { baseUrl } from "../config/server"; // Importa la configuración del servidor

/**
 * Servicio para crear un nuevo usuario.
 * Envía los datos al endpoint `create_profile.php` mediante una solicitud POST.
 *
 * @param {Object} userData - Datos del usuario a registrar.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const createUser = async (userData: {
  email: string;
  fullname: string;
  phone?: string;
  password: string;
  role: "admin" | "superadmin" | "cajero" | "tercero";
  permissions?: string[];
}): Promise<any> => {
  try {
    // Construye la URL del endpoint para crear un usuario
    const url = `${baseUrl}/api/profile/create_profile.php`;

    // Configura la solicitud POST con el cuerpo en formato JSON
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    // Verifica que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    // Convierte la respuesta en JSON y la devuelve
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al crear usuario:", error);
    throw error;
  }
};

/**
 * Servicio para eliminar un usuario.
 * Envía el ID del usuario al endpoint `delete_profile.php` mediante una solicitud POST.
 *
 * @param {number} userId - ID del usuario a eliminar.
 * @returns {Promise<any>} Respuesta del servidor.
 */
export const deleteUser = async (userId: number): Promise<any> => {
  try {
    // Construcción de la URL del endpoint
    const url = `${baseUrl}/api/profile/delete_profile.php`;

    // Configura la solicitud POST con el cuerpo en formato JSON
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: userId }), // Enviar el ID del usuario
    });

    // Verifica si la respuesta fue exitosa
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    // Convierte la respuesta a formato JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    throw error;
  }
};

/**
 * Servicio para obtener la lista de usuarios.
 * Realiza una solicitud GET al endpoint `list_users.php`.
 *
 * @returns {Promise<any>} Una promesa que resuelve con la lista de usuarios.
 */
export const listUsers = async (): Promise<any> => {
  try {
    // Construye la URL completa del endpoint
    const url = `${baseUrl}/api/profile/list_users.php`;

    // Muestra en consola la URL de la solicitud (para depuración)
    console.log("📡 Solicitando lista de usuarios desde:", url);

    // Realiza la solicitud HTTP al endpoint con el método GET
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json", // Indica que el contenido es JSON
      },
    });

    // Verifica que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error(`❌ Error en la solicitud: ${response.statusText}`);
    }

    // Convierte la respuesta en formato JSON
    const data = await response.json();

    // Retorna la respuesta del servidor
    return data;
  } catch (error) {
    // Manejo de errores: se imprime en la consola y se relanza
    console.error("🔥 Error al obtener la lista de usuarios:", error);
    throw error;
  }
};

export const updateUser = async (userData: {
  id: number;
  email: string;
  fullname: string;
  phone: string;
  status: number;
  role: "admin" | "superadmin" | "cajero" | "tercero";
  permissions: string[];
}): Promise<any> => {
  try {
    // Construye la URL del endpoint
    const url = `${baseUrl}/api/profile/update_user.php`;

    // 🟢 Log: URL y datos enviados
    console.log("🟢 [updateUser] URL de actualización:", url);
    console.log(
      "🟢 [updateUser] Datos enviados:",
      JSON.stringify(userData, null, 2)
    );

    // Realiza la solicitud HTTP al endpoint con el método POST
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    // 🟡 Log: Verificar si la respuesta HTTP es exitosa
    console.log(
      "🟡 [updateUser] Estado de la respuesta:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    // 🔵 Log: Convertir la respuesta a JSON
    const data = await response.json();
    console.log("🔵 [updateUser] Respuesta del servidor:", data);

    // Retorna la respuesta del servidor
    return data;
  } catch (error) {
    // 🔴 Log: Captura de errores
    console.error("🔴 [updateUser] Error al actualizar el usuario:", error);
    throw error;
  }
};
