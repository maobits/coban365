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
  correspondent: {
    id: number;
    name: string;
    premium?: number; // ← importante para controlar
  };
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Estado para deshabilitar en proceso de actualización del estado.
  const [updatingStateId, setUpdatingStateId] = useState<number | null>(null);

  // Estado para crear nuevo tercero
  const [newOther, setNewOther] = useState({
    name: "",
    id_type: "",
    id_number: "",
    email: "",
    phone: "",
    address: "",
    credit: 0,
    state: 1,
    correspondent_id: correspondent?.id || null,
  });

  // Estado de carga pendiente.
  const [saving, setSaving] = useState(false);

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
    // Validar límite para corresponsales no premium
    if (correspondent?.premium !== 1 && others.length >= 1) {
      setAlertMessage(
        "⚠️ Este corresponsal tiene un plan básico y solo puede registrar un tercero."
      );
      setAlertType("error");
      return;
    }

    setNewOther({
      name: "",
      credit: 0,
      state: 1,
      correspondent_id: correspondent.id,
      id_type: "",
      id_number: "",
      email: "",
      phone: "",
      address: "",
    });

    setOpenDialog(true); // Solo se abre si pasa la validación
  };

  // Función para cerrar el diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewOther({
      name: "",
      credit: 0,
      state: 1,
      correspondent_id: correspondent?.id || null,
      id_type: "",
      id_number: "",
      email: "",
      phone: "",
      address: "",
    });
  };

  const handleCreateOther = async () => {
    const errors: Record<string, string> = {};

    if (!newOther.name?.trim()) errors.name = "Nombre requerido.";
    if (!newOther.id_type?.trim())
      errors.id_type = "Selecciona un tipo de identificación.";
    if (!newOther.id_number?.trim())
      errors.id_number = "Número de identificación requerido.";
    if (!newOther.email?.trim()) errors.email = "Correo electrónico requerido.";
    if (!newOther.phone?.trim()) errors.phone = "Celular requerido.";
    if (!newOther.address?.trim()) errors.address = "Dirección requerida.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setAlertMessage("Completa todos los campos requeridos.");
      setAlertType("error");
      return;
    }

    setSaving(true); // 🔄 Iniciar carga

    try {
      const response = await createOther(newOther);
      if (response.success) {
        setAlertMessage("Tercero creado exitosamente.");
        setAlertType("success");
        handleCloseDialog();
        fetchOthers();
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      console.error("❌ Error al crear tercero:", error);
      setAlertMessage("No se pudo registrar el tercero.");
      setAlertType("error");
    } finally {
      setSaving(false); // ✅ Finalizar carga
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
      credit: parseFloat(other.credit),
      id_type: other.id_type || "",
      id_number: other.id_number || "",
      email: other.email || "",
      phone: other.phone || "",
      address: other.address || "",
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
    setUpdatingStateId(id); // ⏳ Marca como en proceso
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
    } finally {
      setUpdatingStateId(null); // ✅ Finaliza proceso
    }
  };

  {
    /* Formatear en COP */
  }
  const formatCOP = (value: string | number) => {
    const number = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(isNaN(number) ? 0 : number);
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
                <TableCell>Identificación</TableCell>
                <TableCell>Correo Electrónico</TableCell>
                <TableCell>Celular</TableCell>
                <TableCell>Crédito</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {others.map((other) => (
                <TableRow key={other.id}>
                  <TableCell>{other.name}</TableCell>
                  <TableCell>
                    {other.id_type} {other.id_number}
                  </TableCell>
                  <TableCell>{other.email}</TableCell>
                  <TableCell>{other.phone}</TableCell>
                  <TableCell>{formatCOP(other.credit)}</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(other.state)}
                          onChange={() =>
                            handleToggleState(other.id, other.state)
                          }
                          color="success"
                          disabled={updatingStateId === other.id} // ⛔ Deshabilita si se está actualizando ese ID
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
            mb: 1.5,
          }}
        >
          Nuevo Tercero
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
              mb: 2,
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
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
            />

            <TextField
              fullWidth
              label="Tipo de Identificación"
              select
              value={newOther.id_type}
              onChange={(e) =>
                setNewOther({ ...newOther, id_type: e.target.value })
              }
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
              error={!!formErrors.id_type}
              helperText={formErrors.id_type}
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
            >
              <option value="">Selecciona...</option>
              <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
              <option value="NIT">NIT</option>
              <option value="Cédula de Extranjería">
                Cédula de Extranjería
              </option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="DNI">DNI</option>
              <option value="RUT">RUT</option>
              <option value="Otro">Otro</option>
            </TextField>

            <TextField
              fullWidth
              label="Número de Identificación"
              value={newOther.id_number}
              onChange={(e) =>
                setNewOther({ ...newOther, id_number: e.target.value })
              }
              error={!!formErrors.id_number}
              helperText={formErrors.id_number}
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
            />

            <TextField
              fullWidth
              label="Correo Electrónico"
              value={newOther.email}
              onChange={(e) =>
                setNewOther({ ...newOther, email: e.target.value })
              }
              error={!!formErrors.email}
              helperText={formErrors.email}
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
            />

            <TextField
              fullWidth
              label="Celular"
              value={newOther.phone}
              onChange={(e) =>
                setNewOther({ ...newOther, phone: e.target.value })
              }
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
            />

            <TextField
              fullWidth
              label="Dirección"
              value={newOther.address}
              onChange={(e) =>
                setNewOther({ ...newOther, address: e.target.value })
              }
              error={!!formErrors.address}
              helperText={formErrors.address}
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
            />

            <TextField
              fullWidth
              label="Crédito Disponible"
              value={formatCOP(newOther.credit)}
              onChange={(e) =>
                setNewOther({
                  ...newOther,
                  credit:
                    parseFloat(e.target.value.replace(/[^0-9]/g, "")) || 0,
                })
              }
              error={!!formErrors.credit}
              helperText={formErrors.credit}
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
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
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar"}
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
              label="Tipo de Identificación"
              select
              value={selectedOther?.id_type || ""}
              onChange={(e) =>
                setSelectedOther((prev: any) => ({
                  ...prev,
                  id_type: e.target.value,
                }))
              }
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
            >
              <option value="">Selecciona...</option>
              <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
              <option value="NIT">NIT</option>
              <option value="Cédula de Extranjería">
                Cédula de Extranjería
              </option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="DNI">DNI</option>
              <option value="RUT">RUT</option>
              <option value="Otro">Otro</option>
            </TextField>

            <TextField
              fullWidth
              label="Número de Identificación"
              value={selectedOther?.id_number || ""}
              onChange={(e) =>
                setSelectedOther((prev: any) => ({
                  ...prev,
                  id_number: e.target.value,
                }))
              }
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
            />

            <TextField
              fullWidth
              label="Correo Electrónico"
              value={selectedOther?.email || ""}
              onChange={(e) =>
                setSelectedOther((prev: any) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
            />

            <TextField
              fullWidth
              label="Celular"
              value={selectedOther?.phone || ""}
              onChange={(e) =>
                setSelectedOther((prev: any) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
            />

            <TextField
              fullWidth
              label="Dirección"
              value={selectedOther?.address || ""}
              onChange={(e) =>
                setSelectedOther((prev: any) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              sx={{ backgroundColor: colors.background, borderRadius: 1 }}
            />

            <TextField
              fullWidth
              label="Crédito Disponible"
              value={formatCOP(selectedOther?.credit || 0)}
              onChange={(e) =>
                setSelectedOther((prev: any) => ({
                  ...prev,
                  credit:
                    parseFloat(e.target.value.replace(/[^0-9]/g, "")) || 0,
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
