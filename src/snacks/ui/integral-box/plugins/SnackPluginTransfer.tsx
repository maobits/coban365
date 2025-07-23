import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  TextField,
  Paper,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import { useTheme } from "../../../../glamour/ThemeContext";
import { getTransactionTypesByCorrespondent } from "../../../../store/transaction/CrudTransactions";
import {
  getInitialCashConfiguration,
  getCashIncomes,
  getCashWithdrawals,
} from "../../../../store/transaction/CrudTransactions";
import { getDebtToBankByCorrespondent } from "../../../../store/transaction/CrudTransactions";
import { createTransferTransaction } from "../../../../store/transaction/CrudTransactions";
import { listRatesByCorrespondent } from "../../../../store/rate/CrudRate";
import { LinearProgress } from "@mui/material";
import { getCashByCorrespondent } from "../../../../store/crash/CrudCrash";
import SnackPluginBillCounter from "./SnackPluginBillCounter";

interface Props {
  correspondent: {
    id: number;
    name: string;
    credit_limit?: number; // ← se incluye el cupo
    premium?: number; // 1 = Premium, 0 = Básico
  };
  cash: {
    name: string;
    capacity: number;
  };
  onTransactionComplete?: () => void; // ← nuevo
}

const SnackPluginTransfer: React.FC<Props> = ({
  correspondent,
  cash,
  onTransactionComplete,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { colors, fonts } = useTheme();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("0");
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<number | "">(
    ""
  );

  // Estados para la lista de cajas.

  // Estados para el calculo de la caja.
  const [initialConfig, setInitialConfig] = useState(0);
  const [incomes, setIncomes] = useState(0);
  const [withdrawals, setWithdrawals] = useState(0);

  // Porcentaje de capacidad de la caja.
  const cashCapacity = cash?.capacity || 1;
  const currentCash = initialConfig + incomes - withdrawals;
  const cashPercentage =
    cashCapacity > 0 ? (currentCash / cashCapacity) * 100 : 0;

  // Estado para la deuda.
  const [bankDebt, setBankDebt] = useState(0);

  // Dialogo de advertencia.const [alertOpen, setAlertOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Estado de éxito.
  const [successOpen, setSuccessOpen] = useState(false);

  // Referencia:
  const amountRef = useRef<HTMLInputElement>(null);

  // Estado para lista de terceros.
  const [destinationCashList, setDestinationCashList] = useState<any[]>([]);
  const [selectedDestinationCash, setSelectedDestinationCash] =
    useState<any>(null);

  // Barra de progreso.

  const creditLimit = correspondent.credit_limit || 0;
  const debtPercentage = creditLimit > 0 ? (bankDebt / creditLimit) * 100 : 0;
  const availablePercentage =
    creditLimit > 0 ? ((creditLimit - bankDebt) / creditLimit) * 100 : 0;

  const transactionType = transactionTypes.find(
    (t) => t.id === selectedTransaction
  );

  //  Progreso de a caja en el cupo disponible.
  const saldoCaja = initialConfig + incomes - withdrawals;
  const saldoCajaPercentage =
    creditLimit > 0 ? (saldoCaja / creditLimit) * 100 : 0;

  {
    /* Función para cargar el valor en caja. */
  }
  const loadCashSummary = async () => {
    try {
      const [confRes, incomeRes, withdrawalRes] = await Promise.all([
        getInitialCashConfiguration(cash.id),
        getCashIncomes(cash.id),
        getCashWithdrawals(cash.id),
      ]);

      if (confRes.success) {
        setInitialConfig(confRes.data.initial_amount || 0);
        console.log(
          "⚙️ Configuración inicial en caja:",
          confRes.data.initial_amount || 0
        );
      }

      if (incomeRes.success) {
        setIncomes(incomeRes.total || 0);
        console.log("💰 Ingresos en caja:", incomeRes.total || 0);
      }

      if (withdrawalRes.success) {
        setWithdrawals(withdrawalRes.total || 0);
        console.log("💸 Egresos en caja:", withdrawalRes.total || 0);
      }
    } catch (error) {
      console.error("❌ Error al cargar resumen financiero:", error);
    }
  };

  const handleOpen = async () => {
    try {
      // 📦 Mostrar datos de la caja actual
      console.log("📦 Caja recibida:", {
        id: cash.id,
        nombre: cash.name,
        corresponsal: correspondent.name,
      });

      // Cargar tipos de transacción desde el backend
      const res = await getTransactionTypesByCorrespondent(
        correspondent.id,
        "transfer"
      );

      if (res.success) {
        setTransactionTypes(res.data);
        setSelectedTransaction("");
        setAmount("0");
      } else {
        setTransactionTypes([]);
        setSelectedTransaction("");
      }

      // 1.5. Cargar lista de terceros
      const cashListRes = await getCashByCorrespondent(correspondent.id);
      if (cashListRes.success) {
        const filtered = cashListRes.data.filter((c: any) => c.id !== cash.id);
        setDestinationCashList(filtered);
        setSelectedDestinationCash(null);
      }

      // 2. Cargar deuda bancaria completa del corresponsal
      const debtRes = await getDebtToBankByCorrespondent(correspondent.id);
      const availableLimit =
        (correspondent.credit_limit || 0) - (bankDebt || 0);

      if (debtRes.success) {
        const { income, withdrawals, net_cash, debt_to_bank } = debtRes.data;
        setIncomes(income || 0);
        setWithdrawals(withdrawals || 0);
        setInitialConfig(net_cash || 0);
        setBankDebt(debt_to_bank || 0);
      } else {
        setIncomes(0);
        setWithdrawals(0);
        setInitialConfig(0);
        setBankDebt(0);
      }

      // 3. Cargar resumen financiero específico de la caja
      await loadCashSummary();

      // 4. Abrir modal
      setOpen(true);
    } catch (error) {
      console.error("❌ Error cargando datos iniciales del modal:", error);
      setTransactionTypes([]);
      setOpen(true);
    }
  };

  const handleClose = () => setOpen(false);
  const handleRegister = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. Validación: tipo de transacción
      if (!selectedTransaction) {
        setAlertMessage("⚠️ Debes seleccionar un tipo de transacción.");
        setAlertOpen(true);
        return;
      }

      // 3. Validación: monto ingresado
      if (!amount || amount.trim() === "") {
        setAlertMessage("⚠️ Debes ingresar una cantidad para continuar.");
        setAlertOpen(true);
        amountRef.current?.focus();
        return;
      }

      const valorIngresado = parseFloat(amount.replace(/\D/g, ""));
      if (!valorIngresado || valorIngresado <= 0) {
        setAlertMessage("⚠️ No se permite una transacción con el monto $0.");
        setAlertOpen(true);
        amountRef.current?.focus();
        return;
      }

      // 4. Validación: cupo disponible actualizado
      const latestDebtRes = await getDebtToBankByCorrespondent(
        correspondent.id
      );
      if (!latestDebtRes.success) {
        throw new Error("No se pudo obtener la deuda bancaria actualizada.");
      }

      const latestDebt = latestDebtRes.data.debt_to_bank || 0;
      const creditLimit = correspondent.credit_limit || 0;
      const cupoDisponible = creditLimit - latestDebt;

      setBankDebt(latestDebt);
      await loadCashSummary();

      // 5. Obtener tarifa (utility)
      const rateRes = await listRatesByCorrespondent(correspondent.id);
      const utility =
        rateRes?.data?.find(
          (r: any) => r.transaction_type_id === selectedTransaction
        )?.price || 0;

      // 6. Buscar el tipo seleccionado para obtener el nombre
      const selectedType = transactionTypes.find(
        (t: any) => t.id === selectedTransaction
      );

      console.log("🧾 Tipo seleccionado:", selectedType?.name);

      // Mapeo predefinido
      const transactionNoteMap: Record<string, string> = {
        "pago a tercero": "debt_to_third_party",
        "pago de tercero": "charge_to_third_party",
        "prestamo a tercero": "loan_to_third_party",
        "prestamo de terceros": "loan_from_third_party",
      };

      // Función robusta de normalización
      const normalizeText = (text: string) =>
        text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, " ")
          .trim();

      const normalizedName = normalizeText(selectedType?.name || "");
      console.log("🔍 Nombre normalizado:", normalizedName);

      // 🔁 Obtener ID real del cajero
      const storedUser = localStorage.getItem("userSession");
      const cashierId = storedUser ? JSON.parse(storedUser).id : null;

      if (!cashierId) {
        setAlertMessage("⚠️ No se pudo obtener el ID del cajero.");
        setAlertOpen(true);
        return;
      }

      // 5. Validar que el valor ingresado no exceda el saldo real en caja (visualizado)
      const saldoCaja = initialConfig + incomes - withdrawals;
      if (valorIngresado > saldoCaja) {
        setAlertMessage(
          `⚠️ El monto $${new Intl.NumberFormat("es-CO").format(
            valorIngresado
          )} excede el saldo disponible en caja ($${new Intl.NumberFormat(
            "es-CO"
          ).format(saldoCaja)}).`
        );
        setAlertOpen(true);
        return;
      }

      // 7. Registrar transferencia usando nuevo servicio
      const res = await createTransferTransaction({
        id_cashier: cashierId, // ✅ ID real del cajero
        id_cash: cash.id, // caja origen
        id_correspondent: correspondent.id,
        transaction_type_id: selectedTransaction,
        polarity: false,
        cost: valorIngresado,
        utility: parseFloat(utility),
        box_reference: selectedDestinationCash?.id, // caja destino
        is_transfer: true,
        transfer_status: false,
      });

      // 8. Validar respuesta
      if (res.success) {
        setSuccessOpen(true);
        await loadCashSummary();

        const updatedDebtRes = await getDebtToBankByCorrespondent(
          correspondent.id
        );
        if (updatedDebtRes.success) {
          setBankDebt(updatedDebtRes.data.debt_to_bank || 0);
        }

        setAmount("0");
        setSelectedTransaction("");
        if (onTransactionComplete) onTransactionComplete();
      } else {
        setAlertMessage("❌ Error al registrar la transacción.");
        setAlertOpen(true);
      }
    } catch (err) {
      console.error("❌ Error en handleRegister:", err);
      setAlertMessage("❌ Ocurrió un error al procesar la transacción.");
      setAlertOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Grid item xs={12} md={4}>
        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "center", md: "flex-end" },
            mt: { xs: 2, md: 0 },
          }}
        >
          <Button
            variant="outlined"
            onClick={() => {
              if (correspondent.premium === 1) {
                handleOpen();
              } else {
                setAlertMessage(
                  "⚠️ Esta es una función premium. Solicita una mejora de plan para acceder a transferencias entre cajas."
                );
                setAlertOpen(true);
              }
            }}
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "0.9rem", sm: "1rem", md: "1.2rem" },
              px: { xs: 3, sm: 4 },
              py: { xs: 1, sm: 1.5 },
              color: colors.text,
              border: `2px solid ${colors.text}`,
              borderRadius: 2,
              whiteSpace: "nowrap",
              minWidth: "auto",
              "&:hover": {
                backgroundColor: "#f4f4f4",
              },
            }}
          >
            TRANSFERENCIAS
          </Button>
        </Box>
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            fontFamily: fonts.heading,
            backgroundColor: colors.primary, // ← cambiado
            color: colors.text_white,
            fontSize: "1.6rem",
            py: 2,
          }}
        >
          Transferencias en el corresponsal{" "}
          <Box component="span" fontWeight="bold" color={colors.text_white}>
            {correspondent.name}
          </Box>{" "}
          -{" "}
          <Box component="span" fontWeight="bold" color={colors.text_white}>
            {cash.name}
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            backgroundColor: "#fff", // Fondo blanco general
            color: colors.text,
            fontFamily: fonts.main,
            py: 5,
          }}
        >
          <Grid container spacing={5}>
            {/* Tipo de transacción */}
            <Grid item xs={12} md={6}>
              <Typography
                fontWeight="bold"
                gutterBottom
                sx={{ fontSize: "1.2rem", mt: 2 }}
              >
                Tipo de Transacción
              </Typography>
              <TextField
                fullWidth
                select
                value={selectedTransaction}
                onChange={(e) =>
                  setSelectedTransaction(parseInt(e.target.value))
                }
              >
                <MenuItem value="">Seleccionar tipo de transacción</MenuItem>
                {transactionTypes.map((type: any) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Terceros asociados */}
            <Grid item xs={12} md={6}>
              <Typography
                fontWeight="bold"
                gutterBottom
                sx={{ fontSize: "1.2rem", mt: 2 }}
              >
                Caja destino
              </Typography>
              <TextField
                fullWidth
                select
                value={selectedDestinationCash?.id || ""}
                onChange={(e) => {
                  const selected = destinationCashList.find(
                    (c) => c.id === parseInt(e.target.value)
                  );
                  setSelectedDestinationCash(selected);
                }}
                sx={{ fontSize: "1.4rem" }}
                InputProps={{
                  sx: {
                    fontSize: "1.4rem",
                    height: 70,
                  },
                }}
              >
                <MenuItem value="">Seleccionar caja destino</MenuItem>
                {destinationCashList.map((caja: any) => (
                  <MenuItem key={caja.id} value={caja.id}>
                    {caja.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Cantidad (izquierda) */}
            <Grid item xs={12} md={6}>
              <Typography
                fontWeight="bold"
                gutterBottom
                sx={{ fontSize: "1.2rem", mt: 2 }}
              >
                Cantidad
              </Typography>
              <TextField
                fullWidth
                inputRef={amountRef}
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                onChange={(e) => {
                  let raw = e.target.value.replace(/\D/g, "");

                  // Si comienza con '0' y tiene más de un dígito, quítalo
                  if (raw.length > 1 && raw.startsWith("0")) {
                    raw = raw.replace(/^0+/, "");
                  }

                  // Si el campo queda vacío, lo ponemos a "0"
                  setAmount(raw || "0");
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">COP</InputAdornment>
                  ),
                  sx: {
                    fontSize: "2rem",
                    fontWeight: "bold",
                    textAlign: "right",
                    height: 70,
                  },
                }}
              />
            </Grid>

            {/* Panel financiero */}
            <Grid item xs={12}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  backgroundColor: colors.primary,
                  border: "2px solid",
                  borderColor: colors.secondary,
                  borderRadius: 2,
                }}
              >
                <Grid container spacing={3} justifyContent="center">
                  {/* Deuda al banco */}
                  <Grid item xs={12} md={3} textAlign="center">
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      🏛️ Banco
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      ${new Intl.NumberFormat("es-CO").format(bankDebt)}
                    </Typography>

                    {/* 
        <LinearProgress
          variant="determinate"
          value={debtPercentage}
          sx={{
            mt: 1,
            height: 8,
            borderRadius: 5,
            backgroundColor: "#ddd",
            "& .MuiLinearProgress-bar": {
              backgroundColor: colors.secondary,
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: "block",
            color: colors.text_white,
          }}
        >
          {debtPercentage.toFixed(1)}% del cupo usado
        </Typography>
        */}
                  </Grid>

                  {/* Saldo en caja */}
                  <Grid item xs={12} md={3} textAlign="center">
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      🪙 Caja
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      $
                      {new Intl.NumberFormat("es-CO").format(
                        initialConfig + incomes - withdrawals
                      )}
                    </Typography>

                    {/* 
        <LinearProgress
          variant="determinate"
          value={cashPercentage}
          sx={{
            mt: 1,
            height: 8,
            borderRadius: 5,
            backgroundColor: "#ddd",
            "& .MuiLinearProgress-bar": {
              backgroundColor: colors.secondary,
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: "block",
            color: colors.text_white,
          }}
        >
          {cashPercentage.toFixed(1)}% de capacidad
        </Typography>
        */}
                  </Grid>

                  {/* Cupo disponible */}
                  <Grid item xs={12} md={3} textAlign="center">
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      ✅ Cupo
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      $
                      {new Intl.NumberFormat("es-CO").format(
                        (correspondent.credit_limit || 0) - (bankDebt || 0)
                      )}
                    </Typography>

                    {/* 
        <LinearProgress
          variant="determinate"
          value={availablePercentage}
          sx={{
            mt: 1,
            height: 8,
            borderRadius: 5,
            backgroundColor: "#ddd",
            "& .MuiLinearProgress-bar": {
              backgroundColor: colors.secondary,
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: "block",
            color: colors.text_white,
          }}
        >
          {availablePercentage.toFixed(1)}% del cupo disponible
        </Typography>
        */}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{ backgroundColor: colors.background, px: 4, py: 3 }}
        >
          <Button onClick={handleClose} variant="outlined" color="secondary">
            Cerrar
          </Button>
          <Button
            onClick={handleRegister}
            variant="contained"
            color="primary"
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Registrar
          </Button>
        </DialogActions>
        {open && correspondent.premium === 1 && (
          <Box sx={{ px: 4, py: 2 }}>
            <SnackPluginBillCounter
              amount={parseFloat(amount.replace(/\D/g, "")) || 0}
            />
          </Box>
        )}
      </Dialog>

      {/* Dialogo para mostrar la advertencia. */}
      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)}>
        <DialogTitle
          sx={{
            backgroundColor: colors.primary,
            color: colors.text_white,
            fontFamily: fonts.heading,
            fontSize: "1.6rem",
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 4,
            py: 2,
          }}
        >
          ⚠️ Advertencia
        </DialogTitle>

        <Dialog open={alertOpen} onClose={() => setAlertOpen(false)}>
          <DialogTitle
            sx={{
              backgroundColor: colors.primary,
              color: colors.text_white,
              fontFamily: fonts.heading,
              fontSize: "1.4rem",
            }}
          >
            ⚠️ Advertencia
          </DialogTitle>

          <DialogContent
            sx={{
              backgroundColor: colors.background,
              color: colors.text,
              fontSize: "1.2rem",
              fontWeight: "bold",
              p: 4,
            }}
          >
            <Typography sx={{ mt: 2, textAlign: "justify" }}>
              {alertMessage}
            </Typography>
          </DialogContent>

          <DialogActions
            sx={{ backgroundColor: colors.background, px: 3, py: 2 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => setAlertOpen(false)}
            >
              ENTENDIDO
            </Button>
          </DialogActions>
        </Dialog>

        <DialogActions
          sx={{
            backgroundColor: "#fff",
            px: 4,
            py: 2,
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => setAlertOpen(false)}
            sx={{ fontWeight: "bold", fontSize: "1rem" }}
          >
            ENTENDIDO
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de éxito. */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle
          sx={{
            backgroundColor: colors.primary,
            color: colors.text_white,
            fontFamily: fonts.heading,
            fontSize: "1.6rem",
            px: 4,
            py: 2,
          }}
        >
          ✅ Transacción registrada
        </DialogTitle>
        <DialogContent
          sx={{
            backgroundColor: colors.background,
            color: colors.text,
            fontSize: "1.2rem",
            fontWeight: "bold",
            p: 4,
          }}
        >
          <Typography sx={{ textAlign: "center", mt: 2 }}>
            🎉 La transacción se registró correctamente.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ backgroundColor: colors.background, px: 3, py: 2 }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => setSuccessOpen(false)}
          >
            ENTENDIDO
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SnackPluginTransfer;
