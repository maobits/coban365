import React, { useState } from "react";
import {
  IconButton,
  Menu as MuiMenu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  PaperProps,
} from "@mui/material";
import {
  Home,
  Calculate,
  Note,
  Menu as MenuIcon,
  ExitToApp,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../glamour/ThemeContext";

/**
 * SnackNavigationBar
 * Menú tipo hamburguesa con lista vertical de enlaces (dropdown).
 * Colores: usa el tema actual (botón = primary/secondary; lista = background.paper, texto = colors.text).
 */
const SnackNavigationBar: React.FC = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();

  // Ancla del menú
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const toggleMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(open ? null : e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    navigate("/login");
  };

  // Estilo del contenedor del menú para que se parezca a la imagen
  const paperProps: Partial<PaperProps> = {
    elevation: 8,
    sx: {
      mt: 5, // 👈 antes estaba en 1, ahora baja el menú
      ml: 0.5,
      width: 220,
      bgcolor: "background.paper",
      color: colors.text,
      borderRadius: 1.2,
      boxShadow: 6,
      "& .MuiMenuItem-root": {
        py: 1.2,
        borderBottom: "1px solid",
        borderColor: "divider",
      },
      "& .MuiMenuItem-root:last-of-type": {
        borderBottom: "none",
      },
    },
  };

  return (
    <>
      {/* Botón hamburguesa fijo arriba-izquierda */}
      <IconButton
        aria-label="abrir menú"
        onClick={toggleMenu}
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 1300,
          backgroundColor: colors.primary,
          color: colors.text_white,
          "&:hover": { backgroundColor: colors.secondary },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Menú desplegable tipo lista */}
      <MuiMenu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={paperProps}
        MenuListProps={{ sx: { p: 0 } }}
      >
        <MenuItem
          onClick={() => {
            navigate("/");
            closeMenu();
          }}
        >
          <ListItemIcon>
            <Home fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Inicio" />
        </MenuItem>

        {/* Activa estos si quieres más enlaces */}
        {/* <MenuItem
          onClick={() => {
            navigate("/calculator");
            closeMenu();
          }}
        >
          <ListItemIcon>
            <Calculate fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Calculadora" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            navigate("/notes");
            closeMenu();
          }}
        >
          <ListItemIcon>
            <Note fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Notas" />
        </MenuItem> */}

        <Divider />

        <MenuItem
          onClick={() => {
            handleLogout();
            closeMenu();
          }}
        >
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Cerrar Sesión" />
        </MenuItem>
      </MuiMenu>
    </>
  );
};

export default SnackNavigationBar;
