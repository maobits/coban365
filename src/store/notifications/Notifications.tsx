import baseUrl from "../config/server"; // Importa la configuración del servidor

/**
 * Servicio para enviar correo de recuperación de contraseña.
 *
 * @param {string} email - Correo electrónico del usuario.
 * @returns {Promise<any>} Promesa con el resultado del envío.
 */
export const recoverPassword = async (email: string) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/notifications/recover_password.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    return await response.json();
  } catch (error) {
    console.error("❌ Error al enviar recuperación de contraseña:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};
