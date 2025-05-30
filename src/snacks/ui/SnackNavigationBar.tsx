import React, { useState } from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  IconButton,
} from "@mui/material";
import {
  Home,
  Calculate,
  Note,
  Menu,
  Close,
  ExitToApp,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../glamour/ThemeContext";

/**
 * Componente SnackNavigationBar
 *
 * Barra de navegación fija en la parte izquierda de la pantalla con opción de ocultar/mostrar.
 * Contiene accesos rápidos a:
 *  - Inicio ("/")
 *  - Calculadora ("/calculator")
 *  - Notas ("/notes")
 *  - Cerrar Sesión (Elimina la sesión y redirige a "/login")
 *
 * Usa Material UI y el tema de la app para mantener la coherencia visual.
 *
 * @returns {JSX.Element} Elemento JSX que representa la barra de navegación lateral.
 */

const SnackNavigationBar: React.FC = () => {
  const { colors } = useTheme(); // Obtiene los colores del tema
  const navigate = useNavigate(); // Hook para la navegación
  const [value, setValue] = useState(0); // Estado para manejar la selección de pestañas
  const [open, setOpen] = useState(true); // Estado para mostrar/ocultar la barra

  /**
   * Maneja el cierre de sesión eliminando la sesión del usuario en localStorage
   * y redirigiendo a la pantalla de login.
   */
  const handleLogout = () => {
    console.log("🚪 Cerrando sesión...");
    localStorage.removeItem("userSession"); // Elimina la sesión
    navigate("/login"); // Redirige a la pantalla de inicio de sesión
  };

  return (
    <>
      {/* Botón de menú para mostrar/ocultar la barra */}
      <IconButton
        onClick={() => setOpen(!open)}
        sx={{
          position: "fixed",
          top: 20,
          left: open ? 90 : 10, // Se mueve dependiendo del estado
          backgroundColor: colors.primary,
          color: colors.text_white,
          zIndex: 1100, // Asegura que esté visible
          "&:hover": { backgroundColor: colors.secondary },
        }}
      >
        {open ? <Close /> : <Menu />}
      </IconButton>

      {/* Barra de navegación lateral */}
      <Paper
        sx={{
          position: "fixed",
          top: 0,
          left: open ? 0 : "-100px", // Oculta la barra cuando está cerrada
          bottom: 0,
          zIndex: 1000,
          backgroundColor: colors.primary,
          width: open ? 80 : 0, // Ocupa espacio solo cuando está abierta
          display: open ? "flex" : "none",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "10px",
          transition: "left 0.3s ease-in-out, width 0.3s ease-in-out",
        }}
        elevation={10}
      >
        <BottomNavigation
          value={value}
          onChange={(_, newValue) => setValue(newValue)}
          sx={{
            backgroundColor: colors.primary,
            color: colors.text_white,
            flexDirection: "column",
            height: "100%",
            alignItems: "center",
          }}
          showLabels
        >
          {/* Botón de Inicio */}
          <BottomNavigationAction
            label="Inicio"
            icon={<Home />}
            onClick={() => navigate("/")}
            sx={{
              color: colors.secondary,
              "&.Mui-selected": { color: colors.text_white },

              minWidth: "auto",
              padding: "10px 0",
            }}
          />

          {/* Botón de Calculadora */}
          <BottomNavigationAction
            label="Calculadora"
            icon={<Calculate />}
            onClick={() => navigate("/calculator")}
            sx={{
              color: colors.secondary,
              "&.Mui-selected": { color: colors.text_white },

              minWidth: "auto",
              padding: "10px 0",
            }}
          />

          {/* Botón de Notas */}
          <BottomNavigationAction
            label="Notas"
            icon={<Note />}
            onClick={() => navigate("/notes")}
            sx={{
              color: colors.secondary,
              "&.Mui-selected": { color: colors.text_white },

              minWidth: "auto",
              padding: "10px 0",
            }}
          />

          {/* Botón de Cerrar Sesión */}
          <BottomNavigationAction
            label="Cerrar Sesión"
            icon={<ExitToApp />}
            onClick={handleLogout}
            sx={{
              color: colors.secondary,
              "&.Mui-selected": { color: colors.text_white },

              minWidth: "auto",
              padding: "10px 0",
              marginTop: "auto", // Se ubica en la parte inferior de la barra
            }}
          />
        </BottomNavigation>
      </Paper>
    </>
  );
};

export default SnackNavigationBar;
