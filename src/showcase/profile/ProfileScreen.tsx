import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Importa el hook de navegación
import SnackProfile from "../../snacks/ui/SnackProfile";
import { useTheme } from "../../glamour/ThemeContext";

/**
 * Componente ProfileScreen
 *
 * Esta pantalla muestra el perfil del usuario autenticado.
 * Si el usuario no ha iniciado sesión, redirige a `LoginScreen.tsx`.
 *
 * @returns {JSX.Element} Elemento JSX que representa la pantalla de perfil o autenticación.
 */

const ProfileScreen: React.FC = () => {
  const { colors } = useTheme(); // Obtiene el tema global
  const navigate = useNavigate(); // Hook para la navegación
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verifica si hay un usuario autenticado en localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("userSession");
    if (!storedUser) {
      console.warn("🔒 Usuario no autenticado. Redirigiendo a LoginScreen...");
      navigate("/login"); // Redirige a la pantalla de inicio de sesión
    } else {
      setIsAuthenticated(true); // Usuario autenticadao
    }
  }, [navigate]);

  return (
    <div
      style={{
        backgroundColor: colors.background_grey,
        minHeight: "100vh",
        padding: 20,
      }}
    >
      {/* Renderiza el perfil si el usuario está autenticado */}
      {isAuthenticated && <SnackProfile />}
    </div>
  );
};

export default ProfileScreen;
