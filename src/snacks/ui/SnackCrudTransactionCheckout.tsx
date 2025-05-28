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
  Badge,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useTheme } from "../../glamour/ThemeContext";
import Avatar from "@mui/material/Avatar";
import PersonIcon from "@mui/icons-material/Person";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import InfoIcon from "@mui/icons-material/Info";
import SnackPagination from "./utils/SnackPagination";

import {
  getTransactionsByCash,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../store/transaction/CrudTransactions";
import { getCashByCashier } from "../../store/crash/CrudCrash";
import { getCorrespondentByCash } from "../../store/correspondent/CrudCorrespondent";
import Chip from "@mui/material/Chip";
import { getDebtToBankByCorrespondent } from "../../store/transaction/CrudTransactions"; // ya lo usas en el otro archivo
import { acceptTransferFromAnotherBank } from "../../store/transaction/CrudTransactions";

// Plugins.
import SnackPluginDeposits from "../../snacks/ui/integral-box/plugins/SnackPluginDeposits";
import SnackPluginWithdrawals from "../../snacks/ui/integral-box/plugins/SnackPluginWithdrawals";
import SnackPluginOthers from "../../snacks/ui/integral-box/plugins/SnackPluginOthers";
import SnackPluginThirdParty from "../../snacks/ui/integral-box/plugins/SnackPluginThirdParty";
import SnackPluginCompesation from "./integral-box/plugins/SnackPluginCompensation";
import SnackPluginTransfer from "../../snacks/ui/integral-box/plugins/SnackPluginTransfer";

import FinancialSummaryPanel from "../../snacks/ui/integral-box/plugins/SnackFinancialSummaryPanel";

// Utils.
import SnackLottieNoData from "./utils/SnackLottieNoData";
import SnackLottieMoney from "./utils/SnackLottieMoney";

import {
  getCashIncomes,
  getCashWithdrawals,
} from "../../store/transaction/CrudTransactions";

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

  // Transferencias pendientes.
  const [pendingTransferAmount, setPendingTransferAmount] = useState(0);
  const [receivedTransfers, setReceivedTransfers] = useState<any[]>([]);
  const [incomingTransfers, setIncomingTransfers] = useState<any[]>([]);

  // Modal transferencias pendientes.
  const [showIncomingModal, setShowIncomingModal] = useState(false);

  // Estados de paginación.
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20); // ← valor inicial válido
  const itemsPerPage = rowsPerPage;
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0); // ← AGREGA ESTA LÍNEA

  // Estados Resumen financiero.
  const [initialConfig, setInitialConfig] = useState(0);
  const [incomes, setIncomes] = useState(0);
  const [withdrawals, setWithdrawals] = useState(0);
  const [bankDebt, setBankDebt] = useState(0);
  const [offsets, setOffsets] = useState(0);

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
      await loadCashAndTransactions(user.id);

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
        const transRes = await getTransactionsByCash(
          firstCash.id,
          currentPage,
          itemsPerPage
        );
        if (transRes.success) {
          setTransactions(transRes.data.items);
          setTotalPages(transRes.data.total_pages);
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

  {
    /*  */
  }
  const loadCashAndTransactions = async (
    cashierId: number,
    page = 1,
    perPage = 10
  ) => {
    const cashRes = await getCashByCashier(cashierId);
    if (cashRes.success && cashRes.data.length > 0) {
      const firstCash = cashRes.data[0];
      setSelectedCash(firstCash);

      const corrRes = await getCorrespondentByCash(firstCash.id);
      if (corrRes.success && corrRes.data) {
        setCorrespondents([corrRes.data]);
        setSelectedCorrespondent(corrRes.data);
      }

      // Deuda al banco (global)
      const debtRes = await getDebtToBankByCorrespondent(corrRes.data.id);
      if (debtRes.success) {
        setBankDebt(debtRes.data.debt_to_bank || 0);

        // Solo el saldo inicial de esta caja
        const cajaActual = (debtRes.data.cashes || []).find(
          (c: any) => c.id === firstCash.id
        );
        setInitialConfig(cajaActual?.initial_amount || 0);

        // Compensaciones (globales)
        const compensationTotal = (debtRes.data.items || [])
          .filter(
            (tx: any) => tx.transaction_type_name === "offset_transaction"
          )
          .reduce((sum: number, tx: any) => sum + Number(tx.cost || 0), 0);
        setOffsets(compensationTotal);
      }

      // Ingresos y egresos de esta caja
      const [incomeRes, withdrawalRes] = await Promise.all([
        getCashIncomes(firstCash.id),
        getCashWithdrawals(firstCash.id),
      ]);
      setIncomes(incomeRes?.total || 0);
      setWithdrawals(withdrawalRes?.total || 0);

      // Transacciones
      const transRes = await getTransactionsByCash(firstCash.id, page, perPage);
      if (transRes.success) {
        setTransactions(transRes.data.items);

        // Filtrar las transacciones.
        const pendingTransfers = (transRes.data.items || []).filter(
          (t: any) =>
            t.is_transfer === 1 &&
            t.transfer_status === 0 &&
            t.id_cash === firstCash.id // caja origen actual
        );

        const pendingTransferTotal = pendingTransfers.reduce(
          (sum: number, t: any) => sum + Number(t.cost || 0),
          0
        );
        setPendingTransferAmount(pendingTransferTotal); // nuevo estado

        //  Transferencias pendientes ENTRANTES (donde esta caja es destino)
        const incoming = transRes.data.items.filter(
          (t: any) =>
            t.is_transfer === 1 &&
            t.transfer_status === 0 &&
            t.box_reference === firstCash.id &&
            t.id_cash !== firstCash.id
        );
        setIncomingTransfers(incoming); // almacena para el modal

        setTotalItems(transRes.data.total);
      }
    }
  };

  // LOG.
  console.log("🔎 selectedCorrespondent:", selectedCorrespondent);
  console.log("🔎 selectedCash:", selectedCash);

  // Funciones para aceptar y rechazar las transferencias.
  const handleAcceptTransfer = async (transactionId: number) => {
    const result = await acceptTransferFromAnotherBank(transactionId);
    if (result.success) {
      setAlertMessage("Transferencia aceptada exitosamente.");
      setAlertType("success");
      fetchInitialData();
    } else {
      setAlertMessage(result.message || "Error al aceptar transferencia.");
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
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        {/* Título */}
        <Grid item>
          <Typography
            variant="h4"
            fontFamily={fonts.heading}
            color={colors.primary}
            gutterBottom
          >
            Gestión de transacciones del corresponsal:
          </Typography>
        </Grid>

        {/* Saldo + Botón de Transferencia */}
        <Grid item>
          <Box display="flex" alignItems="center" gap={2}>
            {/* Saldo en caja */}
            <Box
              sx={{
                backgroundColor: colors.primary,
                color: colors.text_white,
                padding: "12px 20px",
                borderRadius: 2,
                textAlign: "center",
                minWidth: 160,
              }}
            >
              <Typography fontSize="0.8rem">Saldo en caja</Typography>
              <Typography fontWeight="bold" fontSize="1.2rem">
                $
                {new Intl.NumberFormat("es-CO").format(
                  initialConfig + incomes - withdrawals - offsets
                )}
              </Typography>
            </Box>

            {/* Botón Transferencias (SnackPluginTransfer) */}
            {selectedCash && selectedCorrespondent && (
              <SnackPluginTransfer
                correspondent={selectedCorrespondent}
                cash={selectedCash}
                onTransactionComplete={fetchInitialData}
              />
            )}
            {incomingTransfers.length > 0 && (
              <IconButton
                onClick={() => setShowIncomingModal(true)}
                sx={{
                  backgroundColor: "#fff3e0",
                  border: `2px solid ${colors.warning || "#ffa726"}`,
                  ml: 1,
                }}
              >
                <Badge badgeContent={incomingTransfers.length} color="warning">
                  <CreditCardIcon sx={{ color: "#f57c00" }} />
                </Badge>
              </IconButton>
            )}
          </Box>
          {pendingTransferAmount > 0 && (
            <Box
              sx={{
                backgroundColor: "#fff3e0",
                border: `2px solid ${colors.warning || "#ffa726"}`,
                borderRadius: 2,
                padding: "10px 16px",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CreditCardIcon sx={{ color: "#f57c00" }} />
              <Typography
                sx={{
                  color: "#f57c00",
                  fontWeight: "bold",
                  fontSize: "1rem",
                }}
              >
                Transferencia pendiente de ser aceptada:
              </Typography>
              <Typography
                sx={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#e65100",
                }}
              >
                ${new Intl.NumberFormat("es-CO").format(pendingTransferAmount)}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {correspondents.length > 0 && (
        <Autocomplete
          options={correspondents}
          getOptionLabel={(option) => option.name}
          value={selectedCorrespondent}
          onChange={async (_, value) => {
            if (!cashier || !value) {
              setSelectedCorrespondent(null);
              setSelectedCash(null);
              setTransactions([]);
              return;
            }
            setSelectedCorrespondent(value);
            await loadCashAndTransactions(cashier.id);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Seleccionar Corresponsal"
              sx={{ maxWidth: 400, mb: 2 }}
            />
          )}
        />
      )}
      {selectedCorrespondent?.state === 1 && selectedCash?.state === 1 && (
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
              {selectedCorrespondent?.name || "—"}
            </Box>
          </Typography>

          <Grid container spacing={2} alignItems="center" mt={2}>
            {/* Botones a la izquierda */}
            <Grid item xs={12} md={7}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <SnackPluginDeposits
                  correspondent={selectedCorrespondent}
                  cash={selectedCash}
                  onTransactionComplete={fetchInitialData}
                />
                <SnackPluginWithdrawals
                  correspondent={selectedCorrespondent}
                  cash={selectedCash}
                  onTransactionComplete={fetchInitialData}
                />
                <SnackPluginOthers
                  correspondent={selectedCorrespondent}
                  cash={selectedCash}
                  onTransactionComplete={fetchInitialData}
                />
                <SnackPluginThirdParty
                  correspondent={selectedCorrespondent}
                  cash={selectedCash}
                  onTransactionComplete={fetchInitialData}
                />
                <SnackPluginCompesation
                  correspondent={selectedCorrespondent}
                  cash={selectedCash}
                  onTransactionComplete={fetchInitialData}
                />
              </Box>
            </Grid>

            {/* Panel financiero a la derecha */}
            <Grid item xs={12} md={5}>
              <FinancialSummaryPanel
                bankDebt={bankDebt}
                cashBalance={
                  initialConfig +
                  incomes -
                  withdrawals -
                  offsets -
                  pendingTransferAmount
                }
                creditLimit={selectedCorrespondent?.credit_limit || 0}
                cashCapacity={selectedCash?.capacity || 1}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <CircularProgress />
        </Box>
      ) : selectedCorrespondent?.state === 1 && selectedCash?.state === 1 ? (
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
              {Array.isArray(transactions) && transactions.length > 0 ? (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.transaction_type_name}</TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        ${parseFloat(t.cost).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {t.polarity === 1 ? (
                        <Chip label="Positivo" color="success" />
                      ) : (
                        <Chip label="Negativo" color="error" />
                      )}
                    </TableCell>
                    <TableCell>
                      {t.is_transfer === 1 && t.transfer_status === 0 ? (
                        <Typography
                          sx={{
                            fontWeight:
                              t.is_transfer === 1 && t.transfer_status === 0
                                ? "bold"
                                : "normal",
                            color:
                              t.is_transfer === 1 && t.transfer_status === 0
                                ? "orange"
                                : "inherit",
                          }}
                        >
                          {t.note || "—"}
                        </Typography>
                      ) : (
                        t.note || "—"
                      )}
                    </TableCell>

                    <TableCell>{t.formatted_date}</TableCell>
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay transacciones disponibles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <SnackPagination
            total={totalItems}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={(newPage) => {
              setCurrentPage(newPage);
              loadCashAndTransactions(cashier.id, newPage, rowsPerPage);
            }}
            onRowsPerPageChange={(newRows) => {
              setRowsPerPage(newRows);
              setCurrentPage(1);
              loadCashAndTransactions(cashier.id, 1, newRows);
            }}
          />
        </TableContainer>
      ) : selectedCash?.state === 0 ? (
        <Box sx={{ mt: 8, textAlign: "center" }}>
          <SnackLottieMoney width={250} height={250} />
          <Typography
            variant="h6"
            sx={{
              mt: 3,
              fontSize: "1.3rem",
              color: "text.secondary",
              fontWeight: "medium",
            }}
          >
            La caja seleccionada está deshabilitada. Actívala para registrar
            movimientos.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mt: 8, textAlign: "center" }}>
          <SnackLottieNoData width={250} height={250} />
          <Typography
            variant="h6"
            sx={{
              mt: 3,
              fontSize: "1.3rem",
              color: "text.secondary",
              fontWeight: "medium",
            }}
          >
            👆 Selecciona un corresponsal con una caja activa para ver las
            transacciones.
          </Typography>
        </Box>
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
      <Dialog
        open={showIncomingModal}
        onClose={() => setShowIncomingModal(false)}
      >
        <DialogTitle>Transferencias pendientes</DialogTitle>
        <DialogContent dividers>
          {incomingTransfers.map((t, idx) => (
            <Box key={idx} mb={2}>
              <Typography>
                💰 <b>${t.cost}</b> enviado desde <b>{t.cash_name}</b>
              </Typography>
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => handleAcceptTransfer(t.id)}
              >
                Aceptar
              </Button>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIncomingModal(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SnackCrudTransactionCheckout;
