import React, { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Paper,
} from "@mui/material";
import { useTheme } from "../../../glamour/ThemeContext";
import { AccountBalanceWallet } from "@mui/icons-material";
import SnackCrudCrash from "./SnackCrudCash";

// Asegúrate de tener esto en la parte superior
interface Props {
  correspondent: any;
  permissions: string[];
}

const SnackBox: React.FC<Props> = ({ correspondent, permissions }) => {
  const { colors, fonts } = useTheme();
  const [selected, setSelected] = useState("misCajas");

  // 🔍 Logs de depuración
  console.log("✅ Permisos recibidos:", permissions);
  console.log("✅ Corresponsal recibido:", correspondent);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        backgroundColor: colors.background, // Fondo general del componente
      }}
    >
      {/* Menú lateral izquierdo */}
      <Paper
        elevation={10} // Elevación coherente con la barra lateral
        sx={{
          width: 240,
          backgroundColor: colors.primary, // Mismo color que SnackNavigationBar
          color: colors.text_white,
          zIndex: 1000,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: fonts.heading,
            textAlign: "center",
            padding: 2,
            color: colors.text_white,
          }}
        >
          Menú
        </Typography>
        <Divider sx={{ borderColor: colors.secondary }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              selected={selected === "misCajas"}
              onClick={() => setSelected("misCajas")}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: colors.secondary,
                  color: colors.text,
                  "& .MuiListItemIcon-root": {
                    color: colors.text,
                  },
                },
              }}
            >
              <ListItemIcon>
                <AccountBalanceWallet
                  sx={{
                    color:
                      selected === "misCajas" ? colors.text : colors.secondary,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Mis Cajas"
                primaryTypographyProps={{
                  fontFamily: fonts.main,
                  color:
                    selected === "misCajas" ? colors.text : colors.text_white,
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Paper>

      {/* Panel derecho de contenido */}
      <Box
        sx={{
          flex: 1,
          padding: { xs: 2, sm: 4 },
          backgroundColor: colors.background,
        }}
      >
        {selected === "misCajas" && (
          <SnackCrudCrash
            permissions={permissions}
            correspondent={correspondent}
          />
        )}
      </Box>
    </Box>
  );
};

export default SnackBox;
