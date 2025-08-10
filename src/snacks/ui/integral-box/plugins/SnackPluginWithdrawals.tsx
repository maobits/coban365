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
import { createTransaction } from "../../../../store/transaction/CrudTransactions";
import { listRatesByCorrespondent } from "../../../../store/rate/CrudRate";
import { LinearProgress } from "@mui/material";
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
  };
  onTransactionComplete?: () => void; // ← nuevo
}

const SnackPluginWithdrawals: React.FC<Props> = ({
  correspondent,
  cash,
  onTransactionComplete,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { colors, fonts } = useTheme();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("0");
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>("");

  // Estados para el calculo de la caja.
  const [initialConfig, setInitialConfig] = useState(0);
  const [incomes, setIncomes] = useState(0);
  const [withdrawals, setWithdrawals] = useState(0);

  // Porcentaje de capacidad de la caja.
  const cashCapacity = cash.capacity || 1; // evitamos división por cero
  const currentCash = initialConfig + incomes - withdrawals;
  const cashPercentage = (currentCash / cashCapacity) * 100;

  // Estado para la deuda.
  const [bankDebt, setBankDebt] = useState(0);

  // Dialogo de advertencia.const [alertOpen, setAlertOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Estado de éxito.
  const [successOpen, setSuccessOpen] = useState(false);

  // Referencia:
  const amountRef = useRef<HTMLInputElement>(null);

  // Barra de progreso.

  const creditLimit = correspondent.credit_limit || 0;
  const debtPercentage = creditLimit > 0 ? (bankDebt / creditLimit) * 100 : 0;
  const availablePercentage =
    creditLimit > 0 ? ((creditLimit - bankDebt) / creditLimit) * 100 : 0;

  //  Progreso de a caja en el cupo disponible.
  const saldoCaja = initialConfig + incomes - withdrawals;
  const saldoCajaPercentage =
    creditLimit > 0 ? (saldoCaja / creditLimit) * 100 : 0;

  {
    /* Función para cargar el valor en caja. */
  }
  const loadCashSummary = async (): Promise<{
    initial: number;
    inc: number;
    wdraw: number;
    saldoActual: number;
  }> => {
    try {
      const [confRes, incomeRes, withdrawalRes] = await Promise.all([
        getInitialCashConfiguration(cash.id),
        getCashIncomes(cash.id),
        getCashWithdrawals(cash.id),
      ]);

      const initial = confRes?.success
        ? Number(confRes.data?.initial_amount || 0)
        : 0;
      const inc = incomeRes?.success ? Number(incomeRes.total || 0) : 0;
      const wdraw = withdrawalRes?.success
        ? Number(withdrawalRes.total || 0)
        : 0;

      // Mantén los estados como antes
      setInitialConfig(initial);
      setIncomes(inc);
      setWithdrawals(wdraw);

      console.log("⚙️ Configuración inicial en caja:", initial);
      console.log("💰 Ingresos en caja:", inc);
      console.log("💸 Egresos en caja:", wdraw);

      const saldoActual = initial + inc - wdraw; // saldo vigente antes del retiro
      return { initial, inc, wdraw, saldoActual };
    } catch (error) {
      console.error("❌ Error al cargar resumen financiero:", error);
      return { initial: 0, inc: 0, wdraw: 0, saldoActual: 0 };
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

      // 1. Obtener tipos de transacción (depósitos)
      const res = await getTransactionTypesByCorrespondent(
        correspondent.id,
        "withdrawals"
      );

      if (res.success) {
        setTransactionTypes(res.data);
        setSelectedTransaction("");
        setAmount("0");
      } else {
        setTransactionTypes([]);
        setSelectedTransaction("");
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
    if (isSubmitting) return; // ✅ Evita doble clic
    setIsSubmitting(true); // ✅ Activa estado de envío
    try {
      // Validar si no se ha seleccionado un tipo de transacción
      if (!selectedTransaction) {
        setAlertMessage("⚠️ Debes seleccionar un tipo de transacción.");
        setAlertOpen(true);
        return;
      }

      // Validar si el campo de monto está vacío
      if (!amount || amount.trim() === "") {
        setAlertMessage("⚠️ Debes ingresar una cantidad para continuar.");
        setAlertOpen(true);
        amountRef.current?.focus();
        return;
      }

      // Convertir el valor numérico (eliminar puntos, comas u otros símbolos)
      const valorIngresado = parseFloat(amount.replace(/\D/g, ""));

      // Validar si es cero o inválido
      if (!valorIngresado || valorIngresado <= 0) {
        setAlertMessage("⚠️ No se permite una transacción con el monto $0.");
        setAlertOpen(true);
        amountRef.current?.focus();
        return;
      }

      // ✅ 1. Consultar deuda actualizada justo antes de registrar
      const latestDebtRes = await getDebtToBankByCorrespondent(
        correspondent.id
      );

      if (!latestDebtRes.success) {
        throw new Error("No se pudo obtener la deuda bancaria actualizada.");
      }

      const latestDebt = latestDebtRes.data.debt_to_bank || 0;
      const creditLimit = correspondent.credit_limit || 0;
      const cupoDisponible = creditLimit - latestDebt;

      // ✅ Actualizar el estado de deuda (aunque no se registre)
      setBankDebt(latestDebt);

      // ✅ Recargar ingresos/egresos de la caja (aunque no se registre)
      await loadCashSummary();

      // ✅ 2. Refrescar resumen de caja y USAR su retorno (evita usar state desfasado)
      const { saldoActual } = await loadCashSummary();

      // ✅ Validar si el monto es mayor al saldo disponible en caja
      if (valorIngresado > currentCash) {
        setAlertMessage(
          `⚠️ La cantidad $${new Intl.NumberFormat("es-CO").format(
            valorIngresado
          )} excede el saldo disponible en caja ($${new Intl.NumberFormat(
            "es-CO"
          ).format(
            currentCash
          )}). No es posible retirar más de lo que hay disponible.`
        );
        setAlertOpen(true);
        amountRef.current?.focus();
        return;
      }

      // 🧮 3. Calcular cash_tag (saldo resultante después del retiro)
      const cashTag = saldoActual - valorIngresado;
      console.log(
        "💾 cash_tag (saldo post-retiro):",
        cashTag.toLocaleString("es-CO")
      );

      // 3. Obtener tarifa (utility)
      const rateRes = await listRatesByCorrespondent(correspondent.id);
      const tarifa = rateRes?.data?.find(
        (r: any) => r.transaction_type_id === selectedTransaction
      );
      const utility = tarifa ? parseFloat(tarifa.price) : 0;

      // 4. Registrar transacción
      const payload = {
        id_cashier: 1, // ← Reemplazar por el ID real del cajero
        id_cash: cash.id,
        id_correspondent: correspondent.id,
        transaction_type_id: selectedTransaction,
        polarity: false,
        cost: valorIngresado,
        utility,
        cash_tag: cashTag,
      };

      const res = await createTransaction(payload);

      if (res.success) {
        setSuccessOpen(true);

        // Actualizar datos en el tablero.
        await loadCashSummary();
        const updatedDebtRes = await getDebtToBankByCorrespondent(
          correspondent.id
        );
        if (updatedDebtRes.success) {
          setBankDebt(updatedDebtRes.data.debt_to_bank || 0);
        }

        setAmount("0");
        setSelectedTransaction("");

        // ✅ Notificar al padre que se completó la transacción
        if (onTransactionComplete) {
          onTransactionComplete();
        }
      } else {
        setAlertMessage("❌ Error al registrar la transacción.");
        setAlertOpen(true);
      }
    } catch (err) {
      console.error("❌ Error en handleRegister:", err);
      setAlertMessage("❌ Ocurrió un error al procesar la transacción.");
      setAlertOpen(true);
    } finally {
      setIsSubmitting(false); // ✅ Siempre habilita el botón al finalizar
    }
  };
  return (
    <>
      <Button
        variant="outlined"
        onClick={handleOpen}
        size="small"
        sx={{
          fontWeight: "bold",
          fontSize: "0.85rem",
          width: "100%",
          minWidth: 130,
          maxWidth: 160,
          height: 44,
          borderRadius: 6,
          borderWidth: 2,
          textTransform: "none",
          borderColor: colors.secondary,
          color: colors.secondary,
          backgroundColor: "#ffffff",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.08)",
          "&:hover": {
            backgroundColor: "#f5f5f5",
            borderColor: colors.secondary,
          },
        }}
      >
        Retiros
      </Button>

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
          Retiros en el corresponsal{" "}
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
                onChange={(e) => setSelectedTransaction(e.target.value)}
                sx={{ fontSize: "1.4rem" }}
                InputProps={{
                  sx: {
                    fontSize: "1.4rem",
                    height: 70,
                  },
                }}
              >
                <MenuItem value="">Seleccionar tipo de transacción</MenuItem>{" "}
                {/* ← agregada */}
                {transactionTypes.map((t: any) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Cantidad */}
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
                value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} // formato en tiempo real
                onChange={(e) => {
                  let raw = e.target.value.replace(/\D/g, "");

                  // Si comienza con '0' y tiene más de un dígito, eliminar ceros iniciales
                  if (raw.length > 1 && raw.startsWith("0")) {
                    raw = raw.replace(/^0+/, "");
                  }

                  // Si se borra todo, asignar "0"
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
                  {/* Saldo en caja */}
                  <Grid item xs={12} md={3} textAlign="center">
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      🪙 En caja
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
            disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
          >
            {isSubmitting ? "Registrando..." : "Registrar"}
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

export default SnackPluginWithdrawals;
