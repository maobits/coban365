import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SnackCrudUser from "../../snacks/ui/SnackCrudUser"; // Importa el CRUD de usuarios
import { GetUserProfile } from "../../store/profile/GetUserProfile";
import { useTheme } from "../../glamour/ThemeContext";

/**
 * Componente CrudUsersScreen
 *
 * Permite la gestión de usuarios con CRUD.
 * Si el usuario no tiene permisos, lo redirige automáticamente a `/profile`.
 *
 * @returns {JSX.Element} Pantalla del CRUD de usuarios.
 */

const CrudUsersScreen: React.FC = () => {
  const { colors } = useTheme(); // Tema global
  const navigate = useNavigate(); // Hook para navegación
  const [userPermission, setUserPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Indicador de carga

  useEffect(() => {
    console.log("🔄 Verificando sesión del usuario en localStorage...");

    // Verificar la sesión del usuario
    const storedUser = localStorage.getItem("userSession");

    if (!storedUser) {
      console.warn("❌ No hay usuario en sesión. Redirigiendo a /profile...");
      navigate("/profile"); // Si no hay sesión, redirige al perfil
      return;
    }

    const userData = JSON.parse(storedUser);
    console.log("✅ Usuario encontrado en localStorage:", userData);

    fetchUserProfile(userData.id);
  }, []);

  /**
   * Obtiene el perfil del usuario y valida permisos.
   * @param {number} userId - ID del usuario autenticado.
   */
  const fetchUserProfile = async (userId: number) => {
    try {
      console.log(`📡 Consultando el perfil del usuario con ID ${userId}...`);
      setLoading(true); // Activa el loader

      const response = await GetUserProfile(userId);
      setLoading(false); // Desactiva el loader

      if (response.success) {
        console.log("✅ Perfil obtenido con éxito:", response.user);

        // Asegurar que siempre sea un array válido
        let parsedPermissions: string[] = [];

        try {
          console.log(
            "🔍 Intentando parsear permisos:",
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
          console.error("⚠️ Error al parsear permisos:", error);
        }

        console.log("🔍 Permisos del usuario:", parsedPermissions);

        // Verifica si el usuario tiene permisos
        if (parsedPermissions.includes("manageAdministrators")) {
          console.log(
            "✅ El usuario tiene permisos para gestionar administradores."
          );
          setUserPermission(true);
        } else {
          console.warn(
            "❌ El usuario NO tiene permisos. Redirigiendo a /profile..."
          );
          navigate("/profile"); // Si no tiene permisos, redirigir
        }
      } else {
        console.error(
          "❌ Error al obtener el perfil del usuario. Redirigiendo a /profile..."
        );
        navigate("/profile"); // Si falla la obtención del perfil, redirigir
      }
    } catch (error) {
      console.error(
        "🔥 Error crítico al obtener el perfil del usuario:",
        error
      );
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
        <SnackCrudUser permissions={["manageAdministrators"]} />
      )}
    </div>
  );
};

export default CrudUsersScreen;
