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
import Avatar from "@mui/material/Avatar";
import PersonIcon from "@mui/icons-material/Person";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import InfoIcon from "@mui/icons-material/Info";
import SnackPagination from "./utils/SnackPagination";
import ShareIcon from "@mui/icons-material/Share";
import { baseUrl, isDevelopment } from "../../store/config/server";

import {
  getTransactionsByCash,
  createTransaction,
  updateTransaction,
  createTransactionNote,
} from "../../store/transaction/CrudTransactions";
import { getCashByCashier } from "../../store/crash/CrudCrash";
import { getCorrespondentByCash } from "../../store/correspondent/CrudCorrespondent";
import Chip from "@mui/material/Chip";
import { getDebtToBankByCorrespondent } from "../../store/transaction/CrudTransactions"; // ya lo usas en el otro archivo
import { acceptTransferFromAnotherBank } from "../../store/transaction/CrudTransactions";
import { cancelTransactionById } from "../../store/transaction/CrudTransactions";

// Plugins.
import SnackPluginDeposits from "../../snacks/ui/integral-box/plugins/SnackPluginDeposits";
import SnackPluginWithdrawals from "../../snacks/ui/integral-box/plugins/SnackPluginWithdrawals";
import SnackPluginOthers from "../../snacks/ui/integral-box/plugins/SnackPluginOthers";
import SnackPluginThirdParty from "../../snacks/ui/integral-box/plugins/SnackPluginThirdParty";
import SnackPluginCompesation from "./integral-box/plugins/SnackPluginCompensation";
import SnackPluginTransfer from "../../snacks/ui/integral-box/plugins/SnackPluginTransfer";

// Importar turnos
import { listShifts } from "../../store/shift/CrudShift"; // asegúrate de tenerlo importado

import FinancialSummaryPanel from "../../snacks/ui/integral-box/plugins/SnackFinancialSummaryPanel";

import { useTheme } from "../../glamour/ThemeContext"; // ← tu theme personalizado

import { confirmShift } from "../../store/shift/CrudShift";

import { rejectShift } from "../../store/shift/CrudShift";

// Utils.
import SnackLottieNoData from "./utils/SnackLottieNoData";
import SnackLottieMoney from "./utils/SnackLottieMoney";

// Reporte general
import PrintIcon from "@mui/icons-material/Print";
import { getSpecialReport } from "../../store/reports/Reports"; // servicio que creaste
import SnackReport from "../ui/integral-box/reports/SnackReports";

// Cuadre de caja.
import CalculateIcon from "@mui/icons-material/Calculate";
import SnackBoxSquare from "../ui/integral-box/reports/SnackBoxSquare";

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

  const dynamicBaseUrl = isDevelopment ? window.location.origin : baseUrl;

  const theme = useTheme(); // accede al objeto de tema

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

  // Estado para la fecha seleccionada
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // "YYYY-MM-DD"
  });

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
  const [thirdPartyBalance, setThirdPartyBalance] = useState(0);

  // Cancelar transacción.
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelNote, setCancelNote] = useState("");
  const [transactionToCancel, setTransactionToCancel] = useState<any>(null);

  // Modal para las notas.
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [noteType, setNoteType] = useState<"credit" | "debit" | "">("");
  const [noteValue, setNoteValue] = useState("");
  const [transactionToAdjust, setTransactionToAdjust] = useState<any>(null);
  const [noteObservation, setNoteObservation] = useState("");

  // Estado para los turnos.
  const [processingShiftId, setProcessingShiftId] = useState<number | null>(
    null
  );

  //
  const [turnosPendientes, setTurnosPendientes] = useState<any[]>([]);
  const [showTurnosModal, setShowTurnosModal] = useState(false);

  // Estado de la transacción debito/credito.
  const [sendingNote, setSendingNote] = useState(false);

  // Estado para la categoría seleccionada.
  const categories = [
    "Ingresos",
    "Retiros",
    "Terceros",
    "Otros",
    "Compensación",
    "Transferir",
  ];

  // Estados para el reporte.
  const [showReportModal, setShowReportModal] = useState(false);
  const [specialReportData, setSpecialReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Estados para el cuadre de caja.
  const [showSquareModal, setShowSquareModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem("userSession");
      if (!storedUser) return;

      const user = JSON.parse(storedUser);
      setCashier(user);

      // ✅ Obtener fecha local en formato YYYY-MM-DD
      const today = (() => {
        const localDate = new Date();
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        const day = String(localDate.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      })();

      setSelectedDate(today); // establecer fecha local correctamente
      await fetchInitialData(user, today); // pasar explícitamente la fecha
    };

    init();
  }, []);

  const fetchInitialData = async (user = cashier, date = selectedDate) => {
    try {
      console.log("🚀 Iniciando carga de datos iniciales...");
      setLoading(true);

      await loadCashAndTransactions(
        user.id,
        1,
        rowsPerPage,
        categoryFilter,
        date
      );

      const cashRes = await getCashByCashier(user.id);
      console.log("💵 Cajas encontradas:", cashRes);

      if (cashRes.success && cashRes.data.length > 0) {
        const firstCash = cashRes.data[0];
        setSelectedCash(firstCash);
        console.log("✅ Caja seleccionada:", firstCash);

        const corrRes = await getCorrespondentByCash(firstCash.id);
        console.log("🏢 Corresponsal relacionado:", corrRes);

        if (corrRes.success && corrRes.data) {
          setCorrespondents([corrRes.data]);
          setSelectedCorrespondent(corrRes.data);

          const shiftsRes = await listShifts(corrRes.data.id, firstCash.id);
          console.log("📦 Turnos obtenidos:", shiftsRes);

          if (shiftsRes.success) {
            const pendingShifts = (shiftsRes.data || []).filter(
              (s) => s.state === 0
            );
            console.log("📝 Turnos pendientes:", pendingShifts);
            setTurnosPendientes(pendingShifts);
          } else {
            console.warn("⚠️ Error al obtener turnos:", shiftsRes.message);
          }
        } else {
          console.warn("⚠️ No se encontró corresponsal relacionado.");
        }
      } else {
        console.warn("⚠️ No se encontraron cajas asignadas al cajero.");
      }
    } catch (error) {
      console.error("❌ Error al cargar datos iniciales:", error);
    } finally {
      setLoading(false);
      console.log("✅ Carga de datos finalizada");
      await refreshShifts();
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

  const handleOpenReport = async () => {
    if (!selectedCash || !selectedCorrespondent) return;
    setLoadingReport(true); // Mostrar spinner
    setShowReportModal(true); // Abrir el modal
    try {
      const res = await getSpecialReport(
        selectedCash.id,
        selectedCorrespondent.id
      );
      if (res.success) {
        setSpecialReportData(res.report);
      } else {
        console.error("❌ Error cargando reporte especial:", res.message);
      }
    } catch (error) {
      console.error("❌ Error cargando reporte especial:", error);
    } finally {
      setLoadingReport(false); // Ocultar spinner
    }
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
    perPage = 10,
    category: string = "",
    date: string = "" // 👈 Añadir este parámetro
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
        setThirdPartyBalance(debtRes.data.third_party_balance || 0);

        const cajaActual = (debtRes.data.cashes || []).find(
          (c: any) => c.id === firstCash.id
        );
        setInitialConfig(cajaActual?.initial_amount || 0);

        const compensationTotal = (debtRes.data.items || [])
          .filter(
            (tx: any) => tx.transaction_type_name === "offset_transaction"
          )
          .reduce((sum: number, tx: any) => sum + Number(tx.cost || 0), 0);
        setOffsets(compensationTotal);
      }

      // Ingresos y egresos
      const [incomeRes, withdrawalRes] = await Promise.all([
        getCashIncomes(firstCash.id),
        getCashWithdrawals(firstCash.id),
      ]);
      setIncomes(incomeRes?.total || 0);
      setWithdrawals(withdrawalRes?.total || 0);

      // Transacciones con filtro de categoría
      const transRes = await getTransactionsByCash(
        firstCash.id,
        page,
        perPage,
        category,
        date
      );
      if (transRes.success) {
        setTransactions(transRes.data.items);

        const pendingTransfers = (transRes.data.items || []).filter(
          (t: any) =>
            t.is_transfer === 1 &&
            t.transfer_status === 0 &&
            t.id_cash === firstCash.id
        );
        const pendingTransferTotal = pendingTransfers.reduce(
          (sum: number, t: any) => sum + Number(t.cost || 0),
          0
        );
        setPendingTransferAmount(pendingTransferTotal);

        const incoming = transRes.data.items.filter(
          (t: any) =>
            t.is_transfer === 1 &&
            t.transfer_status === 0 &&
            t.box_reference === firstCash.id &&
            t.id_cash !== firstCash.id
        );
        setIncomingTransfers(incoming);

        setTotalItems(transRes.data.total);
      }
    }
  };

  // Controlador cuadre de caja.
  const handleOpenSquareModal = async () => {
    if (!selectedCash || !selectedCorrespondent) return;

    setLoadingReport(true);
    setShowSquareModal(true);

    try {
      const res = await getSpecialReport(
        selectedCash.id,
        selectedCorrespondent.id
      );
      if (res.success) {
        setSpecialReportData(res.report);
      } else {
        console.error("❌ Error cargando reporte para cuadre:", res.message);
      }
    } catch (error) {
      console.error("❌ Error inesperado:", error);
    } finally {
      setLoadingReport(false);
    }
  };

  // Abrir el modal para la nota.
  const handleOpenNoteModal = (transaction: any) => {
    setTransactionToAdjust(transaction);
    setNoteType("");
    setNoteValue("");
    setOpenNoteModal(true);
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

  // Funciones cancelar transacción.
  const handleCancelTransaction = (transaction: any) => {
    setTransactionToCancel(transaction);
    setCancelNote("");
    setOpenCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelNote.trim()) {
      setAlertMessage("La nota de cancelación no puede estar vacía.");
      setAlertType("error");
      return;
    }

    if (cancelNote.length > 200) {
      setAlertMessage("La nota no puede exceder los 200 caracteres.");
      setAlertType("error");
      return;
    }

    const response = await cancelTransactionById(
      transactionToCancel.id,
      cancelNote.trim()
    );

    if (response.success) {
      setAlertMessage("Transacción anulada exitosamente.");
      setAlertType("success");
      fetchInitialData();
    } else {
      setAlertMessage(response.message || "Error al anular transacción.");
      setAlertType("error");
    }

    setOpenCancelModal(false);
  };

  const handleConfirmShift = async (shiftId: number) => {
    try {
      setProcessingShiftId(shiftId);
      const response = await confirmShift(shiftId);
      if (response.success) {
        setAlertMessage("✅ Turno confirmado exitosamente.");
        setAlertType("success");
        await fetchInitialData(); // Refresca datos
      } else {
        setAlertMessage(response.message || "Error al confirmar turno.");
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("❌ Error en la solicitud.");
      setAlertType("error");
    } finally {
      setProcessingShiftId(null);
    }
  };

  const handleRejectShift = async (shiftId: number) => {
    try {
      setProcessingShiftId(shiftId);
      const result = await rejectShift(shiftId);
      if (result.success) {
        setAlertMessage("Turno rechazado exitosamente.");
        setAlertType("success");
        await fetchInitialData(); // Recargar datos
      } else {
        setAlertMessage(result.message || "Error al rechazar el turno.");
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error al procesar la solicitud.");
      setAlertType("error");
    } finally {
      setProcessingShiftId(null);
    }
  };

  // Refrescar la lista de turnos pendientes.
  const refreshShifts = async () => {
    if (selectedCorrespondent && selectedCash) {
      const shiftsRes = await listShifts(
        selectedCorrespondent.id,
        selectedCash.id
      );
      if (shiftsRes.success) {
        const pendingShifts = (shiftsRes.data || []).filter(
          (s) => s.state === 0
        );
        setTurnosPendientes(pendingShifts);
      }
    }
  };

  const handleSendNote = async () => {
    if (!noteType || !noteValue || !noteObservation.trim()) {
      setAlertMessage("Todos los campos son obligatorios.");
      setAlertType("error");
      return;
    }

    setSendingNote(true); // ← Activar loading

    try {
      const result = await createTransactionNote(
        transactionToAdjust.id,
        noteType,
        parseFloat(noteValue),
        noteObservation.trim()
      );

      if (result.success) {
        setAlertMessage("Nota registrada correctamente.");
        setAlertType("success");
        setOpenNoteModal(false);
        fetchInitialData();
      } else {
        setAlertMessage(result.message || "Error al registrar nota.");
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error al enviar la nota.");
      setAlertType("error");
    } finally {
      setSendingNote(false); // ← Desactivar loading
    }
  };

  console.log("🟨 selectedCorrespondent:", selectedCorrespondent);
  console.log("🟨 selectedCorrespondent?.state:", selectedCorrespondent?.state);
  console.log("🟨 selectedCash:", selectedCash);
  console.log("🟨 selectedCash?.state:", selectedCash?.state);

  if (
    Number(selectedCorrespondent?.state) === 1 &&
    Number(selectedCash?.state) === 1
  ) {
    console.log("✅ Renderizando tabla de transacciones");
  } else if (!selectedCorrespondent || !selectedCash) {
    console.log("⚠️ No hay corresponsal o caja seleccionada");
  } else {
    console.log("🚫 Caja o corresponsal inactivos");
  }

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
        {/* Saldo + Botón de Transferencia */}
        <Grid item>
          <Box display="flex" alignItems="center" gap={2}>
            {/* Saldo en caja 
            <Box
              sx={{
                backgroundColor: theme.colors.primary, // fondo oscuro definido en theme
                color: theme.colors.secondary, // texto o acentos
                padding: "12px 20px",
                borderRadius: 2,
                textAlign: "center",
                minWidth: 160,
              }}
            >
              <Typography fontSize="0.8rem" color={theme.colors.text_white}>
                Saldo en caja
              </Typography>
              <Typography
                fontWeight="bold"
                fontSize="1.2rem"
                color={theme.colors.text_white}
              >
                $
                {new Intl.NumberFormat("es-CO").format(
                  initialConfig + incomes - withdrawals - offsets
                )}
              </Typography>
            </Box>*/}

            {selectedCorrespondent?.premium === 1 &&
              turnosPendientes.length > 0 && (
                <IconButton
                  onClick={() => setShowTurnosModal(true)}
                  sx={{
                    backgroundColor: "#e8f5e9",
                    border: `2px solid ${colors.success || "#4caf50"}`,
                    ml: 1,
                  }}
                >
                  <Badge badgeContent={turnosPendientes.length} color="success">
                    <PersonIcon sx={{ color: "#2e7d32" }} />
                  </Badge>
                </IconButton>
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
                border: `1.5px solid ${colors.warning || "#ffa726"}`,
                borderRadius: 1.5,
                padding: "6px 12px", // 👈 más compacto
                mt: 1, // 👈 menor margen superior
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CreditCardIcon sx={{ color: "#f57c00", fontSize: 18 }} />{" "}
              {/* 👈 ícono más pequeño */}
              <Typography
                sx={{
                  color: "#f57c00",
                  fontWeight: "bold",
                  fontSize: "0.8rem", // 👈 más pequeño
                }}
              >
                Transferencia pendiente de ser aceptada:
              </Typography>
              <Typography
                sx={{
                  fontSize: "1rem", // 👈 reducido de 1.2rem
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
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item>
            <Autocomplete
              options={correspondents}
              getOptionLabel={(option) =>
                `${option.name}${option.code ? ` - ${option.code}` : ""}`
              }
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
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Corresponsal"
                  size="small"
                  sx={{
                    width: 180, // 🟢 más angosto
                    "& .MuiInputBase-root": {
                      fontSize: "0.7rem", // 🟢 fuente más chica
                      height: 32, // 🟢 menos alto
                      paddingY: 0.5,
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "0.7rem",
                      top: "-4px",
                    },
                    "& .MuiSvgIcon-root": {
                      fontSize: "1rem", // ícono más pequeño
                    },
                  }}
                />
              )}
            />
          </Grid>

          {selectedCorrespondent && selectedCash && (
            <>
              <Grid item sx={{ mb: 0.1 }}>
                <Grid
                  container
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={0.5}
                >
                  {/* IZQUIERDA: Enlace y descripción */}
                  <Grid item xs={12} md={8}>
                    <Box display="flex" alignItems="center" gap={2}>
                      {/* Enlace */}
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{ cursor: "pointer" }}
                        onClick={() => {
                          const url = `${window.location.origin}/shifts/register/${selectedCorrespondent.id}/${selectedCash.id}`;
                          navigator.clipboard.writeText(url);
                          setAlertMessage("🔗 Enlace copiado al portapapeles");
                          setAlertType("success");
                        }}
                      >
                        <ShareIcon color="primary" />
                        <Typography fontSize="0.9rem" color="text.secondary">
                          Compartir
                        </Typography>
                      </Box>

                      {/* Caja administrada */}
                      {selectedCash && (
                        <Typography
                          fontSize="0.80rem"
                          fontWeight="bold"
                          fontFamily={fonts.heading}
                          color={colors.primary}
                          gutterBottom
                          sx={{
                            display: "inline",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cashier?.fullname || "—"} –{" "}
                          {selectedCash?.name || "—"}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* DERECHA: Transferencias */}
                  <Grid item xs={12} md={0.5}>
                    <Box display="flex" justifyContent="flex-end">
                      {selectedCash && selectedCorrespondent && (
                        <>
                          <IconButton
                            onClick={handleOpenReport}
                            sx={{
                              backgroundColor: "#e3f2fd",
                              border: `2px solid ${colors.primary}`,
                              ml: 1,
                              p: 0.5,
                              width: 32,
                              height: 32,
                            }}
                          >
                            <PrintIcon
                              sx={{ color: colors.primary, fontSize: 18 }}
                            />
                          </IconButton>

                          <IconButton
                            onClick={handleOpenSquareModal}
                            sx={{
                              backgroundColor: "#ede7f6",
                              border: `2px solid ${colors.secondary}`,
                              ml: 1,
                              p: 0.5,
                              width: 32,
                              height: 32,
                            }}
                          >
                            <CalculateIcon
                              sx={{ color: colors.secondary, fontSize: 18 }}
                            />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Panel financiero debajo */}
              <Grid item xs={12} sx={{ mt: 0.5 }}>
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
                  thirdPartyBalanceInverted={thirdPartyBalance}
                />
              </Grid>
            </>
          )}
        </Grid>
      )}

      {selectedCorrespondent?.state === 1 && selectedCash?.state === 1 && (
        <Box
          sx={{
            mt: 0.0,
            p: 1,
            borderRadius: 2,
            backgroundColor: "#f4f4f4",
            boxShadow: 1,
          }}
        >
          <Typography
            variant="h6"
            fontSize="1rem" // 👈 igual que el panel financiero
            fontFamily={fonts.heading}
            color={colors.secondary}
            textAlign="left"
            sx={{ fontWeight: "bold", mb: 2 }}
          >
            Movimientos
          </Typography>

          <Grid container spacing={1} justifyContent="center">
            {[
              { Component: SnackPluginDeposits, key: "depositos" },
              { Component: SnackPluginWithdrawals, key: "retiros" },
              { Component: SnackPluginOthers, key: "otros" },
              { Component: SnackPluginThirdParty, key: "terceros" },
              { Component: SnackPluginCompesation, key: "compensacion" },
              { Component: SnackPluginTransfer, key: "transferencias" }, // ✅ Agregado al mismo grupo
            ].map(({ Component, key }) => (
              <Grid item xs={9} sm={6} md={2} key={key}>
                <Component
                  correspondent={selectedCorrespondent}
                  cash={selectedCash}
                  onTransactionComplete={fetchInitialData}
                  size="small"
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <CircularProgress />
        </Box>
      ) : selectedCorrespondent?.state === 1 && selectedCash?.state === 1 ? (
        <Box>
          {/* Tabla con scroll y encabezado fijo */}
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: "360px", // Altura máxima visible
              overflowY: "auto", // Scroll solo en cuerpo
              borderRadius: 2,
              border: `1px solid ${colors.primary}`,
            }}
          >
            <Table stickyHeader size="small">
              {" "}
              {/* 👈 stickyHeader */}
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ fontSize: "0.80rem", backgroundColor: "#fafafa" }}
                  >
                    Fecha
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: "0.80rem", backgroundColor: "#fafafa" }}
                  >
                    Tipo
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: "0.80rem", backgroundColor: "#fafafa" }}
                  >
                    Valor
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: "0.80rem", backgroundColor: "#fafafa" }}
                  >
                    Efectivo
                  </TableCell>

                  <TableCell
                    sx={{ fontSize: "0.80rem", backgroundColor: "#fafafa" }}
                  >
                    Nota
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: "0.80rem", backgroundColor: "#fafafa" }}
                  >
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(transactions) && transactions.length > 0 ? (
                  transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell sx={{ fontSize: "0.80rem" }}>
                        {t.formatted_date}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.80rem" }}>
                        {t.transaction_type_name}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold" fontSize="0.85rem">
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(Number(t.cost))}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography fontWeight="bold" fontSize="0.85rem">
                          {t.transaction_type_name ===
                            "Transferir a otra caja" &&
                          Number(t.box_reference) === Number(selectedCash?.id)
                            ? "-" // solo ocultar en la caja DESTINO
                            : new Intl.NumberFormat("es-CO", {
                                style: "currency",
                                currency: "COP",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(Number(t.cash_tag || 0))}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ fontSize: "0.80rem" }}>
                        {t.transaction_type_name === "Compensación" ? (
                          "—"
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontSize="0.75rem"
                          >
                            {t.note}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {t.is_transfer === 0 ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handleCancelTransaction(t)}
                            sx={{ fontSize: "0.70rem", px: 1.2 }}
                          >
                            Eliminar
                          </Button>
                        ) : (
                          <Chip
                            label="No anulable"
                            color="warning"
                            variant="outlined"
                            sx={{ fontSize: "0.70rem", fontWeight: "bold" }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ fontSize: "0.85rem" }}
                    >
                      No hay transacciones disponibles.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación fuera del scroll */}
          <Box mt={1.5}>
            <SnackPagination
              total={totalItems}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              categoryFilter={categoryFilter}
              selectedDate={selectedDate}
              onDateChange={(date) => {
                setSelectedDate(date);
                setCurrentPage(1);
                loadCashAndTransactions(
                  cashier.id,
                  1,
                  rowsPerPage,
                  categoryFilter,
                  date
                );
              }}
              onPageChange={(newPage) => {
                setCurrentPage(newPage);
                loadCashAndTransactions(
                  cashier.id,
                  newPage,
                  rowsPerPage,
                  categoryFilter,
                  selectedDate
                );
              }}
              onRowsPerPageChange={(newRows) => {
                setRowsPerPage(newRows);
                setCurrentPage(1);
                loadCashAndTransactions(
                  cashier.id,
                  1,
                  newRows,
                  categoryFilter,
                  selectedDate
                );
              }}
              onCategoryChange={(newCategory) => {
                setCategoryFilter(newCategory);
                setCurrentPage(1);
                loadCashAndTransactions(
                  cashier.id,
                  1,
                  rowsPerPage,
                  newCategory,
                  selectedDate
                );
              }}
            />
          </Box>
        </Box>
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

      <Dialog open={openCancelModal} onClose={() => setOpenCancelModal(false)}>
        <DialogTitle>¿Deseas anular esta transacción?</DialogTitle>
        <DialogContent>
          <TextField
            label="Motivo de anulación"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            inputProps={{ maxLength: 200 }}
            helperText={`${cancelNote.length}/200`}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }} // 👈 Aplica un margen superior de 2 unidades
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelModal(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
          >
            Confirmar anulación
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={showTurnosModal}
        onClose={() => setShowTurnosModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Turnos pendientes ({turnosPendientes.length})</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#f9f9f9" }}>
          <Grid container spacing={3}>
            {turnosPendientes.map((turno, index) => (
              <Grid item xs={12} key={index}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold">
                    #{index + 1} – {turno.transaction_type}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Valor:</b> $
                        {new Intl.NumberFormat("es-CO").format(turno.amount)}
                      </Typography>
                      <Typography>
                        <b>Convenio:</b> {turno.agreement || "—"}
                      </Typography>
                      <Typography>
                        <b>Referencia:</b> {turno.reference || "—"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>
                        <b>Nombre:</b> {turno.full_name}
                      </Typography>
                      <Typography>
                        <b>Documento:</b> {turno.document_id}
                      </Typography>
                      <Typography>
                        <b>Celular:</b> {turno.phone || "—"}
                      </Typography>
                      <Typography>
                        <b>Email:</b> {turno.email}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
                    <Button
                      variant="contained"
                      color="error"
                      disabled={processingShiftId === turno.id}
                      onClick={() => handleRejectShift(turno.id)}
                    >
                      {processingShiftId === turno.id
                        ? "Rechazando..."
                        : "Rechazar tarea"}
                    </Button>

                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleConfirmShift(turno.id)}
                    >
                      Aceptar tarea
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTurnosModal(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal para la nota de debito crédito.*/}
      <Dialog open={openNoteModal} onClose={() => setOpenNoteModal(false)}>
        <DialogTitle>Crear Nota Crédito / Débito</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={[
              { label: "Nota Crédito", value: "credit" },
              { label: "Nota Débito", value: "debit" },
            ]}
            getOptionLabel={(option) => option.label}
            value={
              noteType
                ? {
                    label:
                      noteType === "credit" ? "Nota Crédito" : "Nota Débito",
                    value: noteType,
                  }
                : null
            }
            onChange={(_, value) => setNoteType(value?.value || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tipo de Nota"
                fullWidth
                sx={{ mt: 2 }}
              />
            )}
          />

          <TextField
            label="Nuevo valor"
            fullWidth
            type="number"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            InputProps={{
              startAdornment: <Typography>$</Typography>,
            }}
            sx={{ mt: 2 }}
          />

          <TextField
            label="Observación"
            fullWidth
            multiline
            minRows={2}
            value={noteObservation}
            onChange={(e) => setNoteObservation(e.target.value)}
            sx={{ mt: 2 }}
            inputProps={{ maxLength: 250 }}
            helperText={`${noteObservation.length}/250`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNoteModal(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSendNote}
            disabled={!noteType || !noteValue || sendingNote}
          >
            {sendingNote ? "Enviando..." : "Confirmar Nota"}
          </Button>
        </DialogActions>
      </Dialog>

      {showReportModal && (
        <SnackReport
          open={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSpecialReportData(null); // Limpiar para evitar reuso de datos obsoletos
          }}
          reportData={specialReportData}
        />
      )}

      {showSquareModal && (
        <SnackBoxSquare
          open={showSquareModal}
          onClose={() => setShowSquareModal(false)}
          reportData={specialReportData}
        />
      )}
    </Box>
  );
};

export default SnackCrudTransactionCheckout;
