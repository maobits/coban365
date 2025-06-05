// src/showcase/reports/GenerateReports.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Autocomplete,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  AppBar,
  Toolbar,
  IconButton as MuiIconButton,
  Slide,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import InventoryIcon from "@mui/icons-material/Inventory";
import CloseIcon from "@mui/icons-material/Close";
import { TransitionProps } from "@mui/material/transitions";
import { useTheme } from "../../glamour/ThemeContext";
import SnackGeneralReport from "../../snacks/ui/reports/SnackGeneralReport";
import SnackReportBoxes from "../../snacks/ui/reports/SnackReportBoxes";
import { getCorrespondents } from "../../store/correspondent/CrudCorrespondent";
import { getCashByCorrespondent } from "../../store/crash/CrudCrash";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});
const GenerateReports: React.FC = () => {
  const { colors, fonts } = useTheme();

  const [correspondents, setCorrespondents] = useState<any[]>([]);
  const [selectedCorrespondent, setSelectedCorrespondent] = useState<any>(null);
  const [cashOptions, setCashOptions] = useState<any[]>([]);
  const [selectedCash, setSelectedCash] = useState<any>(null);
  const [openGeneralDialog, setOpenGeneralDialog] = useState(false);
  const [openBoxDialog, setOpenBoxDialog] = useState(false);

  const session = JSON.parse(localStorage.getItem("userSession") || "{}");
  const role = session?.role;
  const userId = session?.id;

  useEffect(() => {
    const fetchCorrespondents = async () => {
      try {
        const res = await getCorrespondents();
        if (res.success && Array.isArray(res.data)) {
          const filtered =
            role === "superadmin"
              ? res.data
              : role === "admin"
              ? res.data.filter((c: any) => c.operator_id === userId)
              : role === "cajero"
              ? res.data.filter((c: any) =>
                  c.cajas?.some((caja: any) => caja.cashier_id === userId)
                )
              : [];
          setCorrespondents(filtered);
        }
      } catch (error) {
        console.error("Error al cargar corresponsales:", error);
      }
    };
    fetchCorrespondents();
  }, [role, userId]);

  useEffect(() => {
    const fetchCashOptions = async () => {
      if (selectedCorrespondent?.id) {
        try {
          const res = await getCashByCorrespondent(selectedCorrespondent.id);
          if (res.success && Array.isArray(res.data)) {
            const filteredCash =
              role === "cajero"
                ? res.data.filter((cash: any) => cash.cashier_id === userId)
                : res.data;
            setCashOptions(filteredCash);
          } else {
            setCashOptions([]);
          }
        } catch (error) {
          console.error("Error al cargar cajas:", error);
          setCashOptions([]);
        }
      } else {
        setCashOptions([]);
        setSelectedCash(null);
      }
    };
    fetchCashOptions();
  }, [selectedCorrespondent, role, userId]);
  return (
    <Box
      sx={{
        backgroundColor: colors.background,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: 4,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          padding: 4,
          maxWidth: 900,
          width: "100%",
          backgroundColor: colors.background_grey,
        }}
      >
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography
              variant="h4"
              fontFamily={fonts.heading}
              color={colors.primary}
              fontWeight="bold"
            >
              Gestor de reportes
            </Typography>
          </Grid>
          <Grid item>
            <Autocomplete
              options={correspondents}
              getOptionLabel={(option) => option.name}
              value={selectedCorrespondent}
              onChange={(_, value) => {
                setSelectedCorrespondent(value);
                setSelectedCash(null);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Seleccionar corresponsal" />
              )}
              sx={{ minWidth: 250 }}
            />
          </Grid>
        </Grid>

        {selectedCorrespondent && role !== "cajero" && (
          <Grid container mt={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={cashOptions}
                getOptionLabel={(option) => option.name}
                value={selectedCash}
                onChange={(_, value) => setSelectedCash(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Seleccionar caja (opcional)" />
                )}
                sx={{ minWidth: 250 }}
              />
            </Grid>
          </Grid>
        )}

        <Grid container spacing={3} mt={4}>
          {role !== "cajero" && (
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  padding: 3,
                  textAlign: "center",
                  cursor: selectedCorrespondent ? "pointer" : "not-allowed",
                  opacity: selectedCorrespondent ? 1 : 0.5,
                  "&:hover": {
                    backgroundColor: selectedCorrespondent
                      ? "#e3f2fd"
                      : "inherit",
                  },
                }}
                onClick={() =>
                  selectedCorrespondent && setOpenGeneralDialog(true)
                }
              >
                <Tooltip title="Generar Reporte General">
                  <IconButton>
                    <AssessmentIcon color="primary" fontSize="large" />
                  </IconButton>
                </Tooltip>
                <Typography mt={1} fontWeight="bold">
                  Reporte general
                </Typography>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12} md={4}>
            <Paper
              elevation={2}
              sx={{
                padding: 3,
                textAlign: "center",
                cursor: selectedCorrespondent ? "pointer" : "not-allowed",
                opacity: selectedCorrespondent ? 1 : 0.5,
                "&:hover": {
                  backgroundColor: selectedCorrespondent
                    ? "#e8f5e9"
                    : "inherit",
                },
              }}
              onClick={() => selectedCorrespondent && setOpenBoxDialog(true)}
            >
              <Tooltip title="Generar Reporte por Cajas">
                <IconButton>
                  <InventoryIcon color="primary" fontSize="large" />
                </IconButton>
              </Tooltip>
              <Typography mt={1} fontWeight="bold">
                Reporte por cajas
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        fullScreen
        open={openGeneralDialog}
        onClose={() => setOpenGeneralDialog(false)}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: "relative", backgroundColor: colors.primary }}>
          <Toolbar>
            <MuiIconButton
              edge="start"
              color="inherit"
              onClick={() => setOpenGeneralDialog(false)}
            >
              <CloseIcon />
            </MuiIconButton>
            <Typography
              sx={{ ml: 2, flex: 1 }}
              variant="h6"
              fontFamily={fonts.heading}
              color={colors.text_white}
            >
              Reporte General – {selectedCorrespondent?.name}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ padding: 4 }}>
          <SnackGeneralReport correspondentId={selectedCorrespondent?.id} />
        </Box>
      </Dialog>

      <Dialog
        fullScreen
        open={openBoxDialog}
        onClose={() => setOpenBoxDialog(false)}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: "relative", backgroundColor: colors.primary }}>
          <Toolbar>
            <MuiIconButton
              edge="start"
              color="inherit"
              onClick={() => setOpenBoxDialog(false)}
            >
              <CloseIcon />
            </MuiIconButton>
            <Typography
              sx={{ ml: 2, flex: 1 }}
              variant="h6"
              fontFamily={fonts.heading}
              color={colors.text_white}
            >
              Reporte por Cajas – {selectedCorrespondent?.name}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ padding: 4 }}>
          <SnackReportBoxes
            correspondentId={selectedCorrespondent?.id}
            cashId={selectedCash?.id ?? null}
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default GenerateReports;
