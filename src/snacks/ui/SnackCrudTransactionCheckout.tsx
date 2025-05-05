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
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  CircularProgress,
  Snackbar,
  Alert,
  Switch,
  Autocomplete,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useTheme } from "../../glamour/ThemeContext";

import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionTypesByCorrespondent,
} from "../../store/transaction/CrudTransactions";
import { getCashByCashier } from "../../store/crash/CrudCrash";
import { getMyCorrespondent } from "../../store/correspondent/CrudCorrespondent";
import SnackBalanceThird from "../../snacks/ui/integral-box/SnackBalanceThird";
import { InputAdornment } from "@mui/material";

interface Props {
  permissions: string[];
}

const SnackCrudTransactionCheckout: React.FC<Props> = ({ permissions }) => {
  const { colors, fonts } = useTheme();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
  const [correspondents, setCorrespondents] = useState<any[]>([]);
  const [cashes, setCashes] = useState<any[]>([]);
  const [cashier, setCashier] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [transactionIdToDelete, setTransactionIdToDelete] = useState<
    number | null
  >(null);

  const [newTransaction, setNewTransaction] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  const [formattedCost, setFormattedCost] = useState("0");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem("userSession");
      if (!storedUser) throw new Error("No hay sesión almacenada");
      const user = JSON.parse(storedUser);
      setCashier(user);

      const [transRes, _, corrRes] = await Promise.all([
        getTransactions(user.id),
        Promise.resolve({ success: true, data: [] }), // reemplazado por getTransactionTypesByCorrespondent dinámico
        getMyCorrespondent(user.id),
      ]);

      if (transRes.success) {
        setTransactions(transRes.data); // ✅ usa directamente la respuesta del backend
      }

      if (corrRes.success) {
        setCorrespondents(corrRes.data);
      }
    } catch (error) {
      console.error("❌ Error al cargar datos iniciales:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleOpenDialog = () => {
    setNewTransaction({
      id_cashier: cashier?.id || null,
      id_cash: null,
      id_correspondent: null,
      transaction_type_id: null,
      polarity: true,
      cost: 0,
      state: true,
      note: "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewTransaction(null);
    setTransactionTypes([]); // limpia los tipos de transacción al cerrar
    setCashes([]);
  };

  const handleCorrespondentChange = async (correspondent: any) => {
    setNewTransaction((prev: any) => ({
      ...prev,
      id_correspondent: correspondent?.id || null,
    }));

    if (cashier?.id) {
      const cashRes = await getCashByCashier(cashier.id);
      if (cashRes.success) {
        setCashes(cashRes.data);
      }
    }

    if (correspondent?.id) {
      const typesRes = await getTransactionTypesByCorrespondent(
        correspondent.id
      );
      if (typesRes.success) {
        setTransactionTypes(typesRes.data);
      } else {
        setTransactionTypes([]);
      }
    }
  };

  const handleCreateTransaction = async () => {
    if (
      !newTransaction.id_cash ||
      !newTransaction.transaction_type_id ||
      newTransaction.cost <= 0
    ) {
      setAlertMessage("Complete todos los campos requeridos.");
      setAlertType("error");
      return;
    }

    try {
      console.log("📤 Enviando transacción al backend:", newTransaction); // 👈 Aquí se muestra

      const response = await createTransaction(newTransaction);
      if (response.success) {
        setAlertMessage("Transacción creada exitosamente.");
        setAlertType("success");
        handleCloseDialog();
        fetchInitialData();
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error en el servidor.");
      setAlertType("error");
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedTransaction(null);
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction || selectedTransaction.cost <= 0) {
      setAlertMessage("Complete los campos obligatorios.");
      setAlertType("error");
      return;
    }

    try {
      const response = await updateTransaction(selectedTransaction);
      if (response.success) {
        setAlertMessage("Transacción actualizada correctamente.");
        setAlertType("success");
        handleCloseEditDialog();
        fetchInitialData();
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error en el servidor.");
      setAlertType("error");
    }
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactionIdToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDeleteTransaction = async () => {
    if (transactionIdToDelete === null) return;

    try {
      const response = await deleteTransaction(transactionIdToDelete);
      if (response.success) {
        setAlertMessage("Transacción eliminada correctamente.");
        setAlertType("success");
        fetchInitialData();
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error eliminando transacción.");
      setAlertType("error");
    } finally {
      setTransactionIdToDelete(null);
      setOpenDeleteDialog(false);
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
        Gestión de Transacciones
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={handleOpenDialog}
      >
        Nueva Transacción
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
                <TableCell>Tipo</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Corresponsal</TableCell>
                <TableCell>Caja</TableCell>
                <TableCell>Tercero</TableCell>{" "}
                {/* ✅ Muestra el nombre del tercero */}
                <TableCell>Fecha</TableCell>{" "}
                {/* ✅ Ahora es la fecha legible */}
                <TableCell>Nota</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.transaction_type_name}</TableCell>
                  <TableCell>${parseFloat(t.cost).toFixed(2)}</TableCell>
                  <TableCell>{t.correspondent_name || "—"}</TableCell>
                  <TableCell>{t.cash_name || "—"}</TableCell>

                  {/* Tercero */}
                  <TableCell>
                    {t.client_reference_name ? t.client_reference_name : "—"}
                  </TableCell>
                  {/* Cliente → cambia a fecha */}
                  <TableCell>{t.formatted_date}</TableCell>

                  <TableCell>{t.note || "—"}</TableCell>
                  <TableCell>
                    <Switch checked={t.state === 1} disabled />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditTransaction(t)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteTransaction(t.id)}
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

      {/* Modal Crear */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Nueva Transacción</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Cajero"
            value={cashier?.fullname || ""}
            disabled
          />
          <Autocomplete
            options={correspondents}
            getOptionLabel={(option) => option.name}
            onChange={(_, value) => handleCorrespondentChange(value)}
            renderInput={(params) => (
              <TextField {...params} label="Corresponsal" margin="normal" />
            )}
          />
          <Autocomplete
            options={cashes}
            getOptionLabel={(option) => `${option.name} (ID ${option.id})`}
            onChange={(_, value) =>
              setNewTransaction((prev: any) => ({
                ...prev,
                id_cash: value?.id || null,
              }))
            }
            renderInput={(params) => (
              <TextField {...params} label="Caja disponible" margin="normal" />
            )}
          />

          {console.log(
            "📌 ID del corresponsal actual:",
            newTransaction?.id_correspondent
          )}
          {newTransaction?.id_correspondent && (
            <Box mt={3} mb={2}>
              <Paper
                elevation={3}
                sx={{
                  padding: 2,
                  backgroundColor: colors.background_grey,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <SnackBalanceThird
                  correspondentId={newTransaction.id_correspondent}
                  onSelectThird={(thirdId: number | null) =>
                    setNewTransaction((prev: any) => ({
                      ...prev,
                      client_reference: thirdId,
                    }))
                  }
                />
              </Paper>
            </Box>
          )}

          <Autocomplete
            options={transactionTypes}
            getOptionLabel={(option) => option.name}
            onChange={(_, value) =>
              setNewTransaction((prev: any) => ({
                ...prev,
                transaction_type_id: value?.id || null,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tipo de Transacción"
                margin="normal"
              />
            )}
          />
          <TextField
            fullWidth
            label="Monto de la transacción"
            type="text"
            margin="normal"
            InputProps={{
              sx: {
                fontSize: "1.8rem", // Tamaño grande del valor
                fontWeight: "bold",
                textAlign: "right",
              },
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                    COP
                  </Typography>
                </InputAdornment>
              ),
            }}
            value={formattedCost}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, ""); // Elimina todo menos números
              const number = parseFloat(raw);
              const formatted = new Intl.NumberFormat("es-CO").format(
                number || 0
              );

              setFormattedCost(formatted);
              setNewTransaction((prev: any) => ({
                ...prev,
                cost: number || 0,
              }));
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateTransaction}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SnackCrudTransactionCheckout;
