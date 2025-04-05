import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Autocomplete,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../glamour/ThemeContext";
import {
  createCash,
  updateCash,
  deleteCash,
  getCash,
  updateCashState,
  getCashiers,
} from "../../../store/crash/CrudCrash";
import { getCorrespondents } from "../../../store/correspondent/CrudCorrespondent";
import { getProfiles } from "../../../store/profile/Profile";

const SnackCrudCash: React.FC<{
  permissions: string[];
  correspondent: any; // o define una interfaz si quieres más precisión
}> = ({ permissions, correspondent }) => {
  const { colors, fonts } = useTheme();
  const navigate = useNavigate();

  const [cashes, setCashes] = useState<any[]>([]);
  const [correspondents, setCorrespondents] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  const [newCash, setNewCash] = useState({
    correspondent_id: null,
    cashier_id: null,
    capacity: "",
    state: true,
  });

  const [selectedCash, setSelectedCash] = useState<any>(null);

  useEffect(() => {
    if (!permissions.includes("manageCorrespondent")) {
      navigate("/profile");
    }
  }, [permissions, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cashData, correspondentData, cashierData] = await Promise.all([
          getCash(),
          getCorrespondents(),
          getProfiles(),
        ]);

        if (cashData.success) setCashes(cashData.data);
        if (correspondentData.success)
          setCorrespondents(correspondentData.data);
        if (cashierData.success) setCashiers(cashierData.users);
      } catch (error) {
        console.error("Error al cargar cajas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  // Abrir diálogo de creación
  const handleOpenDialog = async () => {
    try {
      const response = await getCashiers();
      if (response.success) {
        setCashiers(response.data); // ✅ Carga la lista en el estado
      }
    } catch (error) {
      console.error("Error al cargar cajeros:", error);
    }

    // Establece el corresponsal y abre el modal
    setNewCash({
      correspondent_id: correspondent?.id || null,
      cashier_id: null,
      capacity: "",
      state: true,
    });
    setOpenDialog(true);
  };

  // Cerrar y reiniciar diálogo de creación
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewCash({
      correspondent_id: null,
      cashier_id: null,
      capacity: "",
      state: true,
    });
  };

  // Crear caja
  const handleCreateCash = async () => {
    if (
      !newCash.correspondent_id ||
      !newCash.cashier_id ||
      newCash.capacity === ""
    ) {
      setAlertMessage("Todos los campos son obligatorios.");
      setAlertType("error");
      return;
    }

    try {
      const response = await createCash({
        ...newCash,
        capacity: Number(newCash.capacity),
        state: newCash.state,
      });

      if (response.success) {
        setAlertMessage("Caja creada exitosamente.");
        setAlertType("success");
        handleCloseDialog();

        const updatedList = await getCash();
        if (updatedList.success) {
          setCashes(updatedList.data);
        }
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error en el servidor.");
      setAlertType("error");
    }
  };

  // Editar caja
  const handleEditCash = (cash: any) => {
    setSelectedCash({ ...cash });
    setOpenEditDialog(true);
  };

  // Guardar edición
  const handleUpdateCash = async () => {
    if (!selectedCash) return;

    try {
      const response = await updateCash({ ...selectedCash });

      if (response.success) {
        setAlertMessage("Caja actualizada correctamente.");
        setAlertType("success");

        const updatedList = await getCash();
        if (updatedList.success) {
          setCashes(updatedList.data);
        }

        setOpenEditDialog(false);
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error en la actualización.");
      setAlertType("error");
    }
  };

  // Eliminar caja
  const handleDeleteCash = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta caja?")) return;

    try {
      const response = await deleteCash(id);
      if (response.success) {
        alert("Caja eliminada correctamente");
        const updatedList = await getCash();
        if (updatedList.success) {
          setCashes(updatedList.data);
        }
      } else {
        alert("Error: " + response.message);
      }
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  // Actualizar estado
  const handleToggleState = async (id: number, currentState: number) => {
    const newState = currentState === 1 ? 0 : 1;

    try {
      const result = await updateCashState(id, newState);
      if (result.success) {
        setAlertMessage("Estado actualizado correctamente.");
        setAlertType("success");

        const updatedList = await getCash();
        if (updatedList.success) {
          setCashes(updatedList.data);
        }
      } else {
        setAlertMessage("Error al actualizar el estado.");
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error al conectar con el servidor.");
      setAlertType("error");
    }
  };

  return (
    <Box
      sx={{
        padding: 3,
        backgroundColor: colors.background,
        minHeight: "100vh",
      }}
    >
      <Typography
        variant="h4"
        fontFamily={fonts.heading}
        color={colors.primary}
        gutterBottom
      >
        Gestión de Cajas
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={handleOpenDialog}
      >
        Nueva Caja
      </Button>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ marginTop: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Corresponsal</TableCell>
                <TableCell>Cajero</TableCell>
                <TableCell>Capacidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cashes.map((cash) => (
                <TableRow key={cash.id}>
                  <TableCell>{cash.correspondent_name}</TableCell>
                  <TableCell>{cash.cashier_name}</TableCell>
                  <TableCell>{cash.capacity}</TableCell>
                  <TableCell>
                    <Switch
                      checked={cash.state === 1}
                      onChange={() => handleToggleState(cash.id, cash.state)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditCash(cash)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteCash(cash.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {/* Diálogo para crear caja */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: colors.background,
            color: colors.text_white,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: fonts.heading, color: colors.primary }}>
          Nueva Caja
        </DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <Autocomplete
            options={correspondents}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={
              correspondents.find((c) => c.id === newCash.correspondent_id) ||
              null
            }
            disabled
            renderInput={(params) => (
              <TextField
                {...params}
                label="Corresponsal"
                fullWidth
                variant="outlined"
                sx={{
                  mt: 3, // ✅ MARGEN SUPERIOR para que no quede pegado
                  mb: 2,
                  backgroundColor: colors.background,
                  borderRadius: 1,
                }}
              />
            )}
          />

          <Autocomplete
            options={cashiers}
            getOptionLabel={(option) => option.fullname}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, newValue) =>
              setNewCash((prev) => ({
                ...prev,
                cashier_id: newValue?.id || null,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cajero"
                fullWidth
                variant="outlined"
                sx={{
                  mb: 2,
                  backgroundColor: colors.background,
                  borderRadius: 1,
                }}
              />
            )}
          />

          <TextField
            fullWidth
            label="Capacidad"
            type="number"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            onChange={(e) =>
              setNewCash((prev) => ({
                ...prev,
                capacity: e.target.value,
              }))
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={newCash.state}
                onChange={(e) =>
                  setNewCash((prev) => ({
                    ...prev,
                    state: e.target.checked,
                  }))
                }
                sx={{ color: colors.secondary }}
              />
            }
            label="Caja Activa"
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: colors.text_white }}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateCash}
            variant="contained"
            sx={{ backgroundColor: colors.secondary }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal para editar caja */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: colors.background,
            color: colors.text_white,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: fonts.heading, color: colors.primary }}>
          Editar Caja
        </DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <Autocomplete
            options={correspondents}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={
              correspondents.find(
                (c) => c.id === selectedCash?.correspondent_id
              ) || null
            }
            disabled // ✅ esto deshabilita el campo para que no pueda cambiarse
            renderInput={(params) => (
              <TextField
                {...params}
                label="Corresponsal"
                fullWidth
                variant="outlined"
                sx={{
                  mt: 3,
                  mb: 2,
                  backgroundColor: colors.background,
                  borderRadius: 1,
                }}
              />
            )}
          />

          <Autocomplete
            options={cashiers}
            getOptionLabel={(option) => option.fullname}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={
              cashiers.find((c) => c.id === selectedCash?.cashier_id) || null
            }
            onChange={(_, newValue) =>
              setSelectedCash((prev: any) => ({
                ...prev,
                cashier_id: newValue?.id || null,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cajero"
                fullWidth
                variant="outlined"
                sx={{
                  mb: 2,
                  backgroundColor: colors.background,
                  borderRadius: 1,
                }}
              />
            )}
          />

          <TextField
            fullWidth
            label="Capacidad"
            type="number"
            variant="outlined"
            value={selectedCash?.capacity || ""}
            onChange={(e) =>
              setSelectedCash((prev: any) => ({
                ...prev,
                capacity: e.target.value,
              }))
            }
            sx={{
              mb: 2,
              backgroundColor: colors.background,
              borderRadius: 1,
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={selectedCash?.state === 1}
                onChange={(e) =>
                  setSelectedCash((prev: any) => ({
                    ...prev,
                    state: e.target.checked ? 1 : 0,
                  }))
                }
                sx={{ color: colors.secondary }}
              />
            }
            label="Caja Activa"
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenEditDialog(false)}
            sx={{ color: colors.text_white }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateCash}
            variant="contained"
            sx={{ backgroundColor: colors.secondary }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar de alertas */}
      <Snackbar
        open={!!alertMessage}
        autoHideDuration={3000}
        onClose={() => setAlertMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAlertMessage(null)}
          severity={alertType}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SnackCrudCash;
