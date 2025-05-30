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
import {
  AccountBalanceWallet,
  MonetizationOn,
  Groups,
} from "@mui/icons-material";
import SnackCrudCrash from "./SnackCrudCash";
import SnackCrudCashier from "./SnackCrudCashier";
import SnackCrudRate from "./SnackCrudRate";
import SnackCrudOther from "./SnackCrudOther";

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
          {/* Mis Cajas */}
          <ListItem disablePadding>
            <ListItemButton
              selected={selected === "misCajas"}
              onClick={() => setSelected("misCajas")}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: colors.secondary,
                  color: colors.text_white,
                  "& .MuiListItemIcon-root": {
                    color: colors.text_white,
                  },
                  "& .MuiTypography-root": {
                    color: colors.text_white,
                  },
                },
              }}
            >
              <ListItemIcon>
                <AccountBalanceWallet sx={{ color: colors.text_white }} />
              </ListItemIcon>
              <ListItemText
                primary="Mis Cajas"
                primaryTypographyProps={{
                  fontFamily: fonts.main,
                  color: colors.text_white,
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* Mis Cajeros */}
          <ListItem disablePadding>
            <ListItemButton
              selected={selected === "misCajeros"}
              onClick={() => setSelected("misCajeros")}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: colors.secondary,
                  color: colors.text_white,
                  "& .MuiListItemIcon-root": {
                    color: colors.text_white,
                  },
                  "& .MuiTypography-root": {
                    color: colors.text_white,
                  },
                },
              }}
            >
              <ListItemIcon>
                <AccountBalanceWallet sx={{ color: colors.text_white }} />
              </ListItemIcon>
              <ListItemText
                primary="Mis Cajeros"
                primaryTypographyProps={{
                  fontFamily: fonts.main,
                  color: colors.text_white,
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* Mis Tarifas */}
          <ListItem disablePadding>
            <ListItemButton
              selected={selected === "misTarifas"}
              onClick={() => setSelected("misTarifas")}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: colors.secondary,
                  color: colors.text_white,
                  "& .MuiListItemIcon-root": {
                    color: colors.text_white,
                  },
                  "& .MuiTypography-root": {
                    color: colors.text_white,
                  },
                },
              }}
            >
              <ListItemIcon>
                <MonetizationOn sx={{ color: colors.text_white }} />
              </ListItemIcon>
              <ListItemText
                primary="Mis Tarifas"
                primaryTypographyProps={{
                  fontFamily: fonts.main,
                  color: colors.text_white,
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* Mis Terceros */}
          <ListItem disablePadding>
            <ListItemButton
              selected={selected === "misTerceros"}
              onClick={() => setSelected("misTerceros")}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: colors.secondary,
                  color: colors.text_white,
                  "& .MuiListItemIcon-root": {
                    color: colors.text_white,
                  },
                  "& .MuiTypography-root": {
                    color: colors.text_white,
                  },
                },
              }}
            >
              <ListItemIcon>
                <Groups sx={{ color: colors.text_white }} />
              </ListItemIcon>
              <ListItemText
                primary="Mis Terceros"
                primaryTypographyProps={{
                  fontFamily: fonts.main,
                  color: colors.text_white,
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
        {selected === "misCajeros" && (
          <SnackCrudCashier
            permissions={permissions}
            correspondent={correspondent}
          />
        )}
        {selected === "misTarifas" && (
          <SnackCrudRate
            permissions={permissions}
            correspondent={correspondent}
          />
        )}

        {selected === "misTerceros" && (
          <SnackCrudOther
            permissions={permissions}
            correspondent={correspondent}
          />
        )}
      </Box>
    </Box>
  );
};

export default SnackBox;
