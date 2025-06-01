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
  updateCorrespondentState,
} from "../../store/correspondent/CrudCorrespondent";
import { getAdminProfiles } from "../../store/profile/Profile";
import { getTransactionTypes } from "../../store/transaction/CrudCorrespondent";
import { Switch } from "@mui/material";

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
    transactions: [] as { id: number; name: string }[],
    credit_limit: 0,
  });
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedCorrespondent, setSelectedCorrespondent] = useState<any>(null);

  // Lista de transacciones.
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<any[]>([]);

  // Normalizar
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // Lista de transacciones por defecto:

  const defaultTransactionNames = [
    "Recaudos",
    "Retiro",
    "Depósito",
    "Abono a tarjeta de crédito",
    "Pago de crédito",
    "Retiro con tarjeta",
    "Retiro Nequi",
    "Saldo",
    "Transferencia",
    "Ahorro ALM",
    "Préstamo de terceros",
    "Pago a tercero",
    "Préstamo a tercero",
    "Pago de tercero",
    "Compensación",
    "Transferir a otra caja",
  ];

  useEffect(() => {
    if (!permissions.includes("manageCorrespondents")) {
      navigate("/profile");
    }
  }, [permissions, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesData, profilesData, correspondentsData, transactionsData] =
          await Promise.all([
            getTypesCorrespondent(),
            getAdminProfiles(),
            getCorrespondents(),
            getTransactionTypes(),
          ]);

        // Logs para depurar
        console.log("📌 Tipos de Corresponsales:", typesData);
        console.log("📌 Perfiles de Usuarios:", profilesData);
        console.log("📌 Transacciones Disponibles:", transactionsData);
        console.log("📌 Corresponsales:", correspondentsData);

        if (transactionsData.success && Array.isArray(transactionsData.data)) {
          setTransactionTypes(transactionsData.data);

          const normalize = (text: string) =>
            text
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();

          const defaultTransactions = transactionsData.data.filter((t: any) =>
            defaultTransactionNames.map(normalize).includes(normalize(t.name))
          );

          // 🟡 Establecer como predeterminado al crear
          setNewCorrespondent((prev) => ({
            ...prev,
            transactions: defaultTransactions.map((t: any) => ({
              id: t.id,
              name: t.name,
            })),
          }));
        }

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
        console.error("❌ Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenDialog = () => {
    const defaultTransactionNames = [
      "Recaudos",
      "Retiro",
      "Depósito",
      "Abono a tarjeta de crédito",
      "Pago de crédito",
      "Retiro con tarjeta",
      "Retiro Nequi",
      "Saldo",
      "Transferencia",
      "Ahorro ALM",
      "Préstamo de terceros",
      "Pago a tercero",
      "Préstamo a tercero",
      "Pago de tercero",
      "Compensación",
      "Transferir a otra caja",
    ];

    const defaultTransactions = transactionTypes.filter((t: any) =>
      defaultTransactionNames.map(normalize).includes(normalize(t.name))
    );

    setNewCorrespondent({
      type_id: null,
      code: "",
      operator_id: null,
      name: "",
      location: { departamento: "", ciudad: "" },
      transactions: defaultTransactions.map((t: any) => ({
        id: t.id,
        name: t.name,
      })),
      credit_limit: 0,
    });

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
      transactions: [], // ✅ ¡Muy importante!
      credit_limit: 0,
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
        transactions: newCorrespondent.transactions,
        credit_limit: newCorrespondent.credit_limit, // ✅ Agregado correctamente
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
      transactions: correspondent.transactions
        ? JSON.parse(correspondent.transactions)
        : [],
    });

    setSelectedTransactions(
      correspondent.transactions ? JSON.parse(correspondent.transactions) : []
    );

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
                <TableCell>Cupo</TableCell>
                <TableCell>Estado</TableCell>
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
                      {correspondent.credit_limit !== null &&
                      correspondent.credit_limit !== undefined
                        ? new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(correspondent.credit_limit)
                        : "Sin cupo"}
                    </TableCell>

                    <TableCell>
                      <Switch
                        checked={correspondent.state === 1}
                        onChange={async (e) => {
                          const newState = e.target.checked ? 1 : 0;
                          try {
                            const result = await updateCorrespondentState(
                              correspondent.id,
                              newState
                            );
                            if (result.success) {
                              setAlertMessage(
                                newState === 1
                                  ? "Corresponsal activado correctamente."
                                  : "Corresponsal desactivado correctamente."
                              );
                              setAlertType("success");

                              const updatedList = await getCorrespondents();
                              if (updatedList.success) {
                                setCorrespondents(updatedList.data);
                              }
                            } else {
                              setAlertMessage("Error al actualizar el estado.");
                              setAlertType("error");
                            }
                          } catch (error) {
                            setAlertMessage(
                              "Error al conectar con el servidor."
                            );
                            setAlertType("error");
                          }
                        }}
                        color="primary"
                      />
                    </TableCell>
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
            getOptionLabel={(option) =>
              option.fullname && option.email
                ? `${option.fullname} (${option.email})`
                : option.fullname || ""
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={
              profiles.find((p) => p.id === newCorrespondent.operator_id) ||
              null
            } // 👈 Aquí se establece el valor actual
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

          <Autocomplete
            multiple
            options={transactionTypes || []} // ✅ asegura que siempre sea un array
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={newCorrespondent.transactions} // ✅ muestra seleccionados
            onChange={(_, selected) =>
              setNewCorrespondent((prev) => ({
                ...prev,
                transactions: selected.map((t) => ({ id: t.id, name: t.name })),
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tipos de Transacciones"
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
            label="Cupo en COP"
            variant="outlined"
            value={
              typeof newCorrespondent.credit_limit === "number"
                ? newCorrespondent.credit_limit.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  })
                : ""
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              setNewCorrespondent({
                ...newCorrespondent,
                credit_limit: Number(raw),
              });
            }}
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
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
            getOptionLabel={(option) =>
              option.fullname && option.email
                ? `${option.fullname} (${option.email})`
                : option.fullname || ""
            }
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
          <Autocomplete
            multiple
            options={transactionTypes.filter(
              (t) =>
                !selectedCorrespondent?.transactions?.some(
                  (sel: any) => sel.id === t.id
                )
            )}
            getOptionLabel={(option) => option.name}
            value={selectedTransactions}
            onChange={(_, selected) => {
              setSelectedTransactions(selected);
              setSelectedCorrespondent((prev) => ({
                ...prev,
                transactions: selected.map((t) => ({ id: t.id, name: t.name })),
              }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tipos de Transacciones"
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
            label="Cupo en COP"
            variant="outlined"
            value={
              selectedCorrespondent?.credit_limit?.toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }) || "$0"
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              setSelectedCorrespondent((prev: any) => ({
                ...prev,
                credit_limit: Number(raw),
              }));
            }}
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
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

export default SnackCrudCorrespondent;
