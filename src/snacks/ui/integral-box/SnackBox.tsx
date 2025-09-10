import React, { useMemo, useState } from "react";
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
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Slide,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { TransitionProps } from "@mui/material/transitions";
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

// 👇 Reporte de comisiones (acepta idCash o idCorrespondent)
import SnackReportComission from "../reports/SnackReportComission";

interface Props {
  correspondent: any;
  permissions: string[];
}

// Transición del modal
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SnackBox: React.FC<Props> = ({ correspondent, permissions }) => {
  const { colors, fonts } = useTheme();
  const [selected, setSelected] = useState("misCajas");
  const [openCommissions, setOpenCommissions] = useState(false);

  // ✅ Resolver ID del corresponsal desde el objeto recibido
  const resolvedCorrespondentId = useMemo<number | undefined>(() => {
    const c = correspondent || {};
    const candidates = [c.id, c.correspondent_id, c.id_correspondent].filter(
      (v) => typeof v === "number" && !Number.isNaN(v)
    );
    return candidates.length ? (candidates[0] as number) : undefined;
  }, [correspondent]);

  const handleOpenCommissions = () => {
    //setSelected("misTarifas");
    setOpenCommissions(true);
  };
  const handleCloseCommissions = () => setOpenCommissions(false);

  // 🔍 Logs rápidos
  console.log("✅ Permisos:", permissions);
  console.log("✅ Corresponsal:", correspondent);
  console.log("✅ resolvedCorrespondentId:", resolvedCorrespondentId);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        backgroundColor: colors.background,
      }}
    >
      {/* Menú lateral */}
      <Paper
        elevation={10}
        sx={{
          width: 240,
          backgroundColor: colors.primary,
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
                  color: colors.text_white,
                  "& .MuiListItemIcon-root": { color: colors.text_white },
                  "& .MuiTypography-root": { color: colors.text_white },
                },
              }}
            >
              <ListItemIcon>
                <AccountBalanceWallet sx={{ color: colors.text_white }} />
              </ListItemIcon>
              <ListItemText
                primary="Mis Cajas"
                primaryTypographyProps={{ fontFamily: fonts.main }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              selected={selected === "misCajeros"}
              onClick={() => setSelected("misCajeros")}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: colors.secondary,
                  color: colors.text_white,
                  "& .MuiListItemIcon-root": { color: colors.text_white },
                  "& .MuiTypography-root": { color: colors.text_white },
                },
              }}
            >
              <ListItemIcon>
                <AccountBalanceWallet sx={{ color: colors.text_white }} />
              </ListItemIcon>
              <ListItemText
                primary="Mis Cajeros"
                primaryTypographyProps={{ fontFamily: fonts.main }}
              />
            </ListItemButton>
          </ListItem>

          {/* Mis comisiones → abre modal */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleOpenCommissions}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: colors.secondary,
                  color: colors.text_white,
                  "& .MuiListItemIcon-root": { color: colors.text_white },
                  "& .MuiTypography-root": { color: colors.text_white },
                },
              }}
            >
              <ListItemIcon>
                <MonetizationOn sx={{ color: colors.text_white }} />
              </ListItemIcon>
              <ListItemText
                primary="Mis comisiones"
                primaryTypographyProps={{ fontFamily: fonts.main }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              selected={selected === "misTerceros"}
              onClick={() => setSelected("misTerceros")}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: colors.secondary,
                  color: colors.text_white,
                  "& .MuiListItemIcon-root": { color: colors.text_white },
                  "& .MuiTypography-root": { color: colors.text_white },
                },
              }}
            >
              <ListItemIcon>
                <Groups sx={{ color: colors.text_white }} />
              </ListItemIcon>
              <ListItemText
                primary="Mis Terceros"
                primaryTypographyProps={{ fontFamily: fonts.main }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Paper>

      {/* Panel derecho */}
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

      {/* MODAL: Mis comisiones */}
      <Dialog
        fullScreen
        open={openCommissions}
        onClose={handleCloseCommissions}
        TransitionComponent={Transition}
        PaperProps={{ sx: { backgroundColor: colors.background } }}
      >
        <AppBar sx={{ position: "sticky", backgroundColor: colors.primary }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleCloseCommissions}
              aria-label="cerrar"
            >
              <CloseIcon />
            </IconButton>
            <Typography
              sx={{ ml: 2, flex: 1, fontFamily: fonts.heading }}
              variant="h6"
              component="div"
            >
              Mis comisiones
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* 👉 Pasamos el ID del corresponsal para todas sus cajas */}
          <SnackReportComission
            correspondentId={resolvedCorrespondentId}
            // También podrías pasar el objeto:
            // correspondent={correspondent}
            // date="2025-09-07"
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default SnackBox;
