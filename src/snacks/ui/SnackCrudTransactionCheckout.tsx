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
  const [cashier, setCashier] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [transactionIdToDelete, setTransactionIdToDelete] = useState<
    number | null
  >(null);

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  // Abrir el modal para abrir caja.
  const [openCashModal, setOpenCashModal] = useState(false);
  const [openAmount, setOpenAmount] = useState("");
  const [noteOpening, setNoteOpening] = useState("");

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

      const transRes = await getTransactions(user.id);

      if (transRes.success) {
        setTransactions(transRes.data);
      }
    } catch (error) {
      console.error("❌ Error al cargar datos iniciales:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
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
          <Typography fontWeight="bold" variant="h6">
            Nueva Transacción
          </Typography>
        </DialogTitle>
        <DialogContent>{/* Aquí empezarás desde cero */}</DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            color="secondary"
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button onClick={() => {}} color="primary" variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SnackCrudTransactionCheckout;
