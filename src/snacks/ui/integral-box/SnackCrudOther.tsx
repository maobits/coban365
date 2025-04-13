// src/snacks/ui/others/SnackCrudOther.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Switch,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useTheme } from "../../../glamour/ThemeContext";

// Servicios de terceros
import {
  createOther,
  listOthersByCorrespondent,
  updateOther,
  deleteOther,
  updateOtherState,
} from "../../..//store/other/CrudOther";

// Props del componente
interface Props {
  permissions: string[];
  correspondent: any;
}

const SnackCrudOther: React.FC<Props> = ({ permissions, correspondent }) => {
  const { colors, fonts } = useTheme();

  // Estados de UI y datos
  const [others, setOthers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  // Estado para crear nuevo tercero
  const [newOther, setNewOther] = useState({
    name: "",
    credit: "",
    state: true,
    correspondent_id: correspondent?.id || null,
  });

  // Estado para tercero seleccionado (edición)
  const [selectedOther, setSelectedOther] = useState<any>(null);
  // Cargar los terceros al montar el componente
  useEffect(() => {
    fetchOthers();
  }, [correspondent?.id]);

  // Función para obtener los terceros desde la API
  const fetchOthers = async () => {
    try {
      setLoading(true);
      const response = await listOthersByCorrespondent(correspondent.id);

      if (response.success) {
        setOthers(response.data);
      } else {
        setAlertMessage("Error al cargar terceros.");
        setAlertType("error");
      }
    } catch (error) {
      console.error("❌ Error al listar terceros:", error);
      setAlertMessage("No se pudo cargar la lista.");
      setAlertType("error");
    } finally {
      setLoading(false);
    }
  };
  // Función para abrir el diálogo de creación
  const handleOpenDialog = () => {
    setNewOther({
      name: "",
      credit: 0,
      state: 1,
      correspondent_id: correspondent.id, // El corresponsal actual no se puede modificar
    });
    setOpenDialog(true);
  };

  // Función para cerrar el diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewOther({
      name: "",
      credit: 0,
      state: 1,
      correspondent_id: correspondent.id,
    });
  };

  // Función para crear un nuevo tercero
  const handleCreateOther = async () => {
    if (newOther.name.trim() === "") {
      setAlertMessage("El nombre del tercero es obligatorio.");
      setAlertType("error");
      return;
    }

    try {
      const response = await createOther(newOther);
      if (response.success) {
        setAlertMessage("Tercero creado exitosamente.");
        setAlertType("success");
        handleCloseDialog();
        fetchOthers(); // Recargar la tabla
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      console.error("❌ Error al crear tercero:", error);
      setAlertMessage("No se pudo registrar el tercero.");
      setAlertType("error");
    }
  };

  const handleUpdateOther = async () => {
    if (!selectedOther) return;

    if (!selectedOther.name || typeof selectedOther.credit !== "number") {
      setAlertMessage("Todos los campos son obligatorios.");
      setAlertType("error");
      return;
    }

    try {
      const response = await updateOther(selectedOther); // 👈 asegúrate de importar este servicio
      if (response.success) {
        setAlertMessage("Tercero actualizado correctamente.");
        setAlertType("success");

        // Refrescar la lista
        const updated = await listOthersByCorrespondent(correspondent.id);
        if (updated.success) {
          setOthers(updated.data);
        }

        setOpenEditDialog(false);
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      console.error("❌ Error al actualizar el tercero:", error);
      setAlertMessage("Ocurrió un error inesperado.");
      setAlertType("error");
    }
  };

  // Función para editar un tercero (abre el modal con los datos cargados)
  /**
   * Abre el modal de edición para el tercero seleccionado.
   * Carga los datos actuales del tercero para permitir su modificación.
   *
   * @param {any} other - Objeto con los datos del tercero a editar.
   */
  const handleEditOther = (other: any) => {
    setSelectedOther({
      ...other,
      credit: parseFloat(other.credit), // Asegurar que el crédito sea numérico
    });
    setOpenEditDialog(true);
  };

  // Función para eliminar un tercero
  /**
   * Elimina un tercero de la base de datos después de confirmar la acción.
   *
   * @param {number} id - ID del tercero a eliminar.
   */
  const handleDeleteOther = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este tercero?")) return;

    try {
      const response = await deleteOther(id);
      if (response.success) {
        setAlertMessage("Tercero eliminado correctamente.");
        setAlertType("success");
        fetchOthers(); // Recargar la lista de terceros
      } else {
        setAlertMessage("Error al eliminar el tercero.");
        setAlertType("error");
      }
    } catch (error) {
      console.error("❌ Error al eliminar tercero:", error);
      setAlertMessage("No se pudo eliminar el tercero.");
      setAlertType("error");
    }
  };

  // Función para cambiar el estado (activo/inactivo) de un tercero
  /**
   * Cambia el estado lógico de un tercero (activo/inactivo).
   *
   * @param {number} id - ID del tercero.
   * @param {number} currentState - Estado actual (1 o 0).
   */
  const handleToggleState = async (id: number, currentState: number) => {
    try {
      const response = await updateOtherState(id, currentState === 1 ? 0 : 1);
      if (response.success) {
        setAlertMessage("Estado actualizado.");
        setAlertType("success");
        fetchOthers();
      } else {
        setAlertMessage("No se pudo actualizar el estado.");
        setAlertType("error");
      }
    } catch (error) {
      console.error("❌ Error al cambiar estado:", error);
      setAlertMessage("Error al cambiar el estado.");
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
        Gestión de Terceros
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={handleOpenDialog}
      >
        Nuevo Tercero
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
                <TableCell>Crédito</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {others.map((other) => (
                <TableRow key={other.id}>
                  <TableCell>{other.name}</TableCell>
                  <TableCell>${parseFloat(other.credit).toFixed(2)}</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(other.state)}
                          onChange={() =>
                            handleToggleState(other.id, other.state)
                          }
                          color="success"
                        />
                      }
                      label={other.state ? "Activo" : "Inactivo"}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditOther(other)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteOther(other.id)}
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
      {/* Diálogo para crear tercero */}
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
            mb: 1.5, // ✅ Separación profesional del título
          }}
        >
          Nuevo Tercero
        </DialogTitle>

        <DialogContent sx={{ padding: 3 }}>
          {/* Contenedor del formulario con márgenes entre campos */}
          <Box
            component="form"
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
              mb: 2, // ✅ Espacio inferior entre formulario y acciones
            }}
          >
            <TextField
              fullWidth
              label="Corresponsal"
              value={correspondent?.name || "Sin corresponsal"}
              disabled
              sx={{
                backgroundColor: colors.background,
                borderRadius: 1,
              }}
            />

            <TextField
              fullWidth
              label="Nombre del Tercero"
              value={newOther.name}
              onChange={(e) =>
                setNewOther({ ...newOther, name: e.target.value })
              }
              sx={{
                backgroundColor: colors.background,
                borderRadius: 1,
              }}
            />

            <TextField
              fullWidth
              label="Crédito Disponible"
              type="number"
              value={newOther.credit}
              onChange={(e) =>
                setNewOther({ ...newOther, credit: e.target.value })
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
            onClick={handleCreateOther}
            variant="contained"
            sx={{ backgroundColor: colors.secondary }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para editar tercero */}
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
            mb: 1.5, // ✅ Separación profesional del título
          }}
        >
          Editar Tercero
        </DialogTitle>

        <DialogContent sx={{ padding: 3 }}>
          <Box
            component="form"
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
              mb: 2, // ✅ Espacio inferior entre formulario y acciones
            }}
          >
            <TextField
              fullWidth
              label="Nombre del Tercero"
              value={selectedOther?.name || ""}
              onChange={(e) =>
                setSelectedOther((prev: any) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              sx={{
                backgroundColor: colors.background,
                borderRadius: 1,
              }}
            />

            <TextField
              fullWidth
              label="Crédito Disponible"
              type="number"
              value={selectedOther?.credit || ""}
              onChange={(e) =>
                setSelectedOther((prev: any) => ({
                  ...prev,
                  credit: e.target.value,
                }))
              }
              sx={{
                backgroundColor: colors.background,
                borderRadius: 1,
              }}
            />

            <TextField
              fullWidth
              label="Corresponsal"
              value={correspondent?.name || ""}
              disabled
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
            onClick={handleUpdateOther}
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

export default SnackCrudOther;
