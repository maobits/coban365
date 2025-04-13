// src/snacks/ui/rates/SnackCrudRate.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
  Autocomplete,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useTheme } from "../../../glamour/ThemeContext";
import {
  createRate,
  updateRate,
  deleteRate,
  listRatesByCorrespondent,
} from "../../../store/rate/CrudRate";
import { getTransactionTypes } from "../../../store/transaction/CrudCorrespondent";

interface Props {
  permissions: string[];
  correspondent: any;
}

const SnackCrudRate: React.FC<Props> = ({ permissions, correspondent }) => {
  const { colors, fonts } = useTheme();
  const [rates, setRates] = useState<any[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  const [newRate, setNewRate] = useState({
    transaction_type_id: null,
    price: "",
    correspondent_id: correspondent?.id || null,
  });

  const [selectedRate, setSelectedRate] = useState<any>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ratesData, typesData] = await Promise.all([
          listRatesByCorrespondent(correspondent.id),
          getTransactionTypes(),
        ]);

        if (ratesData.success) setRates(ratesData.data);
        if (typesData.success) setTransactionTypes(typesData.data);
      } catch (error) {
        console.error("❌ Error al cargar tarifas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [correspondent.id]);

  const handleOpenDialog = async () => {
    try {
      // Cargar tipos de transacción actualizados
      const typesResponse = await getTransactionTypes();
      if (typesResponse.success) {
        setTransactionTypes(typesResponse.data);
      }
    } catch (error) {
      console.error("❌ Error al cargar tipos de transacción:", error);
      setAlertMessage("No se pudieron cargar los tipos de transacción.");
      setAlertType("error");
    }

    // Reiniciar el formulario
    setNewRate({
      transaction_type_id: null,
      price: "",
      correspondent_id: correspondent?.id || null,
    });

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewRate({
      transaction_type_id: null,
      price: "",
      correspondent_id: correspondent?.id || null,
    });
  };
  const handleCreateRate = async () => {
    if (
      !newRate.transaction_type_id ||
      newRate.price === "" ||
      newRate.correspondent_id === null
    ) {
      setAlertMessage("Todos los campos son obligatorios.");
      setAlertType("error");
      return;
    }

    try {
      const response = await createRate({
        transaction_type_id: newRate.transaction_type_id,
        price: parseFloat(newRate.price),
        correspondent_id: newRate.correspondent_id,
      });

      if (response.success) {
        setAlertMessage("Tarifa creada correctamente.");
        setAlertType("success");
        handleCloseDialog();

        const updatedRates = await listRatesByCorrespondent(correspondent.id);
        if (updatedRates.success) {
          setRates(updatedRates.data);
        }
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error al crear tarifa.");
      setAlertType("error");
    }
  };

  const handleEditRate = (rate: any) => {
    setSelectedRate({ ...rate, price: rate.price.toString() });
    setOpenEditDialog(true);
  };
  const handleUpdateRate = async () => {
    if (
      !selectedRate ||
      !selectedRate.transaction_type_id ||
      selectedRate.price === "" ||
      selectedRate.correspondent_id === null
    ) {
      setAlertMessage("Todos los campos son obligatorios.");
      setAlertType("error");
      return;
    }

    try {
      const response = await updateRate({
        id: selectedRate.id,
        transaction_type_id: selectedRate.transaction_type_id,
        price: parseFloat(selectedRate.price),
        correspondent_id: selectedRate.correspondent_id,
      });

      if (response.success) {
        setAlertMessage("Tarifa actualizada correctamente.");
        setAlertType("success");

        const updatedRates = await listRatesByCorrespondent(correspondent.id);
        if (updatedRates.success) {
          setRates(updatedRates.data);
        }

        setOpenEditDialog(false);
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error al actualizar tarifa.");
      setAlertType("error");
    }
  };

  const handleDeleteRate = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta tarifa?")) return;

    try {
      const response = await deleteRate(id);
      if (response.success) {
        setAlertMessage("Tarifa eliminada correctamente.");
        setAlertType("success");

        const updatedRates = await listRatesByCorrespondent(correspondent.id);
        if (updatedRates.success) {
          setRates(updatedRates.data);
        }
      } else {
        setAlertMessage("Error al eliminar: " + response.message);
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
        Gestión de Tarifas
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={handleOpenDialog}
      >
        Nueva Tarifa
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
                <TableCell>Tipo de Transacción</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{rate.transaction_type_name}</TableCell>
                  <TableCell>${parseFloat(rate.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditRate(rate)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteRate(rate.id)}
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
      {/* Diálogo para crear tarifa */}
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
        <DialogTitle
          sx={{
            fontFamily: fonts.heading,
            color: colors.primary,
            mb: 1.5, // ✅ Aumenta separación real del título
          }}
        >
          Nueva Tarifa
        </DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Autocomplete
              disablePortal
              fullWidth
              options={transactionTypes}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={
                transactionTypes.find(
                  (t) => t.id === newRate.transaction_type_id
                ) || null
              }
              onChange={(_, newValue) =>
                setNewRate((prev) => ({
                  ...prev,
                  transaction_type_id: newValue?.id || null,
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tipo de Transacción"
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    backgroundColor: colors.background,
                    borderRadius: 1,
                  }}
                />
              )}
            />

            <TextField
              fullWidth
              label="Precio"
              type="number"
              variant="outlined"
              value={newRate.price}
              onChange={(e) =>
                setNewRate((prev) => ({ ...prev, price: e.target.value }))
              }
              sx={{
                backgroundColor: colors.background,
                borderRadius: 1,
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: colors.text_white }}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateRate}
            variant="contained"
            sx={{ backgroundColor: colors.secondary }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar tarifa */}
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
        <DialogTitle
          sx={{
            fontFamily: fonts.heading,
            color: colors.primary,
            mb: 1.5, // ✅ igual que en el modal de creación
          }}
        >
          Editar Tarifa
        </DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Autocomplete
              options={transactionTypes}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={
                transactionTypes.find(
                  (t) => t.id === selectedRate?.transaction_type_id
                ) || null
              }
              onChange={(_, newValue) =>
                setSelectedRate((prev: any) => ({
                  ...prev,
                  transaction_type_id: newValue?.id || null,
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tipo de Transacción"
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    backgroundColor: colors.background,
                    borderRadius: 1,
                  }}
                />
              )}
            />

            <TextField
              fullWidth
              label="Precio"
              type="number"
              variant="outlined"
              value={selectedRate?.price || ""}
              onChange={(e) =>
                setSelectedRate((prev: any) => ({
                  ...prev,
                  price: e.target.value,
                }))
              }
              sx={{
                backgroundColor: colors.background,
                borderRadius: 1,
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenEditDialog(false)}
            sx={{ color: colors.text_white }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateRate}
            variant="contained"
            sx={{ backgroundColor: colors.secondary }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mostrar alertas */}
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

export default SnackCrudRate;
