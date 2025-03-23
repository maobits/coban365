// src/showcase/transactions/CrudTransactionTypes.tsx

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
  Autocomplete,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../glamour/ThemeContext";
import {
  getTransactionTypes,
  createTransactionType,
  updateTransactionType,
  deleteTransactionType,
} from "../../store/transaction/CrudCorrespondent";

/**
 * Componente SnackCrudTransactionTypes
 *
 * Permite la gestión de Tipos de Transacción (CRUD)
 */
const SnackCrudTransactionTypes: React.FC<{ permissions: string[] }> = ({
  permissions,
}) => {
  const { colors, fonts } = useTheme();
  const navigate = useNavigate();

  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const categories = [
    "Ingresos",
    "Retiros",
    "Otros",
    "Compensación",
    "Transferir",
  ];

  const [newType, setNewType] = useState({
    name: "",
    category: "",
  });

  const [selectedType, setSelectedType] = useState<any>(null);
  useEffect(() => {
    if (
      !permissions ||
      !Array.isArray(permissions) ||
      !permissions.includes("manageTransactions")
    ) {
      navigate("/profile");
    }
  }, [permissions, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getTransactionTypes();
        if (response.success && Array.isArray(response.data)) {
          setTypes(response.data);
        }
      } catch (error) {
        console.error("Error al cargar tipos de transacción:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewType({ name: "", category: "" });
  };
  const handleCreateType = async () => {
    try {
      if (newType.name.trim() === "" || newType.category.trim() === "") {
        setAlertMessage("Todos los campos son obligatorios.");
        setAlertType("error");
        return;
      }

      const response = await createTransactionType(newType);

      if (response.success) {
        setAlertMessage("Tipo de transacción creado.");
        setAlertType("success");
        handleCloseDialog();

        const updatedList = await getTransactionTypes();
        if (updatedList.success) {
          setTypes(updatedList.data);
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

  const handleEditType = (type: any) => {
    setSelectedType({ ...type });
    setOpenEditDialog(true);
  };

  const handleUpdateType = async () => {
    if (!selectedType) return;

    try {
      const response = await updateTransactionType(selectedType);

      if (response.success) {
        setAlertMessage("Tipo actualizado correctamente.");
        setAlertType("success");

        const updatedList = await getTransactionTypes();
        if (updatedList.success) {
          setTypes(updatedList.data);
        }

        setOpenEditDialog(false);
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error al actualizar el tipo.");
      setAlertType("error");
    }
  };

  const handleDeleteType = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este tipo?")) return;

    try {
      const response = await deleteTransactionType(id);

      if (response.success) {
        alert("Tipo de transacción eliminado.");
        const updatedList = await getTransactionTypes();
        if (updatedList.success) {
          setTypes(updatedList.data);
        }
      } else {
        alert("Error al eliminar: " + response.message);
      }
    } catch (error) {
      alert("Error en la eliminación.");
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
        Tipos de Transacciones
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={handleOpenDialog}
      >
        Nuevo Tipo de transacción
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
                <TableCell>Nombre</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>{type.category}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditType(type)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteType(type.id)}
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
      {/* Diálogo para agregar nuevo tipo de transacción */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Nuevo Tipo de Transacción</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={newType.name}
            onChange={(e) => setNewType({ ...newType, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={categories}
            getOptionLabel={(option) => option}
            value={newType.category}
            onChange={(_, value) =>
              setNewType({ ...newType, category: value || "" })
            }
            renderInput={(params) => (
              <TextField {...params} label="Categoría" fullWidth />
            )}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleCreateType} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar tipo de transacción */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Editar Tipo de Transacción</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={selectedType?.name || ""}
            onChange={(e) =>
              setSelectedType({ ...selectedType, name: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={categories}
            getOptionLabel={(option) => option}
            value={selectedType?.category || ""}
            onChange={(_, value) =>
              setSelectedType({ ...selectedType, category: value || "" })
            }
            renderInput={(params) => (
              <TextField {...params} label="Categoría" fullWidth />
            )}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleUpdateType} color="primary">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para alertas */}
      <Snackbar
        open={!!alertMessage}
        autoHideDuration={4000}
        onClose={() => setAlertMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={alertType}
          onClose={() => setAlertMessage(null)}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SnackCrudTransactionTypes;
