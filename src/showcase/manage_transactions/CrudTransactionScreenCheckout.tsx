import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SnackCrudTransactionCheckout from "../../snacks/ui/SnackCrudTransactionCheckout";
import { GetUserProfile } from "../../store/profile/GetUserProfile";
import { useTheme } from "../../glamour/ThemeContext";

/**
 * Componente CrudTransactionsCheckoutScreen
 *
 * Permite la gestión de transacciones con CRUD en un corresponsal específico.
 * Valida si el usuario tiene permisos antes de permitir el acceso.
 *
 * @returns {JSX.Element} Pantalla del CRUD de transacciones.
 */
const CrudTransactionsCheckoutScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();

  const [userPermission, setUserPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Simulación de datos (cambiar si necesitas traer de la sesión)
  const [cashierId, setCashierId] = useState<number | null>(null);
  const [cashId, setCashId] = useState<number | null>(null);
  const [correspondentId, setCorrespondentId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("userSession");

    if (!storedUser) {
      navigate("/profile");
      return;
    }

    const userData = JSON.parse(storedUser);
    fetchUserProfile(userData.id);

    // Puedes ajustar aquí si necesitas traer cashierId, cashId, correspondentId
    setCashierId(userData.id); // 🔹 Supongo que el mismo usuario actúa como cajero
    setCashId(1); // 🔹 Mock temporal (deberías traerlo dinámico si prefieres)
    setCorrespondentId(1); // 🔹 Mock temporal
  }, []);

  const fetchUserProfile = async (userId: number) => {
    try {
      setLoading(true);

      const response = await GetUserProfile(userId);
      setLoading(false);

      if (response.success) {
        let parsedPermissions: string[] = [];

        try {
          if (typeof response.user.permissions === "string") {
            const firstParse = JSON.parse(response.user.permissions);
            parsedPermissions =
              typeof firstParse === "string"
                ? JSON.parse(firstParse)
                : firstParse;

            if (!Array.isArray(parsedPermissions)) {
              parsedPermissions = [];
            }
          }
        } catch (error) {
          console.error("Error al parsear permisos:", error);
        }

        if (parsedPermissions.includes("manageCash")) {
          setUserPermission(true);
        } else {
          navigate("/profile");
        }
      } else {
        navigate("/profile");
      }
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      navigate("/profile");
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
      {loading && (
        <p style={{ textAlign: "center", color: colors.text }}>Cargando...</p>
      )}

      {!loading && userPermission && cashierId && cashId && correspondentId && (
        <SnackCrudTransactionCheckout
          permissions={["manageCash"]}
          cashierId={cashierId}
          cashId={cashId}
          correspondentId={correspondentId}
        />
      )}
    </div>
  );
};

export default CrudTransactionsCheckoutScreen;
