import React, { useEffect, useState, useRef } from "react";
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
  Grid,
  Divider,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useTheme } from "../../glamour/ThemeContext";
import Avatar from "@mui/material/Avatar";
import PersonIcon from "@mui/icons-material/Person";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import InfoIcon from "@mui/icons-material/Info";

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
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import { openCash } from "../../store/crash/CrudCrash"; // Asegúrate de que la ruta sea correcta
import { getCashIncomes } from "../../store/transaction/CrudTransactions"; // asegúrate de que la ruta sea correcta
import { getCashWithdrawals } from "../../store/transaction/CrudTransactions";

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

  // Abrir el modal para abrir caja.
  const [openCashModal, setOpenCashModal] = useState(false);
  const [openAmount, setOpenAmount] = useState("");
  const [noteOpening, setNoteOpening] = useState("");

  // Referencias
  const cashRef = React.useRef<any>(null);
  const typeRef = React.useRef<any>(null);
  const costRef = React.useRef<any>(null);
  const montoRef = useRef<HTMLInputElement>(null); // Ref para el campo de monto

  // Controlador del modal para abrir la caja.
  const handleOpenCashModal = () => setOpenCashModal(true);
  const handleCloseCashModal = () => {
    setOpenCashModal(false);
    setOpenAmount("");
    setNoteOpening("");
  };

  // Estados para manejar ingresos, retiros y saldo en  caja.
  const [cashIncomes, setCashIncomes] = useState<any[]>([]);
  const [cashIncomesTotal, setCashIncomesTotal] = useState(0);
  const [cashWithdrawals, setCashWithdrawals] = useState<any[]>([]);
  const [cashWithdrawalsTotal, setCashWithdrawalsTotal] = useState(0);
  const [cashBalance, setCashBalance] = useState(0); // saldo de apertura
  const [cashTotal, setCashTotal] = useState(0); // saldo actual

  const handleConfirmOpenCash = async () => {
    const selectedCash = cashes.find((c) => c.id === newTransaction?.id_cash);

    if (!selectedCash || selectedCash.state !== 1) {
      setAlertMessage("La caja no está activa y no se puede abrir.");
      setAlertType("error");
      return;
    }

    const amount = parseFloat(openAmount);
    if (!amount || amount <= 0) {
      setAlertMessage("Ingrese un valor válido para abrir la caja.");
      setAlertType("error");
      return;
    }

    try {
      const data = await openCash(selectedCash.id, amount, noteOpening);

      if (data.success) {
        setAlertMessage("Caja abierta correctamente.");
        setAlertType("success");
        handleCloseCashModal();

        // 🔄 Vuelve a cargar las cajas actualizadas
        const cashRes = await getCashByCashier(cashier.id);
        if (cashRes.success) {
          setCashes(cashRes.data);

          // ✅ Reasigna la caja abierta para que se vea el nuevo estado
          setNewTransaction((prev: any) => ({
            ...prev,
            id_cash: selectedCash.id,
          }));
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("❌ Error al abrir la caja:", err);
      setAlertMessage("Error al abrir la caja.");
      setAlertType("error");
    }
  };

  useEffect(() => {
    setCashTotal(cashBalance + cashIncomesTotal - cashWithdrawalsTotal);
  }, [cashBalance, cashIncomesTotal, cashWithdrawalsTotal]);

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
    if (!newTransaction.id_cash) {
      setAlertMessage("Selecciona una caja válida.");
      setAlertType("error");
      cashRef.current?.focus();
      return;
    }

    if (!newTransaction.transaction_type_id) {
      setAlertMessage("Selecciona un tipo de transacción.");
      setAlertType("error");
      typeRef.current?.focus();
      return;
    }

    if (!newTransaction.cost || newTransaction.cost <= 0) {
      setAlertMessage("Ingresa un monto válido.");
      setAlertType("error");
      costRef.current?.focus();
      return;
    }

    try {
      console.log("📤 Enviando transacción al backend:", newTransaction); // 👈 Aquí se muestra

      const response = await createTransaction(newTransaction);
      if (!newTransaction.id_correspondent) {
        setAlertMessage("Selecciona un corresponsal.");
        setAlertType("error");
        return;
      }
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

  const fetchIncomesByCash = async (cashId: number) => {
    if (!cashId) return;

    try {
      const res = await getCashIncomes(cashId);
      if (res.success) {
        setCashIncomes(res.data); // Lista de ingresos
        setCashIncomesTotal(res.total); // Total acumulado
      } else {
        setCashIncomes([]);
        setCashIncomesTotal(0);
      }
    } catch (error) {
      console.error("❌ Error cargando ingresos:", error);
      setCashIncomes([]);
      setCashIncomesTotal(0);
    }
  };

  const fetchWithdrawalsByCash = async (cashId: number) => {
    if (!cashId) return;

    try {
      const res = await getCashWithdrawals(cashId);
      if (res.success) {
        setCashWithdrawals(res.data); // Lista de retiros
        setCashWithdrawalsTotal(res.total); // Total acumulado
      } else {
        setCashWithdrawals([]);
        setCashWithdrawalsTotal(0);
      }
    } catch (error) {
      console.error("❌ Error cargando retiros:", error);
      setCashWithdrawals([]);
      setCashWithdrawalsTotal(0);
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
      <Dialog open={openDialog} onClose={handleCloseDialog} fullScreen>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar>
              <PersonIcon />
            </Avatar>
            <Typography fontWeight="bold" variant="h6">
              Emulador de Cajero - Nueva Transacción
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {/* Sección: Información del Cajero */}
          <Divider textAlign="left" sx={{ mt: 2, mb: 1 }}>
            <Chip icon={<InfoIcon />} label="Información del Cajero" />
          </Divider>

          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 2,
                  height: 100,
                  backgroundColor: colors.background_grey,
                }}
              >
                <Typography variant="subtitle2" color={colors.text_white}>
                  Cajero:{" "}
                  <Box
                    component="span"
                    fontWeight="bold"
                    color={colors.secondary}
                  >
                    {cashier?.fullname || "—"}
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  ID:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {cashier?.id || "—"}
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Rol:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {cashier?.role || "—"}
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Correo:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {cashier?.email || "—"}
                  </Box>
                </Typography>
              </Paper>
            </Grid>

            {/* Monto */}
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 2,
                  height: 100,
                  backgroundColor: colors.background_grey,
                }}
              >
                <Typography variant="subtitle2" color={colors.text_white}>
                  Monto
                </Typography>

                <TextField
                  fullWidth
                  type="text"
                  margin="normal"
                  inputRef={montoRef} // ✅ Apunta el ref
                  InputProps={{
                    sx: {
                      fontSize: "1.8rem",
                      fontWeight: "bold",
                      textAlign: "right",
                      color: colors.text_white,
                      borderColor: colors.secondary,
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="body2" color={colors.secondary}>
                          COP
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  value={formattedCost}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
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
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: colors.background_grey,
                  color: colors.text_white,
                  height: 100,
                }}
              >
                <Typography variant="subtitle2" color={colors.secondary}>
                  Saldo en caja:
                </Typography>
                <Divider sx={{ my: 1, backgroundColor: colors.primary }} />
                <Typography variant="h6" fontWeight="bold">
                  Total Ingresos:{" "}
                  {new Intl.NumberFormat("es-CO").format(cashIncomesTotal)} COP
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                  Total Retiros:{" "}
                  {new Intl.NumberFormat("es-CO").format(cashWithdrawalsTotal)}{" "}
                  COP
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Sección: Datos de la Transacción */}
          <Divider textAlign="left" sx={{ mt: 4, mb: 1 }}>
            <Chip icon={<CreditCardIcon />} label="Datos de la Transacción" />
          </Divider>

          <Grid container spacing={2}>
            {/* Selector Corresponsal */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={correspondents}
                getOptionLabel={(option) => option.name}
                onChange={(_, value) => handleCorrespondentChange(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Seleccionar Corresponsal" />
                )}
              />
              <Paper
                sx={{ mt: 2, p: 2, backgroundColor: colors.background_grey }}
              >
                <Typography variant="subtitle2" color={colors.text_white}>
                  ID:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {correspondents.find(
                      (c) => c.id === newTransaction?.id_correspondent
                    )?.id || "—"}
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Código:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {correspondents.find(
                      (c) => c.id === newTransaction?.id_correspondent
                    )?.code || "—"}
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Nombre:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {correspondents.find(
                      (c) => c.id === newTransaction?.id_correspondent
                    )?.name || "—"}
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Locación:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {(() => {
                      const loc = correspondents.find(
                        (c) => c.id === newTransaction?.id_correspondent
                      )?.location;
                      try {
                        const parsed = JSON.parse(loc || "{}");
                        return `${parsed.departamento || "—"}, ${
                          parsed.ciudad || "—"
                        }`;
                      } catch {
                        return "—";
                      }
                    })()}
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Estado:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {correspondents.find(
                      (c) => c.id === newTransaction?.id_correspondent
                    )?.state === 1
                      ? "Activo"
                      : "Inactivo"}
                  </Box>
                </Typography>
              </Paper>
            </Grid>

            {/* Selector Caja */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={cashes}
                getOptionLabel={(option) => `${option.name} (ID ${option.id})`}
                onChange={(_, value) => {
                  const selectedCashId = value?.id || null;

                  setNewTransaction((prev: any) => ({
                    ...prev,
                    id_cash: selectedCashId,
                  }));

                  if (selectedCashId) {
                    fetchIncomesByCash(selectedCashId);
                    fetchWithdrawalsByCash(selectedCashId); // 🟢 Aquí
                  } else {
                    setCashIncomes([]);
                    setCashIncomesTotal(0);
                    setCashWithdrawals([]);
                    setCashWithdrawalsTotal(0); // 🟢 Reinicia
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Seleccionar Caja" />
                )}
              />
              <Paper
                sx={{ mt: 2, p: 2, backgroundColor: colors.background_grey }}
              >
                <Typography variant="subtitle2" color={colors.text_white}>
                  ID:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {cashes.find((c) => c.id === newTransaction?.id_cash)?.id ||
                      "—"}
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Nombre:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {cashes.find((c) => c.id === newTransaction?.id_cash)
                      ?.name || "—"}
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Capacidad:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {new Intl.NumberFormat("es-CO").format(
                      cashes.find((c) => c.id === newTransaction?.id_cash)
                        ?.capacity || 0
                    )}{" "}
                    COP
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Estado:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {cashes.find((c) => c.id === newTransaction?.id_cash)
                      ?.state === 1
                      ? "Activa"
                      : "Inactiva"}
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Estado de la caja:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {cashes.find((c) => c.id === newTransaction?.id_cash)?.open
                      ? "Abierta"
                      : "Cerrada"}
                  </Box>
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Valor con el que se abrió:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {new Intl.NumberFormat("es-CO").format(
                      cashes.find((c) => c.id === newTransaction?.id_cash)
                        ?.balance || 0
                    )}{" "}
                    COP
                  </Box>
                </Typography>

                {cashes.find((c) => c.id === newTransaction?.id_cash)?.open ===
                  0 && (
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => setOpenCashModal(true)}
                      fullWidth
                    >
                      Abrir Caja
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Selector Tipo Transacción */}
            <Grid item xs={12} md={4}>
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
                    inputRef={typeRef}
                  />
                )}
              />

              <Paper
                sx={{ mt: 2, p: 2, backgroundColor: colors.background_grey }}
              >
                <Typography variant="subtitle2" color={colors.text_white}>
                  Transacción
                </Typography>

                <Typography fontWeight="bold" color={colors.text_white}>
                  {transactionTypes.find(
                    (t) => t.id === newTransaction?.transaction_type_id
                  )?.name || "—"}
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Naturaleza:{" "}
                  {transactionTypes.find(
                    (t) => t.id === newTransaction?.transaction_type_id
                  )?.polarity
                    ? "Entrada"
                    : "Salida"}
                </Typography>

                <Typography variant="body2" color={colors.text_white}>
                  Tarifa aplicada:{" "}
                  <Box
                    component="span"
                    fontWeight="medium"
                    color={colors.secondary}
                  >
                    {new Intl.NumberFormat("es-CO").format(
                      transactionTypes.find(
                        (t) => t.id === newTransaction?.transaction_type_id
                      )?.rate || 0
                    )}{" "}
                    COP
                  </Box>
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCloseDialog}
            color="secondary"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateTransaction}
            color="primary"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCashModal} onClose={handleCloseCashModal}>
        <DialogTitle
          sx={{
            backgroundColor: colors.background_grey,
            color: colors.text_white,
            fontFamily: fonts.heading,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: colors.primary }}>
              <CreditCardIcon />
            </Avatar>
            <Typography
              fontWeight="bold"
              variant="h6"
              fontFamily={fonts.heading}
            >
              Confirmar Apertura de Caja
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            minWidth: 360,
            backgroundColor: colors.background,
            color: colors.text,
            fontFamily: fonts.main,
          }}
        >
          <Divider textAlign="left" sx={{ mt: 1, mb: 2 }}>
            <Chip
              label="Datos de Apertura"
              sx={{
                backgroundColor: colors.primary,
                color: colors.text_white,
                fontFamily: fonts.main,
              }}
            />
          </Divider>

          <Typography variant="body2" sx={{ mb: 1 }} color={colors.text}>
            Ingresa el monto con el que deseas abrir esta caja y agrega una nota
            si es necesario.
          </Typography>

          <TextField
            label="Valor de apertura"
            fullWidth
            margin="dense"
            value={new Intl.NumberFormat("es-CO").format(
              parseFloat(openAmount || "0")
            )}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              setOpenAmount(raw);
            }}
            InputProps={{
              sx: {
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: colors.text,
              },
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="body2" color={colors.secondary}>
                    COP
                  </Typography>
                </InputAdornment>
              ),
            }}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          />

          <TextField
            label="Nota de apertura"
            fullWidth
            margin="dense"
            multiline
            value={noteOpening}
            onChange={(e) => setNoteOpening(e.target.value)}
            InputProps={{
              sx: {
                color: colors.text,
              },
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
            backgroundColor: colors.background,
          }}
        >
          <Button
            onClick={handleCloseCashModal}
            color="secondary"
            variant="outlined"
            sx={{ fontFamily: fonts.main }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmOpenCash}
            color="primary"
            variant="contained"
            sx={{ fontFamily: fonts.main }}
          >
            Confirmar Apertura
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SnackCrudTransactionCheckout;
