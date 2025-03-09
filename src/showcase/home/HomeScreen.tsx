import React, { useState } from "react";
import SnackLogin from "../../snacks/ui/SnackLogin";
import { AuthenticateUser } from "../../store/coban365_warehouse";
import { ThemeProvider } from "../../glamour/ThemeContext"; // Importa el ThemeProvider
import { Alert, Snackbar } from "@mui/material"; // Importa alertas de Material UI

/**
 * Componente HomeScreen
 *
 * Renderiza el formulario de inicio de sesión y maneja la autenticación del usuario.
 * Muestra alertas para errores de credenciales incorrectas y cuentas inactivas.
 *
 * @returns {JSX.Element} Elemento JSX que representa la pantalla de inicio.
 */

const HomeScreen: React.FC = () => {
  // Estado para almacenar mensajes de alerta
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">(
    "error"
  );

  /**
   * Maneja la autenticación del usuario
   *
   * @param {string} email - Correo del usuario
   * @param {string} password - Contraseña del usuario
   */
  const handleLogin = async (email: string, password: string) => {
    console.log("🔄 Iniciando proceso de autenticación...");
    console.log(`📩 Email: ${email}`);
    console.log("🔑 Enviando solicitud de autenticación al servidor...");

    try {
      const response = await AuthenticateUser(email, password);
      console.log("✅ Respuesta recibida del servidor:", response);

      if (response.success) {
        if (response.user.status === 0) {
          console.warn("⚠️ Usuario autenticado pero inactivo.");
          setAlertMessage("Cuenta inactiva. Contacta al administrador.");
          setAlertType("warning");
        } else {
          console.log("🎉 Inicio de sesión exitoso.");
          setAlertMessage("Inicio de sesión exitoso.");
          setAlertType("success");
          console.log("👤 Datos del usuario:", response.user);
        }
      } else {
        console.error("❌ Error de autenticación:", response.message);
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      console.error("🔥 Error en el servidor:", error);
      setAlertMessage("Error en el servidor. Intente más tarde.");
      setAlertType("error");
    }
  };

  return (
    <ThemeProvider>
      {/* Renderiza el formulario de inicio de sesión */}
      <SnackLogin onLogin={handleLogin} />

      {/* Snackbar para mostrar alertas */}
      <Snackbar
        open={!!alertMessage}
        autoHideDuration={4000}
        onClose={() => setAlertMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={alertType} onClose={() => setAlertMessage(null)}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default HomeScreen;
