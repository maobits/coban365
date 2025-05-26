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
import { createThirdPartyTransaction } from "../../../../store/transaction/CrudTransactions";
import { listRatesByCorrespondent } from "../../../../store/rate/CrudRate";
import { LinearProgress } from "@mui/material";
import { listOthersByCorrespondent } from "../../../../store/other/CrudOther";
import { getThirdPartyBalance } from "../../../../store/transaction/CrudTransactions"; // o la ruta correcta

interface Props {
  correspondent: {
    id: number;
    name: string;
    credit_limit?: number; // ← se incluye el cupo
  };
  cash: {
    name: string;
  };
  onTransactionComplete?: () => void; // ← nuevo
}

const SnackPluginDeposits: React.FC<Props> = ({
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

  // Estado para lista de terceros.
  const [othersList, setOthersList] = useState<any[]>([]);
  const [selectedOther, setSelectedOther] = useState<any>(null);

  // Estado para el balance de un tercero.
  const [thirdPartyBalance, setThirdPartyBalance] = useState<any>(null);

  // Barra de progreso.

  const creditLimit = correspondent.credit_limit || 0;
  const debtPercentage = creditLimit > 0 ? (bankDebt / creditLimit) * 100 : 0;
  const availablePercentage =
    creditLimit > 0 ? ((creditLimit - bankDebt) / creditLimit) * 100 : 0;

  //Cupo disponible
  const totalCredit = selectedOther?.credit || 0;
  const usedCredit = thirdPartyBalance?.charge_to_third_party || 0;
  const availableCredit = totalCredit - usedCredit;
  const isFullCredit = availableCredit === totalCredit;

  // Nota del tercero según el tipo de transacción
  const transactionNoteMap: Record<string, string> = {
    "Pago a tercero": "debt_to_third_party",
    "Pago de tercero": "charge_to_third_party",
    "Prestamo a tercero": "loan_to_third_party",
    "Prestamo de tercero": "loan_from_third_party",
  };

  const transactionType = transactionTypes.find(
    (t) => t.id === selectedTransaction
  );

  const thirdPartyNote = transactionNoteMap[transactionType?.name] || "unknown";

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
        "third_parties"
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
      const othersRes = await listOthersByCorrespondent(correspondent.id);
      if (othersRes.success) {
        setOthersList(othersRes.data);
        setSelectedOther(null);
      } else {
        setOthersList([]);
        setSelectedOther(null);
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

      // 2. Validación: tercero seleccionado
      if (!selectedOther) {
        setAlertMessage("⚠️ Debes seleccionar un tercero.");
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

      if (valorIngresado > cupoDisponible) {
        setAlertMessage(
          `⚠️ La cantidad $${new Intl.NumberFormat("es-CO").format(
            valorIngresado
          )} es mayor al cupo disponible actualizado ($${new Intl.NumberFormat(
            "es-CO"
          ).format(cupoDisponible)}). Intenta con un monto menor.`
        );
        setAlertOpen(true);
        return;
      }

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
          .normalize("NFD") // separa caracteres diacríticos
          .replace(/[\u0300-\u036f]/g, "") // elimina tildes
          .replace(/[^\w\s]/gi, "") // elimina caracteres especiales
          .replace(/\s+/g, " ") // unifica espacios múltiples
          .trim();

      // Normalizar nombre del tipo
      const normalizedName = normalizeText(selectedType?.name || "");
      console.log("🔍 Nombre normalizado:", normalizedName);

      // Obtener nota especial
      const third_party_note = transactionNoteMap[normalizedName] || "unknown";

      // Validar que se reconoció correctamente
      if (third_party_note === "unknown") {
        setAlertMessage(
          "⚠️ No se pudo determinar la nota especial para este tipo de transacción."
        );
        setAlertOpen(true);
        return;
      }

      // Si es un pago al tercero, validar deuda existente y saldo suficiente en caja
      if (third_party_note === "debt_to_third_party") {
        const deudaAlTercero = thirdPartyBalance?.debt_to_third_party || 0;

        if (deudaAlTercero <= 0) {
          setAlertMessage(
            "⚠️ No existe deuda pendiente con este tercero. No se puede registrar un pago."
          );
          setAlertOpen(true);
          return;
        }

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
      }

      // Si es un pago de tercero, validar que haya saldo pendiente por cobrar
      if (third_party_note === "charge_to_third_party") {
        const cobrosAlTercero = thirdPartyBalance?.charge_to_third_party || 0;

        if (cobrosAlTercero <= 0) {
          setAlertMessage(
            "⚠️ No hay cobros pendientes a este tercero. No se puede registrar el pago."
          );
          setAlertOpen(true);
          return;
        }
      }

      // Si es un préstamo al tercero, validar cupo disponible y saldo en caja
      if (third_party_note === "loan_to_third_party") {
        const creditLimitTercero = selectedOther?.credit || 0;
        const chargeToThirdParty =
          thirdPartyBalance?.charge_to_third_party || 0;
        const availableCredit = creditLimitTercero - chargeToThirdParty;

        if (valorIngresado > availableCredit) {
          setAlertMessage(
            `⚠️ El monto $${new Intl.NumberFormat("es-CO").format(
              valorIngresado
            )} excede el cupo disponible del tercero ($${new Intl.NumberFormat(
              "es-CO"
            ).format(availableCredit)}).`
          );
          setAlertOpen(true);
          return;
        }

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
      }

      // 7. Construir payload con ID real y nota especial
      const payload = {
        id_cashier: 1, // ← reemplazar por el ID real si aplica
        id_cash: cash.id,
        id_correspondent: correspondent.id,
        transaction_type_id: selectedTransaction,
        polarity: true,
        cost: valorIngresado,
        utility: parseFloat(utility),
        client_reference: selectedOther.id,
        third_party_note,
      };

      console.log("📤 Registrando transacción con tercero:", payload);

      const res = await createThirdPartyTransaction(payload);

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

        // 🔄 Actualizar balance del tercero
        const updatedBalanceRes = await getThirdPartyBalance(
          correspondent.id,
          selectedOther.id
        );
        if (updatedBalanceRes.success) {
          setThirdPartyBalance(updatedBalanceRes.data);
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
      <Button
        variant="contained"
        onClick={handleOpen}
        sx={{
          fontWeight: "bold",
          fontSize: "1.2rem", // Tamaño de texto más grande
          paddingX: 4, // Más espacio horizontal (izq/der)
          paddingY: 2, // Más espacio vertical (arriba/abajo)
          backgroundColor: "#fff",
          color: colors.text,
          border: `2px solid ${colors.text}`,
          borderRadius: 2,
          "&:hover": {
            backgroundColor: "#f4f4f4",
          },
        }}
      >
        Terceros
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
          Terceros en el corresponsal{" "}
          <Box component="span" fontWeight="bold" color={colors.secondary}>
            {correspondent.name}
          </Box>{" "}
          -{" "}
          <Box component="span" fontWeight="bold" color={colors.secondary}>
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
                Seleccionar Tercero
              </Typography>
              <TextField
                fullWidth
                select
                value={selectedOther?.id || ""}
                onChange={async (e) => {
                  const selected = othersList.find(
                    (o) => o.id === parseInt(e.target.value)
                  );
                  setSelectedOther(selected);

                  if (selected) {
                    const balanceRes = await getThirdPartyBalance(
                      correspondent.id,
                      selected.id
                    );

                    if (balanceRes.success) {
                      setThirdPartyBalance(balanceRes.data);
                    } else {
                      setThirdPartyBalance(null);
                    }
                  } else {
                    setThirdPartyBalance(null);
                  }
                }}
                sx={{ fontSize: "1.4rem" }}
                InputProps={{
                  sx: {
                    fontSize: "1.4rem",
                    height: 70,
                  },
                }}
              >
                <MenuItem value="">Seleccionar tercero</MenuItem>
                {othersList.map((o: any) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.name} — {o.id_number}
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

            {/* Panel de balance (derecha) */}
            {selectedOther && thirdPartyBalance && (
              <Grid item xs={12} md={6} mb={4}>
                <Paper
                  elevation={2}
                  sx={{
                    px: 3,
                    pt: 3,
                    pb: 2,
                    border: "1px solid",
                    borderColor: colors.secondary,
                    borderRadius: 2,
                    height: "100%",
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color={colors.secondary}
                    gutterBottom
                  >
                    ✅ Cupo disponible del Tercero:
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={colors.secondary}
                    mt={-1}
                  >
                    {`$${new Intl.NumberFormat("es-CO").format(
                      availableCredit
                    )}`}
                    {!isFullCredit && (
                      <Box component="span" fontSize="1rem" fontWeight="normal">
                        {` de $${new Intl.NumberFormat("es-CO").format(
                          totalCredit
                        )}`}
                      </Box>
                    )}
                  </Typography>

                  <Typography mt={1}>
                    <strong>💸 Este corresponsal debe al tercero:</strong> $
                    {new Intl.NumberFormat("es-CO").format(
                      thirdPartyBalance.debt_to_third_party
                    )}
                  </Typography>

                  <Typography mt={1}>
                    <strong>📥 Este tercero debe al corresponsal:</strong> $
                    {new Intl.NumberFormat("es-CO").format(
                      thirdPartyBalance.charge_to_third_party
                    )}
                  </Typography>

                  {/* 
                  <Typography mt={1}>
                    <strong>🏦 Préstamos a tercero:</strong> $
                    {new Intl.NumberFormat("es-CO").format(
                      thirdPartyBalance.loan_to_third_party
                    )}
                  </Typography>

                  <Typography mt={1}>
                    <strong>🤝 Préstamos desde tercero:</strong> $
                    {new Intl.NumberFormat("es-CO").format(
                      thirdPartyBalance.loan_from_third_party
                    )}
                  </Typography>
                  */}
                </Paper>
              </Grid>
            )}

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
                      color={colors.secondary}
                    >
                      💵 Deuda al banco
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        border: "1px solid",
                        borderColor: colors.secondary,
                        borderRadius: 1,
                        p: 1,
                      }}
                    >
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color={colors.secondary}
                      >
                        ${new Intl.NumberFormat("es-CO").format(bankDebt)}
                      </Typography>

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
                    </Box>
                  </Grid>

                  {/* Saldo en caja */}
                  <Grid item xs={12} md={3} textAlign="center">
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={colors.secondary}
                    >
                      💰 Saldo en caja
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        border: "1px solid",
                        borderColor: colors.secondary,
                        borderRadius: 1,
                        p: 1,
                      }}
                    >
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color={colors.secondary}
                      >
                        $
                        {new Intl.NumberFormat("es-CO").format(
                          initialConfig + incomes - withdrawals
                        )}
                      </Typography>

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
                    </Box>
                  </Grid>

                  {/* Cupo total */}
                  <Grid item xs={12} md={3} textAlign="center">
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={colors.secondary}
                    >
                      🏦 Cupo total
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        border: "1px solid",
                        borderColor: colors.secondary,
                        borderRadius: 1,
                        p: 1,
                      }}
                    >
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color={colors.secondary}
                      >
                        ${new Intl.NumberFormat("es-CO").format(creditLimit)}
                      </Typography>

                      <LinearProgress
                        variant="determinate"
                        value={saldoCajaPercentage}
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
                        {saldoCajaPercentage.toFixed(1)}% del cupo ocupado con
                        saldo en caja
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Cupo disponible */}
                  <Grid item xs={12} md={3} textAlign="center">
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={colors.secondary}
                    >
                      ✅ Cupo disponible
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        border: "1px solid",
                        borderColor: colors.secondary,
                        borderRadius: 1,
                        p: 1,
                      }}
                    >
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color={colors.secondary}
                      >
                        $
                        {new Intl.NumberFormat("es-CO").format(
                          (correspondent.credit_limit || 0) - (bankDebt || 0)
                        )}
                      </Typography>

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
                    </Box>
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

export default SnackPluginDeposits;
