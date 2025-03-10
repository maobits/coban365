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
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../glamour/ThemeContext";
import {
  getTypesCorrespondent,
  createCorrespondent,
  getCorrespondents, // 🔹 Importamos la función para obtener la lista de corresponsales
  updateCorrespondent,
  deleteCorrespondent,
} from "../../store/CrudCorrespondent";
import { getProfiles } from "../../store/Profile";

const SnackCrudCorrespondent: React.FC<{ permissions: string[] }> = ({
  permissions,
}) => {
  const { colors, fonts } = useTheme();
  const navigate = useNavigate();
  const [correspondents, setCorrespondents] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newCorrespondent, setNewCorrespondent] = useState({
    type_id: null,
    code: "",
    operator_id: null,
    name: "",
    location: { departamento: "", ciudad: "" },
  });
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedCorrespondent, setSelectedCorrespondent] = useState<any>(null);

  useEffect(() => {
    if (!permissions.includes("manageCorrespondents")) {
      navigate("/profile");
    }
  }, [permissions, navigate]);

  // Cargar lista de corresponsales, tipos y operadores
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesData, profilesData, correspondentsData] = await Promise.all(
          [getTypesCorrespondent(), getProfiles(), getCorrespondents()]
        );

        if (typesData.success && Array.isArray(typesData.data)) {
          setTypes(typesData.data);
        }

        if (profilesData.success && Array.isArray(profilesData.users)) {
          setProfiles(profilesData.users);
        }

        if (
          correspondentsData.success &&
          Array.isArray(correspondentsData.data)
        ) {
          setCorrespondents(correspondentsData.data);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
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
    setNewCorrespondent({
      type_id: null,
      code: "",
      operator_id: null,
      name: "",
      location: { departamento: "", ciudad: "" },
    });
  };

  const handleCreateCorrespondent = async () => {
    try {
      if (
        newCorrespondent.type_id === null ||
        newCorrespondent.operator_id === null ||
        newCorrespondent.code.trim() === "" ||
        newCorrespondent.name.trim() === "" ||
        newCorrespondent.location.departamento.trim() === "" ||
        newCorrespondent.location.ciudad.trim() === ""
      ) {
        setAlertMessage("Todos los campos son obligatorios.");
        setAlertType("error");
        return;
      }

      const response = await createCorrespondent({
        type_id: newCorrespondent.type_id as number,
        code: newCorrespondent.code,
        operator_id: newCorrespondent.operator_id as number,
        name: newCorrespondent.name,
        location: newCorrespondent.location,
      });

      if (response.success) {
        setAlertMessage("Corresponsal creado exitosamente.");
        setAlertType("success");
        handleCloseDialog();

        // 🔹 Actualizar la lista de corresponsales después de crear uno nuevo
        const updatedList = await getCorrespondents();
        if (updatedList.success) {
          setCorrespondents(updatedList.data);
        }
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      console.error("Error al crear corresponsal:", error);
      setAlertMessage("Error en el servidor.");
      setAlertType("error");
    }
  };

  const handleEditCorrespondent = (correspondent: any) => {
    setSelectedCorrespondent({
      ...correspondent,
      location: correspondent.location
        ? JSON.parse(correspondent.location)
        : { departamento: "", ciudad: "" },
    });
    setOpenEditDialog(true);
  };

  const handleUpdateCorrespondent = async () => {
    if (!selectedCorrespondent) return;

    try {
      const response = await updateCorrespondent(selectedCorrespondent);

      if (response.success) {
        setAlertMessage("Corresponsal actualizado correctamente.");
        setAlertType("success");

        const updatedList = await getCorrespondents();
        if (updatedList.success) {
          setCorrespondents(updatedList.data);
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

  const handleDeleteCorrespondent = async (correspondentId: number) => {
    if (
      !window.confirm("¿Estás seguro de que deseas eliminar este corresponsal?")
    )
      return;

    try {
      const response = await deleteCorrespondent(correspondentId);

      if (response.success) {
        console.log("Corresponsal eliminado:", response.message);
        alert("Corresponsal eliminado correctamente");

        // 🔹 Actualizar la lista de corresponsales después de eliminar uno
        const updatedList = await getCorrespondents();
        if (updatedList.success) {
          setCorrespondents(updatedList.data);
        }
      } else {
        alert("Error al eliminar: " + response.message);
      }
    } catch (error) {
      alert("Error en la eliminación");
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
        Gestión de Corresponsales
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={handleOpenDialog}
      >
        Nuevo Corresponsal
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
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Operador</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {correspondents.map((correspondent) => {
                const location = correspondent.location
                  ? JSON.parse(correspondent.location)
                  : {
                      departamento: "No especificado",
                      ciudad: "No especificado",
                    };

                return (
                  <TableRow key={correspondent.id}>
                    <TableCell>{correspondent.code}</TableCell>
                    <TableCell>{correspondent.name}</TableCell>
                    <TableCell>
                      {correspondent.type_name || "Desconocido"}
                    </TableCell>
                    <TableCell>
                      {correspondent.operator_name || "Desconocido"}
                    </TableCell>
                    <TableCell>{`${location.departamento}, ${location.ciudad}`}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditCorrespondent(correspondent)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() =>
                          handleDeleteCorrespondent(correspondent.id)
                        }
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal para crear corresponsal */}
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
          Nuevo Corresponsal
        </DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <TextField
            fullWidth
            label="Código"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            onChange={(e) =>
              setNewCorrespondent({ ...newCorrespondent, code: e.target.value })
            }
          />
          <TextField
            fullWidth
            label="Nombre"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            onChange={(e) =>
              setNewCorrespondent({ ...newCorrespondent, name: e.target.value })
            }
          />
          <Autocomplete
            options={types}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, newValue) =>
              setNewCorrespondent((prev) => ({
                ...prev,
                type_id: newValue?.id || null,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tipo de Corresponsal"
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
          <Autocomplete
            options={profiles}
            getOptionLabel={(option) => option.fullname}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, newValue) =>
              setNewCorrespondent((prev) => ({
                ...prev,
                operator_id: newValue?.id || null,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Operador"
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
            label="Departamento"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            onChange={(e) =>
              setNewCorrespondent({
                ...newCorrespondent,
                location: {
                  ...newCorrespondent.location,
                  departamento: e.target.value,
                },
              })
            }
          />
          <TextField
            fullWidth
            label="Ciudad"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            onChange={(e) =>
              setNewCorrespondent({
                ...newCorrespondent,
                location: {
                  ...newCorrespondent.location,
                  ciudad: e.target.value,
                },
              })
            }
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: colors.text_white }}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateCorrespondent}
            variant="contained"
            sx={{ backgroundColor: colors.secondary }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para editar corresponsal */}
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
          Editar Corresponsal
        </DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <TextField
            fullWidth
            label="Código"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            value={selectedCorrespondent?.code || ""}
            onChange={(e) =>
              setSelectedCorrespondent({
                ...selectedCorrespondent,
                code: e.target.value,
              })
            }
          />
          <TextField
            fullWidth
            label="Nombre"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            value={selectedCorrespondent?.name || ""}
            onChange={(e) =>
              setSelectedCorrespondent({
                ...selectedCorrespondent,
                name: e.target.value,
              })
            }
          />
          <Autocomplete
            options={types}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={
              types.find((t) => t.id === selectedCorrespondent?.type_id) || null
            }
            onChange={(_, newValue) =>
              setSelectedCorrespondent((prev) => ({
                ...prev,
                type_id: newValue?.id || null,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tipo de Corresponsal"
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
          <Autocomplete
            options={profiles}
            getOptionLabel={(option) => option.fullname}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={
              profiles.find(
                (p) => p.id === selectedCorrespondent?.operator_id
              ) || null
            }
            onChange={(_, newValue) =>
              setSelectedCorrespondent((prev) => ({
                ...prev,
                operator_id: newValue?.id || null,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Operador"
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
            label="Departamento"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            value={selectedCorrespondent?.location.departamento || ""}
            onChange={(e) =>
              setSelectedCorrespondent((prev) => ({
                ...prev,
                location: {
                  ...prev.location,
                  departamento: e.target.value,
                },
              }))
            }
          />
          <TextField
            fullWidth
            label="Ciudad"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            value={selectedCorrespondent?.location.ciudad || ""}
            onChange={(e) =>
              setSelectedCorrespondent((prev) => ({
                ...prev,
                location: {
                  ...prev.location,
                  ciudad: e.target.value,
                },
              }))
            }
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
            onClick={handleUpdateCorrespondent}
            variant="contained"
            sx={{ backgroundColor: colors.secondary }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SnackCrudCorrespondent;
