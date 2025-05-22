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
  getTransactionsByCash,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../store/transaction/CrudTransactions";
import { getCashByCashier } from "../../store/crash/CrudCrash";
import { getCorrespondentByCash } from "../../store/correspondent/CrudCorrespondent";
import Chip from "@mui/material/Chip";

// Plugins.
import SnackPluginDeposits from "../../snacks/ui/integral-box/plugins/SnackPluginDeposits";

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

  // Esstados para los plugins.
  const [selectedCorrespondent, setSelectedCorrespondent] = useState<any>(null);
  const [selectedCash, setSelectedCash] = useState<any>(null);
  const [correspondents, setCorrespondents] = useState<any[]>([]);

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

      const cashRes = await getCashByCashier(user.id);

      if (cashRes.success && cashRes.data.length > 0) {
        const firstCash = cashRes.data[0];
        setSelectedCash(firstCash);

        const corrRes = await getCorrespondentByCash(firstCash.id);
        if (corrRes.success && corrRes.data) {
          setCorrespondents([corrRes.data]);
          setSelectedCorrespondent(corrRes.data);
        }

        // 👇 Obtener transacciones de esa caja
        const transRes = await getTransactionsByCash(firstCash.id);
        if (transRes.success) {
          setTransactions(transRes.data);
        }
      } else {
        console.warn("⚠️ No se encontraron cajas asignadas al cajero.");
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

  // LOG.
  console.log("🔎 selectedCorrespondent:", selectedCorrespondent);
  console.log("🔎 selectedCash:", selectedCash);

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
        Gestión de transacciones del corresponsal:
      </Typography>

      {correspondents.length > 0 && (
        <Autocomplete
          options={correspondents}
          getOptionLabel={(option) => option.name}
          value={selectedCorrespondent}
          onChange={(_, value) => setSelectedCorrespondent(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Seleccionar Corresponsal"
              sx={{ maxWidth: 400, mb: 2 }}
            />
          )}
        />
      )}
      {selectedCorrespondent && selectedCash && (
        <Box
          sx={{
            mt: 4,
            p: 4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: 4,
          }}
        >
          <Typography
            variant="h5"
            fontFamily={fonts.heading}
            color={colors.text_white}
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            Movimientos del corresponsal{" "}
            <Box component="span" fontWeight="bold" color={colors.secondary}>
              {selectedCorrespondent.name}
            </Box>
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 3 }}>
            <SnackPluginDeposits
              correspondent={selectedCorrespondent}
              cash={selectedCash}
              onTransactionComplete={fetchInitialData}
            />
          </Box>
        </Box>
      )}

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
                <TableCell>Impacto</TableCell>
                <TableCell>Nota</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.transaction_type_name}</TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">
                      ${parseFloat(t.cost).toFixed(2)}
                    </Typography>
                  </TableCell>
                  {/* Impacto */}
                  <TableCell>
                    {t.polarity === 1 ? (
                      <Chip label="Positivo" color="success" />
                    ) : (
                      <Chip label="Negativo" color="error" />
                    )}
                  </TableCell>

                  <TableCell>{t.note || "—"}</TableCell>
                  <TableCell>{t.formatted_date}</TableCell>

                  {/* Estado como switch */}
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
    </Box>
  );
};

export default SnackCrudTransactionCheckout;
