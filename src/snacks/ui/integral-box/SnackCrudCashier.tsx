// Parte 1: Importaciones y estado inicial
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
  Switch,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useTheme } from "../../../glamour/ThemeContext";
import {
  createCashier,
  deleteCashier,
  getCashiersByCorrespondent,
  updateCashier,
  updateCashierState,
} from "../../../store/cashiers/CrudCashiers";
// Parte 2: Componente principal y definición de estados
const SnackCrudCashier: React.FC<{
  correspondent: any;
  permissions: string[];
}> = ({ correspondent, permissions }) => {
  const { colors, fonts } = useTheme();

  const [cashiers, setCashiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  const [newCashier, setNewCashier] = useState({
    email: "",
    fullname: "",
    password: "",
    phone: "",
    correspondents: [{ id: correspondent.id }],
    role: "cajero",
    permissions: ["manageCash"],
    status: true,
  });

  const [selectedCashier, setSelectedCashier] = useState<any>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getCashiersByCorrespondent(correspondent.id);
        if (res.success) {
          setCashiers(res.data);
        }
      } catch (error) {
        console.error("❌ Error al cargar cajeros:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [correspondent.id]);

  const handleOpenDialog = () => {
    setNewCashier({
      email: "",
      fullname: "",
      password: "",
      phone: "",
      correspondents: [{ id: correspondent.id }],
      role: "cajero",
      permissions: ["manageCash"],
      status: true,
    });
    setOpenDialog(true);
  };
  const handleCreate = async () => {
    if (!newCashier.email || !newCashier.fullname || !newCashier.password) {
      setAlertMessage("Todos los campos obligatorios deben completarse.");
      setAlertType("error");
      return;
    }

    try {
      const res = await createCashier(newCashier);
      if (res.success) {
        setAlertMessage("Cajero creado correctamente.");
        setAlertType("success");
        setOpenDialog(false);
        const updated = await getCashiersByCorrespondent(correspondent.id);
        if (updated.success) setCashiers(updated.data);
      } else {
        setAlertMessage(res.message);
        setAlertType("error");
      }
    } catch {
      setAlertMessage("Error del servidor.");
      setAlertType("error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar cajero?")) return;
    try {
      const res = await deleteCashier(id);
      if (res.success) {
        const updated = await getCashiersByCorrespondent(correspondent.id);
        setCashiers(updated.data);
      }
    } catch {
      alert("❌ Error al eliminar.");
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === 1 ? 0 : 1;

    try {
      const res = await updateCashierState(user.id, newStatus);
      if (res.success) {
        setAlertMessage(
          newStatus === 1
            ? "Cajero activado correctamente."
            : "Cajero desactivado correctamente."
        );
        setAlertType("success");

        const updated = await getCashiersByCorrespondent(correspondent.id);
        if (updated.success) setCashiers(updated.data);
      } else {
        setAlertMessage(res.message);
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error al actualizar el estado del cajero.");
      setAlertType("error");
    }
  };

  const handleUpdateCashier = async () => {
    if (!selectedCashier) return;

    try {
      console.log("🟡 Iniciando actualización de cajero...");
      console.log("📦 Datos actuales:", selectedCashier);

      // Aseguramos que `correspondents` sea un array válido
      const correspondentsArray =
        typeof selectedCashier.correspondents === "string"
          ? JSON.parse(selectedCashier.correspondents)
          : selectedCashier.correspondents;

      console.log("🧪 Corresponsales procesados:", correspondentsArray);

      const res = await updateCashier({
        id: selectedCashier.id,
        email: selectedCashier.email, // ✅ ahora sí incluido
        fullname: selectedCashier.fullname,
        phone: selectedCashier.phone,
        correspondents: correspondentsArray.map((c: any) => ({ id: c.id })), // ✅ formato correcto
      });

      console.log("✅ Respuesta del servidor:", res);

      if (res.success) {
        setAlertMessage("Cajero actualizado correctamente.");
        setAlertType("success");
        setOpenEditDialog(false);

        const updated = await getCashiersByCorrespondent(correspondent.id);
        if (updated.success) setCashiers(updated.data);
      } else {
        setAlertMessage(res.message);
        setAlertType("error");
      }
    } catch (error) {
      console.error("❌ Error al actualizar el cajero:", error);
      setAlertMessage("Error al actualizar el cajero.");
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
        Gestión de Cajeros
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={handleOpenDialog}
      >
        Nuevo Cajero
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
                <TableCell>Teléfono</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cashiers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.fullname}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Switch
                      checked={user.status === 1}
                      onChange={() => handleToggleStatus(user)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setSelectedCashier(user);
                        setOpenEditDialog(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(user.id)}
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
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nueva Cajero</DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={newCashier.fullname}
            onChange={(e) =>
              setNewCashier((prev) => ({ ...prev, fullname: e.target.value }))
            }
          />
          <TextField
            label="Correo"
            fullWidth
            margin="normal"
            value={newCashier.email}
            onChange={(e) =>
              setNewCashier((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <TextField
            label="Teléfono"
            fullWidth
            margin="normal"
            value={newCashier.phone}
            onChange={(e) =>
              setNewCashier((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
          <TextField
            label="Contraseña"
            fullWidth
            type="password"
            margin="normal"
            value={newCashier.password}
            onChange={(e) =>
              setNewCashier((prev) => ({ ...prev, password: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Cajero</DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={selectedCashier?.fullname || ""}
            onChange={(e) =>
              setSelectedCashier((prev: any) => ({
                ...prev,
                fullname: e.target.value,
              }))
            }
          />
          <TextField
            label="Correo"
            fullWidth
            margin="normal"
            value={selectedCashier?.email || ""}
            onChange={(e) =>
              setSelectedCashier((prev: any) => ({
                ...prev,
                email: e.target.value,
              }))
            }
          />
          <TextField
            label="Teléfono"
            fullWidth
            margin="normal"
            value={selectedCashier?.phone || ""}
            onChange={(e) =>
              setSelectedCashier((prev: any) => ({
                ...prev,
                phone: e.target.value,
              }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleUpdateCashier}
            variant="contained"
            color="primary"
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

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

export default SnackCrudCashier;
