import React, { useState, useRef, useEffect } from "react";
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
  IconButton,
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
import SnackPluginBillCounter from "./SnackPluginBillCounter";
import CloseIcon from "@mui/icons-material/Close";
import { GetUserProfile } from "../../../../store/profile/GetUserProfile";

type SessionUser = {
  id?: number | string;
  name?: string;
  fullname?: string;
  first_name?: string;
  last_name?: string;
} | null;

const getSession = (): SessionUser => {
  try {
    const raw = localStorage.getItem("userSession");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getCashierNameFromSession = (s: SessionUser): string => {
  if (!s) return "—";
  const name =
    (s as any).fullname ||
    (s as any).name ||
    [(s as any).first_name, (s as any).last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
  return name || "—";
};

const toUpperES = (s?: string) => (s ?? "—").toLocaleUpperCase("es-CO");

// Metodos de envio.
// 🔤 Normalizador robusto (usa el mismo para tus comparaciones de nombres)
const normalizeText = (text: string) =>
  (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Opciones de "Método de envío" por tipo de transacción.
 * Las claves están normalizadas. Aceptamos variantes comunes.
 */
const methodByTransaction: Record<string, string[]> = {
  // PRESTAMO DE TERCERO
  "prestamo de tercero": [
    "Transferencia",
    "Compensación",
    "Consignación en sucursal",
    "Consignación cajero",
    "Consignación CB",
    "Entrega en efectivo",
  ],
  "prestamo de terceros": [
    "Transferencia",
    "Compensación",
    "Consignación en sucursal",
    "Consignación cajero",
    "Consignación CB",
    "Entrega en efectivo",
  ],

  // PAGO A TERCERO
  "pago a tercero": ["Movimiento solicitado", "Entrega en efectivo"],

  // PRESTAMO A TERCERO
  "prestamo a tercero": ["Movimiento solicitado", "Entrega en efectivo"],

  // PAGO DE TERCERO
  "pago de tercero": [
    "Transferencia",
    "Compensación",
    "Consignación en sucursal",
    "Consignación cajero",
    "Consignación CB",
    "Entrega en efectivo",
  ],
};

const getMethodOptionsForType = (typeName?: string): string[] => {
  const key = normalizeText(typeName || "");
  return methodByTransaction[key] || [];
};

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

  // Sesión inicial
  const session = getSession();

  // 🆕 Campo de referencia (se envía como "reference")
  const [reference, setReference] = useState<string>("");

  // 🆕 Cálculos de costos
  const [bankCommission, setBankCommission] = useState<number>(0); // costo (positivo para mostrar)
  const [dispersion, setDispersion] = useState<number>(0); // costo (positivo para mostrar)
  const [movementTotal, setMovementTotal] = useState<number>(0); // valor - costos

  // Estados del cajero (para poder actualizarlos luego)
  const [cashierId, setCashierId] = useState<number>(Number(session?.id) || 0);
  const [cashierName, setCashierName] = useState<string>(
    getCashierNameFromSession(session) // usa fullname / first_name + last_name si no hay name
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

  // Identificar prestamo de tercero para evitar limites.

  // Barra de progreso.

  const creditLimit = correspondent.credit_limit || 0;
  const debtPercentage = creditLimit > 0 ? (bankDebt / creditLimit) * 100 : 0;
  const availablePercentage =
    creditLimit > 0 ? ((creditLimit - bankDebt) / creditLimit) * 100 : 0;

  //Cupo disponible
  const availableCredit = thirdPartyBalance?.available_credit || 0;
  const totalCredit = thirdPartyBalance?.credit_limit || 0;
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

  // 🆕 Método de envío (type_of_movement)
  const [methodOptions, setMethodOptions] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");

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

      setInitialConfig(initial);
      setIncomes(inc);
      setWithdrawals(wdraw);

      console.log("⚙️ Configuración inicial en caja:", initial);
      console.log("💰 Ingresos en caja:", inc);
      console.log("💸 Egresos en caja:", wdraw);

      const saldoActual = initial + inc - wdraw; // saldo vigente antes de la transacción
      return { initial, inc, wdraw, saldoActual };
    } catch (error) {
      console.error("❌ Error al cargar resumen financiero:", error);
      return { initial: 0, inc: 0, wdraw: 0, saldoActual: 0 };
    }
  };

  // === Helpers de comisiones/dispersion ===
  const DISPERSION_RATE = 0.001; // 1 x 1000

  const ceilToThousand = (v: number) => {
    if (!Number.isFinite(v) || v <= 0) return 0;
    return Math.ceil(v / 1000) * 1000; // redondeo SIEMPRE hacia arriba al mil
  };

  const normalize = (s?: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  /**
   * Comisión bancaria fija según el método de envío (tipo de movimiento).
   * - Transferencia / Compensación => $0
   * - Consignación en sucursal / cajero / CB / Entrega en efectivo => $17.000
   * (Misma tabla que tu ejemplo; aplica a cualquier tercero)
   */
  const getBankCommissionByMethod = (method?: string): number => {
    const m = normalize(method);
    if (!m) return 0;

    const cero = ["transferencia", "compensacion"];
    if (cero.includes(m)) return 0;

    const diecisiete = [
      "consignacion en sucursal",
      "consignacion cajero",
      "consignacion cb",
      "entrega en efectivo",
    ];
    if (diecisiete.includes(m)) return 17000;

    // por defecto sin comisión
    return 0;
  };

  /** Dispersión = ceil( monto * 0.001 ) al mil hacia arriba */
  const calcDispersion = (amount: number) =>
    ceilToThousand(amount * DISPERSION_RATE);

  useEffect(() => {
    // 1) Lee la sesión
    const { id, name } = getUserFromSession();
    setCashierId(id);
    setCashierName(name); // nombre preliminar por si la API tarda

    // 2) Si hay id, consulta el perfil para traer fullname definitivo
    (async () => {
      if (!id) return;
      try {
        const res = await GetUserProfile(id);
        if (res?.success && res?.user?.fullname) {
          setCashierName(res.user.fullname);
        }
      } catch (e) {
        console.warn("No se pudo leer perfil del usuario:", e);
        // queda el nombre preliminar de sesión
      }
    })();
  }, []);

  // Recalcular comisión, dispersión y total del movimiento
  useEffect(() => {
    const raw = parseFloat((amount || "0").replace(/\D/g, "")) || 0;
    const comm = getBankCommissionByMethod(selectedMethod); // positivo
    const disp = calcDispersion(raw); // positivo
    // En tus reportes los costos aparecen en rojo como negativos,
    // pero para el usuario aquí mostramos los montos de costo (positivos).
    // El "Total del movimiento" = Valor - (comisión + dispersión)
    const total = raw - (comm + disp);

    setBankCommission(comm);
    setDispersion(disp);
    setMovementTotal(total < 0 ? 0 : total);
  }, [amount, selectedMethod]);

  const getUserFromSession = (): { id: number; name: string } => {
    const s = getSession();
    const id = Number((s as any)?.id) || 0;
    const name = getCashierNameFromSession(s);
    return { id, name };
  };

  const handleOpen = async () => {
    try {
      // 📦 Mostrar datos de la caja actual
      console.log("📦 Caja recibida:", {
        id: cash.id,
        nombre: cash.name,
        corresponsal: correspondent.name,
      });

      // 🆕 Reset UI del formulario al abrir
      setSelectedTransaction("");
      setAmount("0");
      setSelectedOther(null);
      setThirdPartyBalance(null);

      // 🆕 Reset "Método de envío"
      setMethodOptions([]); // ← sin opciones hasta que elijan tipo
      setSelectedMethod(""); // ← limpiar selección

      // 1) Cargar tipos de transacción desde el backend
      const res = await getTransactionTypesByCorrespondent(
        correspondent.id,
        "third_parties"
      );

      if (res.success) {
        setTransactionTypes(res.data);
      } else {
        setTransactionTypes([]);
      }

      // 1.5) Cargar lista de terceros
      const othersRes = await listOthersByCorrespondent(correspondent.id);
      if (othersRes.success) {
        setOthersList(othersRes.data);
      } else {
        setOthersList([]);
      }

      // 2) Cargar deuda bancaria completa del corresponsal
      const debtRes = await getDebtToBankByCorrespondent(correspondent.id);

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

      // 3) Cargar resumen financiero específico de la caja
      await loadCashSummary();

      // 4) Abrir modal
      setOpen(true);
    } catch (error) {
      console.error("❌ Error cargando datos iniciales del modal:", error);
      setTransactionTypes([]);
      // 🆕 Asegurar reset mínimo en error
      setMethodOptions([]);
      setSelectedMethod("");
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

      // 6. Buscar el tipo seleccionado para obtener el nombre
      const selectedType = transactionTypes.find(
        (t: any) => t.id === selectedTransaction
      );

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
      const isLoanFromThirdParty = third_party_note === "loan_from_third_party";

      // 5. Obtener tarifa (utility)
      const rateRes = await listRatesByCorrespondent(correspondent.id);
      const utility =
        rateRes?.data?.find(
          (r: any) => r.transaction_type_id === selectedTransaction
        )?.price || 0;

      console.log("🧾 Tipo seleccionado:", selectedType?.name);

      // 🔄 ACTUALIZAR balance antes de registrar
      const refreshedBalance = await getThirdPartyBalance(
        correspondent.id,
        selectedOther.id
      );
      if (refreshedBalance.success) {
        setThirdPartyBalance(refreshedBalance.data);
      } else {
        setThirdPartyBalance(null); // fallback por si falla
      }

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
        if (netBalance >= 0) {
          setAlertMessage(
            `⚠️ El corresponsal no tiene deuda pendiente con este tercero.`
          );
          setAlertOpen(true);
          return;
        }

        if (valorIngresado > Math.abs(netBalance)) {
          setAlertMessage(
            `⚠️ El monto ingresado ($${new Intl.NumberFormat("es-CO").format(
              valorIngresado
            )}) excede la deuda del corresponsal con este tercero ($${new Intl.NumberFormat(
              "es-CO"
            ).format(Math.abs(netBalance))}).`
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

      // Si es un pago entre el tercero y el corresponsal, validar saldos cruzados
      if (
        third_party_note === "charge_to_third_party" ||
        third_party_note === "debt_to_third_party"
      ) {
        const netBalance = thirdPartyBalance?.net_balance ?? 0;

        // Si el tercero debe al corresponsal, netBalance debe ser > 0
        if (third_party_note === "charge_to_third_party") {
          if (netBalance <= 0) {
            setAlertMessage(
              `⚠️ El tercero no tiene deuda pendiente con el corresponsal.`
            );
            setAlertOpen(true);
            return;
          }

          if (valorIngresado > netBalance) {
            setAlertMessage(
              `⚠️ El monto ingresado ($${new Intl.NumberFormat("es-CO").format(
                valorIngresado
              )}) excede lo que este tercero debe al corresponsal ($${new Intl.NumberFormat(
                "es-CO"
              ).format(netBalance)}).`
            );
            setAlertOpen(true);
            return;
          }
        }

        // Si el corresponsal debe al tercero, netBalance debe ser < 0
        if (third_party_note === "debt_to_third_party") {
          if (netBalance >= 0) {
            setAlertMessage(
              `⚠️ El corresponsal no tiene deuda pendiente con este tercero.`
            );
            setAlertOpen(true);
            return;
          }

          if (valorIngresado > Math.abs(netBalance)) {
            setAlertMessage(
              `⚠️ El monto ingresado ($${new Intl.NumberFormat("es-CO").format(
                valorIngresado
              )}) excede la deuda del corresponsal con este tercero ($${new Intl.NumberFormat(
                "es-CO"
              ).format(Math.abs(netBalance))}).`
            );
            setAlertOpen(true);
            return;
          }
        }
      }

      // ✅ Validación para premium: que la caja no exceda su capacidad
      if (
        correspondent.premium === 1 &&
        (third_party_note === "charge_to_third_party" ||
          third_party_note === "loan_from_third_party")
      ) {
        const saldoCajaActual = initialConfig + incomes - withdrawals;
        const saldoConNuevoValor = saldoCajaActual + valorIngresado;

        if (saldoConNuevoValor > cashCapacity) {
          setAlertMessage(
            `⚠️ La caja tiene un límite de ${new Intl.NumberFormat(
              "es-CO"
            ).format(
              cashCapacity
            )}. Esta transacción de $${new Intl.NumberFormat("es-CO").format(
              valorIngresado
            )} supera ese límite.`
          );
          setAlertOpen(true);
          return;
        }
      }

      // Si es un préstamo al tercero, validar cupo disponible y saldo en caja
      if (third_party_note === "loan_to_third_party") {
        const availableCredit = thirdPartyBalance?.available_credit || 0;

        if (selectedOther?.state !== 1) {
          setAlertMessage(
            "⚠️ Este tercero no está habilitado para recibir préstamos."
          );
          setAlertOpen(true);
          return;
        }

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

      // ✅ Lee saldo actual recién calculado (evita usar state desfasado)
      const { saldoActual } = await loadCashSummary();

      // Determina si la transacción suma o resta caja
      const sumaCaja = [
        "charge_to_third_party",
        "loan_from_third_party",
      ].includes(third_party_note);
      const restaCaja = ["debt_to_third_party", "loan_to_third_party"].includes(
        third_party_note
      );

      // Calcula cash_tag (saldo resultante)
      const cashTag = sumaCaja
        ? saldoActual + valorIngresado
        : restaCaja
        ? saldoActual - valorIngresado
        : saldoActual; // fallback si no se reconoce el tipo

      console.log(
        "💾 cash_tag (saldo resultante post-tercero):",
        cashTag.toLocaleString("es-CO")
      );

      // Validación: método de envío
      if (!selectedMethod) {
        setAlertMessage("⚠️ Debes seleccionar un método de envío.");
        setAlertOpen(true);
        return;
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
        cash_tag: cashTag,
        type_of_movement: selectedMethod,
        // 🆕 referencia y costos calculados (el backend puede ignorarlos si no los usa)
        reference, // NUEVO
        bank_commission: -bankCommission, // como costo (negativo)
        dispersion: -dispersion, // como costo (negativo)
        total_commission: -(bankCommission + dispersion), // opcional
      };

      console.log("📤 Registrando transacción con tercero:", payload);

      const res = await createThirdPartyTransaction(payload);

      // 8. Validar respuesta
      if (res.success) {
        setSuccessOpen(true);

        // 🔄 Actualizar resumen financiero de la caja
        await loadCashSummary();

        // 🔄 Actualizar deuda al banco
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

        // 🧹 Limpiar formulario
        setAmount("0");
        setSelectedTransaction("");

        // ✅ Callback externo (si existe)
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

  const nombreTercero = selectedOther?.name || "el tercero";
  console.log("🧾 Nombre del tercero:", nombreTercero);

  const netBalance = thirdPartyBalance?.net_balance ?? 0;
  const action = thirdPartyBalance?.correspondent_action;
  console.log("📊 netBalance recibido:", netBalance);
  console.log("🎯 Acción del corresponsal (backend):", action);

  let saldoResumen = null;

  if (action === "sin_saldo" || netBalance === 0) {
    console.log("✅ No hay saldos pendientes entre partes.");
    saldoResumen = (
      <Typography mt={1}>
        <strong>✔️ No hay saldos pendientes entre partes.</strong>
      </Typography>
    );
  } else if (action === "cobra") {
    const label = `📥 ${nombreTercero} debe al corresponsal:`;
    const valorFormateado = new Intl.NumberFormat("es-CO").format(
      Math.abs(netBalance)
    );
    console.log("🧾 Resultado visual:", label, "$" + valorFormateado);

    saldoResumen = (
      <Typography mt={1}>
        <strong>{label}</strong> ${valorFormateado}
      </Typography>
    );
  } else if (action === "paga") {
    const label = `💸 El corresponsal debe a ${nombreTercero}:`;
    const valorFormateado = new Intl.NumberFormat("es-CO").format(
      Math.abs(netBalance)
    );
    console.log("🧾 Resultado visual:", label, "$" + valorFormateado);

    saldoResumen = (
      <Typography mt={1}>
        <strong>{label}</strong> ${valorFormateado}
      </Typography>
    );
  }

  // Línea superior del panel de la derecha (siempre arriba)
  const saldoTop = (() => {
    if (!thirdPartyBalance) return null;

    const n = Math.abs(thirdPartyBalance.net_balance || 0);
    const monto = `$${new Intl.NumberFormat("es-CO").format(n)}`;

    if (thirdPartyBalance.correspondent_action === "cobra") {
      // El tercero debe al corresponsal
      return (
        <Typography fontWeight="bold" sx={{ fontSize: "1rem", mb: 1 }}>
          📥 {nombreTercero} debe al corresponsal: {monto}
        </Typography>
      );
    }

    if (thirdPartyBalance.correspondent_action === "paga") {
      // El corresponsal debe al tercero
      return (
        <Typography fontWeight="bold" sx={{ fontSize: "1rem", mb: 1 }}>
          💸 El corresponsal debe a {nombreTercero}: {monto}
        </Typography>
      );
    }

    // Sin saldo pendiente
    return (
      <Typography fontWeight="bold" sx={{ fontSize: "1rem", mb: 1 }}>
        ✔️ No hay saldos pendientes entre partes.
      </Typography>
    );
  })();

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
        Terceros
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            fontFamily: fonts.heading,
            backgroundColor: colors.primary,
            color: colors.text_white,
            fontSize: "1.05rem",
            py: 1.1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            letterSpacing: 0.3,
          }}
        >
          <Box
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <Box component="span" sx={{ fontWeight: 700, mr: 1 }}>
              TERCEROS -
            </Box>{" "}
            <Box component="span">[{correspondent?.id ?? "—"}]</Box>{" "}
            <Box component="span">[{toUpperES(correspondent?.name)}]</Box>{" "}
            <Box component="span" sx={{ mx: 0.5 }}>
              /
            </Box>{" "}
            <Box component="span">[{toUpperES(cash?.name)}]</Box>{" "}
            <Box component="span">[{toUpperES(cashierName)}]</Box>{" "}
            <Box component="span" sx={{ ml: 1 }}>
              DETALLE
            </Box>
          </Box>

          <IconButton onClick={handleClose} sx={{ color: colors.text_white }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            backgroundColor: "#fff",
            color: colors.text,
            fontFamily: fonts.main,
            py: 0.75, // compacto
            my: 0.25,
          }}
        >
          <Grid container spacing={1.5} alignItems="stretch">
            {/* IZQUIERDA: UNA COLUMNA CON TODOS LOS CAMPOS */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "grid", rowGap: 1 }}>
                {/* Tipo de Transacción */}
                <Typography
                  fontWeight="bold"
                  sx={{ fontSize: "0.9rem", mt: 0.25 }}
                >
                  Tipo de Transacción
                </Typography>
                <TextField
                  fullWidth
                  select
                  size="small"
                  value={selectedTransaction}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    setSelectedTransaction(id);
                    const t = transactionTypes.find((x: any) => x.id === id);
                    const opts = getMethodOptionsForType(t?.name);
                    setMethodOptions(opts);
                    setSelectedMethod(""); // reset
                  }}
                  InputProps={{ sx: { height: 36, fontSize: "0.9rem" } }}
                >
                  <MenuItem value="">Seleccionar tipo de transacción</MenuItem>
                  {transactionTypes.map((type: any) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Seleccionar Tercero */}
                <Typography
                  fontWeight="bold"
                  sx={{ fontSize: "0.9rem", mt: 0.25 }}
                >
                  Seleccionar Tercero
                </Typography>
                <TextField
                  fullWidth
                  select
                  size="small"
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
                      if (balanceRes.data) {
                        setThirdPartyBalance(balanceRes.data);
                        if (!balanceRes.success && balanceRes.message) {
                          setAlertMessage(`⚠️ ${balanceRes.message}`);
                          setAlertOpen(true);
                        }
                      } else {
                        setThirdPartyBalance(null);
                      }
                    } else {
                      setThirdPartyBalance(null);
                    }
                  }}
                  InputProps={{ sx: { height: 36, fontSize: "0.9rem" } }}
                >
                  <MenuItem value="">Seleccionar tercero</MenuItem>
                  {othersList.map((o: any) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.name} — {o.id_number}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Método de envío */}
                <Typography
                  fontWeight="bold"
                  sx={{ fontSize: "0.9rem", mt: 0.25 }}
                >
                  Método de envío
                </Typography>
                <TextField
                  fullWidth
                  select
                  size="small"
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  disabled={methodOptions.length === 0}
                  InputProps={{ sx: { height: 36, fontSize: "0.9rem" } }}
                >
                  <MenuItem value="">
                    {methodOptions.length
                      ? "Seleccionar método"
                      : "Seleccione un tipo de transacción"}
                  </MenuItem>
                  {methodOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Referencia (después de Método de envío) */}
                <Typography
                  fontWeight="bold"
                  sx={{ fontSize: "0.9rem", mt: 0.25 }}
                >
                  Referencia
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej: 1015235678 / Nota corta"
                  InputProps={{ sx: { height: 36, fontSize: "0.9rem" } }}
                />

                {/* Cantidad */}
                <Typography
                  fontWeight="bold"
                  sx={{ fontSize: "0.9rem", mt: 0.25 }}
                >
                  Cantidad
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  inputRef={amountRef}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/\D/g, "");
                    if (raw.length > 1 && raw.startsWith("0"))
                      raw = raw.replace(/^0+/, "");
                    setAmount(raw || "0");
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">COP</InputAdornment>
                    ),
                    sx: {
                      height: 38,
                      fontSize: "0.98rem",
                      fontWeight: "bold",
                      textAlign: "right",
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* Panel de balance (derecha) — muestra una sola línea según el caso */}
            {selectedOther && thirdPartyBalance && (
              <Grid item xs={12} md={6} mb={2}>
                <Paper
                  elevation={2}
                  sx={{
                    width: "100%",
                    height: "100%",
                    // ❌ quita el borde general
                    border: "none",
                    // ✅ deja solo el borde izquierdo
                    borderLeft: `1px solid ${colors.secondary}`,
                    borderRadius: 2,
                    backgroundColor: "#fff",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: { md: 1, xs: 0 },
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <Grid container rowSpacing={1.2} columnSpacing={2}>
                      {/* --------- SOLO UNA LÍNEA ARRIBA SEGÚN action --------- */}
                      {action === "cobra" && (
                        <>
                          <Grid item xs={8}>
                            <Typography sx={{ fontSize: "0.95rem" }}>
                              {nombreTercero} Debe al CB
                            </Typography>
                          </Grid>
                          <Grid item xs={4} textAlign="right">
                            <Typography sx={{ fontSize: "0.95rem" }}>
                              ${" "}
                              {new Intl.NumberFormat("es-CO").format(
                                Math.abs(netBalance)
                              )}
                            </Typography>
                          </Grid>
                        </>
                      )}

                      {action === "paga" && (
                        <>
                          <Grid item xs={8}>
                            <Typography sx={{ fontSize: "0.95rem" }}>
                              CB Debe al {nombreTercero}
                            </Typography>
                          </Grid>
                          <Grid item xs={4} textAlign="right">
                            <Typography sx={{ fontSize: "0.95rem" }}>
                              ${" "}
                              {new Intl.NumberFormat("es-CO").format(
                                Math.abs(netBalance)
                              )}
                            </Typography>
                          </Grid>
                        </>
                      )}

                      {(action === "sin_saldo" || !action) && (
                        <Grid item xs={12}>
                          <Typography sx={{ fontSize: "0.95rem" }}>
                            ✔️ No hay saldos pendientes entre partes.
                          </Typography>
                        </Grid>
                      )}
                      {/* ------------------------------------------------------- */}

                      {/* Cupo crédito */}
                      <Grid item xs={8}>
                        <Typography sx={{ fontSize: "0.95rem" }}>
                          Cupo crédito
                        </Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="right">
                        <Typography sx={{ fontSize: "0.95rem" }}>
                          $ {new Intl.NumberFormat("es-CO").format(totalCredit)}
                        </Typography>
                      </Grid>

                      {/* Cupo disponible */}
                      <Grid item xs={8}>
                        <Typography sx={{ fontSize: "0.95rem" }}>
                          Cupo disponible
                        </Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="right">
                        <Typography sx={{ fontSize: "0.95rem" }}>
                          ${" "}
                          {new Intl.NumberFormat("es-CO").format(
                            availableCredit
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* PANEL FINANCIERO (abajo a lo ancho) */}
            <Grid item xs={12}>
              <Paper
                elevation={2}
                sx={{
                  p: 1,
                  backgroundColor: colors.primary,
                  border: "2px solid",
                  borderColor: colors.secondary,
                  borderRadius: 2,
                }}
              >
                <Grid container spacing={1} justifyContent="center">
                  {/* Saldo en caja */}
                  <Grid item xs={12} md={3} textAlign="center">
                    <Typography
                      sx={{ fontSize: "0.85rem" }}
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      🪙 En caja
                    </Typography>
                    <Typography
                      sx={{ fontSize: "1rem" }}
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      $
                      {new Intl.NumberFormat("es-CO").format(
                        initialConfig + incomes - withdrawals
                      )}
                    </Typography>
                  </Grid>

                  {/* Deuda al banco */}
                  <Grid item xs={12} md={3} textAlign="center">
                    <Typography
                      sx={{ fontSize: "0.85rem" }}
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      🏛️ Banco
                    </Typography>
                    <Typography
                      sx={{ fontSize: "1rem" }}
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      ${new Intl.NumberFormat("es-CO").format(bankDebt)}
                    </Typography>
                  </Grid>

                  {/* Cupo disponible */}
                  <Grid item xs={12} md={3} textAlign="center">
                    <Typography
                      sx={{ fontSize: "0.85rem" }}
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      ✅ Cupo
                    </Typography>
                    <Typography
                      sx={{ fontSize: "1rem" }}
                      fontWeight="bold"
                      color={colors.text_white}
                    >
                      $
                      {new Intl.NumberFormat("es-CO").format(
                        (correspondent.credit_limit || 0) - (bankDebt || 0)
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{ backgroundColor: colors.background, px: 4, py: 3 }}
        >
          <Button
            onClick={handleRegister}
            variant="contained"
            color="primary"
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Registrar
          </Button>
          <Button onClick={handleClose} variant="outlined" color="secondary">
            Cerrar
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
