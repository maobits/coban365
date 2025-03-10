import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Paper,
  Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { GetUserProfile } from "../../store/GetUserProfile";
import { useTheme } from "../../glamour/ThemeContext";

// Importa los iconos de los permisos
import manageCorrespondentsIcon from "../../ingredients/icons/profile/manageCorrespondents.png";
import manageAdministratorsIcon from "../../ingredients/icons/profile/manageAdministrators.png";
import manageReportsIcon from "../../ingredients/icons/profile/manageReports.png";

// Importa los avatares según el rol del usuario
import adminAvatar from "../../ingredients/icons/roles/admin.png";
import superadminAvatar from "../../ingredients/icons/roles/superadmin.png";
import cajeroAvatar from "../../ingredients/icons/roles/cajero.png";
import terceroAvatar from "../../ingredients/icons/roles/tercero.png";

/**
 * Componente SnackProfile
 *
 * Muestra un perfil moderno del usuario autenticado con un saludo, su rol y una
 * interfaz de permisos con tarjetas interactivas y un diseño atractivo.
 *
 * @returns {JSX.Element} Elemento JSX que representa el perfil del usuario.
 */

const SnackProfile: React.FC = () => {
  const { colors, fonts } = useTheme(); // Obtiene los estilos del tema
  const navigate = useNavigate(); // Hook para la navegación
  const [user, setUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  // Mapa de roles con avatares
  const roleMap: { [key: string]: { name: string; avatar: string } } = {
    admin: { name: "Administrador", avatar: adminAvatar },
    superadmin: { name: "Super Administrador", avatar: superadminAvatar },
    cajero: { name: "Cajero", avatar: cajeroAvatar },
    tercero: { name: "Cliente Preferencial", avatar: terceroAvatar },
  };

  // Mapa de permisos con nombres amigables e iconos importados
  const permissionMap: { [key: string]: { name: string; icon: string } } = {
    manageCorrespondents: {
      name: "Gestionar Corresponsales",
      icon: manageCorrespondentsIcon,
    },
    manageAdministrators: {
      name: "Gestionar Administradores",
      icon: manageAdministratorsIcon,
    },
    manageReports: { name: "Gestionar Reportes", icon: manageReportsIcon },
  };

  // Obtiene el ID del usuario desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("userSession");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      fetchUserProfile(userData.id);
    }
  }, []);

  // Obtiene el perfil del usuario desde el servidor
  const fetchUserProfile = async (userId: number) => {
    try {
      const response = await GetUserProfile(userId);
      if (response.success) {
        setUser(response.user);

        // Parsea la cadena JSON de permisos
        const parsedPermissions =
          JSON.parse(response.user.permissions || "{}").permissions || [];
        setPermissions(parsedPermissions);
      }
    } catch (error) {
      console.error("Error al obtener el perfil del usuario:", error);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: colors.background_grey, // Fondo oscuro del perfil
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 4,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          padding: 5,
          maxWidth: 900,
          width: "100%",
          backgroundColor: colors.primary, // Fondo del cuadro
          borderRadius: 4,
          textAlign: "center",
        }}
      >
        {/* Avatar del usuario según su rol */}
        {user && (
          <Avatar
            src={roleMap[user.role]?.avatar || superadminAvatar} // Avatar dinámico según el rol
            sx={{
              width: 100,
              height: 100,
              margin: "auto",
              backgroundColor: colors.background_grey,
            }}
          />
        )}

        {/* Encabezado con saludo */}
        {user && (
          <>
            <Typography
              variant="h4"
              fontFamily={fonts.heading}
              color={colors.text_white}
              fontWeight="bold"
              mt={2}
              gutterBottom
            >
              ¡Hola, {user.fullname}!
            </Typography>
            <Typography
              variant="h6"
              fontFamily={fonts.main}
              color={colors.secondary}
              gutterBottom
            >
              Eres {roleMap[user.role]?.name || "un usuario del sistema"}.
            </Typography>

            {/* Sección de permisos */}
            <Box mt={4}>
              <Typography
                variant="h5"
                fontFamily={fonts.heading}
                color={colors.text_white}
                gutterBottom
              >
                Tus Permisos
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {permissions.map((permKey) => (
                  <Grid item xs={12} sm={6} md={4} key={permKey}>
                    <Card
                      sx={{
                        backgroundColor: colors.background,
                        borderRadius: 3,
                        boxShadow: 3,
                        transition: "all 0.3s",
                        "&:hover": {
                          boxShadow: 10,
                          transform: "scale(1.05)",
                          cursor: "pointer",
                        },
                      }}
                    >
                      <CardActionArea
                        onClick={() => {
                          if (permKey === "manageCorrespondents") {
                            navigate("/correspondents", {
                              state: { permission: permKey },
                            });
                          } else {
                            navigate(`/${permKey}`);
                          }
                        }}
                      >
                        <CardContent
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: 2,
                          }}
                        >
                          {/* Icono del permiso */}
                          <Box
                            component="img"
                            src={permissionMap[permKey]?.icon || ""}
                            alt={permissionMap[permKey]?.name || permKey}
                            sx={{
                              width: 60,
                              height: 60,
                              marginBottom: 1,
                              objectFit: "contain",
                            }}
                          />
                          {/* Nombre del permiso */}
                          <Typography
                            variant="h6"
                            fontFamily={fonts.main}
                            color={colors.text}
                            textAlign="center"
                          >
                            {permissionMap[permKey]?.name || permKey}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default SnackProfile;
