import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SnackCrudTransactionTypes from "../../snacks/ui/SnackCrudTransaction";
import { GetUserProfile } from "../../store/profile/GetUserProfile";
import { useTheme } from "../../glamour/ThemeContext";

/**
 * Componente CrudTransactionScreen
 *
 * Permite la gestión de tipos de transacciones con CRUD.
 * Si el usuario no tiene permisos, lo redirige automáticamente a `/profile`.
 *
 * @returns {JSX.Element} Pantalla del CRUD de tipos de transacciones.
 */

const CrudTransactionScreen: React.FC = () => {
  const { colors } = useTheme(); // Tema global
  const navigate = useNavigate(); // Hook para navegación
  const [userPermission, setUserPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Indicador de carga

  useEffect(() => {
    // Verificar la sesión del usuario
    const storedUser = localStorage.getItem("userSession");

    if (!storedUser) {
      navigate("/profile"); // Si no hay sesión, redirige al perfil
      return;
    }

    const userData = JSON.parse(storedUser);
    fetchUserProfile(userData.id);
  }, []);

  /**
   * Obtiene el perfil del usuario y valida permisos.
   * @param {number} userId - ID del usuario autenticado.
   */
  const fetchUserProfile = async (userId: number) => {
    try {
      setLoading(true); // Activa el loader

      const response = await GetUserProfile(userId);
      setLoading(false); // Desactiva el loader

      if (response.success) {
        let parsedPermissions: string[] = [];

        try {
          console.log(
            "🔹 Intentando parsear permisos:",
            response.user.permissions
          );
          if (typeof response.user.permissions === "string") {
            const firstParse = JSON.parse(response.user.permissions);
            parsedPermissions =
              typeof firstParse === "string"
                ? JSON.parse(firstParse)
                : firstParse;

            if (!Array.isArray(parsedPermissions)) {
              console.warn(
                "⚠️ Los permisos no son un array. Se establece como vacío."
              );
              parsedPermissions = [];
            }
          }
        } catch (error) {
          console.error("❌ Error al parsear permisos:", error);
        }

        // Verifica si el usuario tiene permisos
        if (parsedPermissions.includes("manageTransactions")) {
          setUserPermission(true);
        } else {
          navigate("/profile"); // Si no tiene permisos, redirigir
        }
      } else {
        navigate("/profile"); // Si falla la obtención del perfil, redirigir
      }
    } catch (error) {
      console.error("Error al obtener el perfil del usuario:", error);
      navigate("/profile"); // En caso de error, redirigir
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.background_grey,
        minHeight: "100vh",
        padding: 20,
      }}
    >
      {/* Muestra un mensaje de carga antes de renderizar el CRUD */}
      {loading && (
        <p style={{ textAlign: "center", color: colors.text }}>Cargando...</p>
      )}

      {/* Renderiza el CRUD solo si el usuario tiene permisos */}
      {!loading && userPermission && (
        <SnackCrudTransactionTypes permissions={["manageTransactions"]} />
      )}
    </div>
  );
};

export default CrudTransactionScreen;
