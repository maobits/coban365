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
import {
  addThirdPartyCommission,
  getThirdPartyCommission,
  subtractThirdPartyCommission, // 👈 agrega esto
} from "../../../../store/other/thirdPartyCommissions";

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

  // Comisión acumulada.
  // NUEVO estado:
  const [thirdPartyAccumulatedCommission, setThirdPartyAccumulatedCommission] =
    useState<number>(0);

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
    // 🆕 Snapshot en vivo: usamos SIEMPRE los estados actuales
    const actionNow = thirdPartyBalance?.correspondent_action || "sin_saldo"; // "cobra" | "paga" | "sin_saldo"
    const netNow = Number(thirdPartyBalance?.net_balance ?? 0); // saldo puro del backend (ya debe venir ajustado con la lógica PHP nueva)
    const feesNowState = Math.max(
      0,
      Number(thirdPartyAccumulatedCommission ?? 0)
    ); // comisión acumulada actual desde third_party_commissions

    // Deuda base SIN comisión (capital pendiente según quién debe a quién)
    const baseDebtToCB_now = actionNow === "cobra" ? Math.abs(netNow) : 0; // tercero -> CB
    const basePayableByCB_now = actionNow === "paga" ? Math.abs(netNow) : 0; // CB -> tercero

    // Deuda efectiva considerando comisión acumulada viva
    const effectiveDebtToCB_now = baseDebtToCB_now + feesNowState;

    // Si CB le debe al tercero, restamos comisión acumulada (no negativo)
    const effectivePayableByCB_now = Math.max(
      0,
      basePayableByCB_now - feesNowState
    );

    // Lo que realmente queda pendiente entre las partes que se muestra en UI
    const pendingForPanelNow =
      actionNow === "cobra"
        ? effectiveDebtToCB_now // tercero debe al CB
        : actionNow === "paga"
        ? effectivePayableByCB_now // CB debe al tercero
        : 0;

    // Formateador rápido COP
    const fmtCOP = (v: number) => new Intl.NumberFormat("es-CO").format(v);

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

      // 4. Validación: cupo global del corresponsal actualizado
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
      await loadCashSummary(); // refresca caja (initialConfig, incomes, withdrawals)

      // 5. Obtener tipo de transacción seleccionado
      const selectedType = transactionTypes.find(
        (t: any) => t.id === selectedTransaction
      );

      // Mapeo predefinido normalizado
      const transactionNoteMap: Record<string, string> = {
        "pago a tercero": "debt_to_third_party",
        "pago de tercero": "charge_to_third_party",
        "prestamo a tercero": "loan_to_third_party",
        "prestamo de terceros": "loan_from_third_party",
      };

      const normalizeText = (text: string) =>
        text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, " ")
          .trim();

      const normalizedName = normalizeText(selectedType?.name || "");
      const third_party_note = transactionNoteMap[normalizedName] || "unknown";
      const isLoanFromThirdParty = third_party_note === "loan_from_third_party";

      // 6. Obtener la tarifa (utility)
      const rateRes = await listRatesByCorrespondent(correspondent.id);
      const utility =
        rateRes?.data?.find(
          (r: any) => r.transaction_type_id === selectedTransaction
        )?.price || 0;

      // 7. Refrescar balance y comisión ANTES de validar límites específicos,
      //    para no usar algo desactualizado
      const refreshedBalance = await getThirdPartyBalance(
        correspondent.id,
        selectedOther.id
      );

      if (refreshedBalance.success && refreshedBalance.data) {
        setThirdPartyBalance(refreshedBalance.data);
      } else {
        setThirdPartyBalance(null);
      }

      // Snapshot fresco para validaciones duras
      const actionLive =
        refreshedBalance?.data?.correspondent_action || actionNow;
      const netLive = Number(refreshedBalance?.data?.net_balance ?? netNow);

      // Volvemos a tomar la comisión acumulada (tabla third_party_commissions)
      // porque puede cambiar mientras el modal está abierto
      const commissionLiveRes = await getThirdPartyCommission({
        thirdId: selectedOther.id,
        correspondentId: correspondent.id,
        timeoutMs: 15000,
      });

      const feesLive = Math.max(
        0,
        Number(
          commissionLiveRes?.data?.total_commission ??
            (commissionLiveRes as any)?.total_commission ??
            feesNowState
        )
      );

      // Recalcular deuda efectiva ya con los valores LIVE
      const baseDebtToCB_live = actionLive === "cobra" ? Math.abs(netLive) : 0;
      const basePayableByCB_live =
        actionLive === "paga" ? Math.abs(netLive) : 0;

      const effectiveDebtToCB_live = baseDebtToCB_live + feesLive;
      const effectivePayableByCB_live = Math.max(
        0,
        basePayableByCB_live - feesLive
      );

      // --- VALIDACIONES DE NEGOCIO ---

      // 7.1 Tipo desconocido
      if (third_party_note === "unknown") {
        setAlertMessage(
          "⚠️ No se pudo determinar la nota especial para este tipo de transacción."
        );
        setAlertOpen(true);
        return;
      }

      // 7.2 "Pago a tercero" => CB le paga al tercero
      if (third_party_note === "debt_to_third_party") {
        // Debe ser caso donde el CB le debe al tercero
        if (actionLive !== "paga" || netLive >= 0 === false) {
          if (netLive >= 0) {
            setAlertMessage(
              "⚠️ El corresponsal no tiene deuda pendiente con este tercero."
            );
            setAlertOpen(true);
            return;
          }
        }

        if (effectivePayableByCB_live <= 0) {
          setAlertMessage(
            "⚠️ La deuda efectiva del corresponsal con este tercero ya está cubierta o es cero."
          );
          setAlertOpen(true);
          return;
        }

        if (valorIngresado > effectivePayableByCB_live) {
          setAlertMessage(
            `⚠️ El monto ingresado ($${fmtCOP(
              valorIngresado
            )}) excede la deuda del corresponsal con este tercero ($${fmtCOP(
              effectivePayableByCB_live
            )}).`
          );
          setAlertOpen(true);
          return;
        }

        const saldoCajaNow = initialConfig + incomes - withdrawals;
        if (valorIngresado > saldoCajaNow) {
          setAlertMessage(
            `⚠️ El monto $${fmtCOP(
              valorIngresado
            )} excede el saldo disponible en caja ($${fmtCOP(saldoCajaNow)}).`
          );
          setAlertOpen(true);
          return;
        }
      }

      // 7.3 "Pago de tercero" => el tercero nos paga
      if (third_party_note === "charge_to_third_party") {
        // Para poder pagar:
        // - o el tercero debe algo de capital (actionLive === "cobra" y netLive > 0 y effectiveDebtToCB_live > 0)
        // - o tiene comisiones pendientes (feesLive > 0)
        const puedePagar =
          (actionLive === "cobra" &&
            netLive > 0 &&
            effectiveDebtToCB_live > 0) ||
          feesLive > 0;

        if (!puedePagar) {
          setAlertMessage(
            "⚠️ El tercero no tiene deuda ni comisiones pendientes con el corresponsal."
          );
          setAlertOpen(true);
          return;
        }

        if (effectiveDebtToCB_live <= 0) {
          setAlertMessage(
            "⚠️ La deuda efectiva del tercero con el corresponsal ya está cubierta o es cero."
          );
          setAlertOpen(true);
          return;
        }

        if (valorIngresado > effectiveDebtToCB_live) {
          setAlertMessage(
            `⚠️ El monto ingresado ($${fmtCOP(
              valorIngresado
            )}) excede la deuda total del tercero ($${fmtCOP(
              effectiveDebtToCB_live
            )}).`
          );
          setAlertOpen(true);
          return;
        }
      }

      // 7.4 "Préstamo al tercero" => corresponsal le presta al tercero
      if (third_party_note === "loan_to_third_party") {
        // cupo del tercero ajustado = availableCreditAdjusted (state)
        const availableCredit = availableCreditAdjusted;

        if (selectedOther?.state !== 1) {
          setAlertMessage(
            "⚠️ Este tercero no está habilitado para recibir préstamos."
          );
          setAlertOpen(true);
          return;
        }

        if (availableCredit <= 0) {
          setAlertMessage(
            "⚠️ El tercero no tiene cupo disponible en este momento."
          );
          setAlertOpen(true);
          return;
        }

        if (valorIngresado > availableCredit) {
          setAlertMessage(
            `⚠️ El monto $${fmtCOP(
              valorIngresado
            )} excede el cupo disponible del tercero ($${fmtCOP(
              availableCredit
            )}).`
          );
          setAlertOpen(true);
          return;
        }

        const saldoCajaNow = initialConfig + incomes - withdrawals;
        if (valorIngresado > saldoCajaNow) {
          setAlertMessage(
            `⚠️ El monto $${fmtCOP(
              valorIngresado
            )} excede el saldo disponible en caja ($${fmtCOP(saldoCajaNow)}).`
          );
          setAlertOpen(true);
          return;
        }
      }

      // 7.5 premium: caja no puede pasarse de capacidad cuando entra dinero
      if (
        correspondent.premium === 1 &&
        (third_party_note === "charge_to_third_party" ||
          third_party_note === "loan_from_third_party")
      ) {
        const saldoCajaActual = initialConfig + incomes - withdrawals;
        const saldoConNuevoValor = saldoCajaActual + valorIngresado;

        if (saldoConNuevoValor > cashCapacity) {
          setAlertMessage(
            `⚠️ La caja tiene un límite de ${fmtCOP(
              cashCapacity
            )}. Esta transacción de $${fmtCOP(
              valorIngresado
            )} supera ese límite.`
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
        : saldoActual;

      // Validación: método de envío
      if (!selectedMethod) {
        setAlertMessage("⚠️ Debes seleccionar un método de envío.");
        setAlertOpen(true);
        return;
      }

      // 8. Construir payload para createThirdPartyTransaction
      const payload = {
        id_cashier: 1, // TODO: usa cashierId real si ya lo tienes
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
        reference,
        bank_commission: -bankCommission, // se guardan negativas en BD
        dispersion: -dispersion,
        total_commission: -(bankCommission + dispersion),
      };

      // 🧮 ¿cuánto de este pago baja comisión acumulada?
      const calcCommissionPaymentPortion = () => {
        if (third_party_note !== "charge_to_third_party") return 0;

        // capital pendiente = baseDebtToCB_live
        // comisión pendiente = feesLive
        if (valorIngresado <= baseDebtToCB_live) return 0; // no tocó comisión

        const extraSobreCapital = valorIngresado - baseDebtToCB_live;
        return Math.min(extraSobreCapital, feesLive);
      };

      const commissionToSend = calcCommissionPaymentPortion();

      const res = await createThirdPartyTransaction({
        ...payload,
        accumulated_commission: commissionToSend, // solo la parte que baja comisión acumulada
      });

      // 9. Post-registro
      if (res.success) {
        try {
          // 9.1 si fue pago del tercero, actualiza tabla de comisión acumulada
          if (
            third_party_note === "charge_to_third_party" &&
            commissionToSend
          ) {
            await subtractThirdPartyCommission({
              thirdId: selectedOther.id,
              correspondentId: correspondent.id,
              amount: commissionToSend,
            });
          }
        } catch (calcErr) {
          console.error(
            "❌ Error interno calculando/descontando comisión:",
            calcErr
          );
        }

        setSuccessOpen(true);

        // 9.2 Refrescar caja
        await loadCashSummary();

        // 9.3 Refrescar deuda al banco
        const updatedDebtRes = await getDebtToBankByCorrespondent(
          correspondent.id
        );
        if (updatedDebtRes.success) {
          setBankDebt(updatedDebtRes.data.debt_to_bank || 0);
        }

        // 9.4 Refrescar comisión acumulada DESPUÉS de restar
        const commissionAfterRes = await getThirdPartyCommission({
          thirdId: selectedOther.id,
          correspondentId: correspondent.id,
          timeoutMs: 15000,
        });
        const commissionAfter = Math.max(
          0,
          Number(
            commissionAfterRes?.data?.total_commission ??
              (commissionAfterRes as any)?.total_commission ??
              0
          )
        );
        setThirdPartyAccumulatedCommission(commissionAfter);

        // 9.5 Refrescar balance del tercero (PHP debe devolverte el net_balance ya limpio)
        const updatedBalanceRes = await getThirdPartyBalance(
          correspondent.id,
          selectedOther.id
        );
        if (updatedBalanceRes.success) {
          setThirdPartyBalance(updatedBalanceRes.data);
        }

        // 9.6 Limpiar formulario
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

  const nombreTercero = selectedOther?.name || "el tercero";
  console.log("🧾 Nombre del tercero:", nombreTercero);

  const netBalance = thirdPartyBalance?.net_balance ?? 0;
  const action = thirdPartyBalance?.correspondent_action;
  console.log("📊 netBalance recibido:", netBalance);
  console.log("🎯 Acción del corresponsal (backend):", action);

  // NUEVO DEFINITIVO: comisiones acumuladas del tercero en BD
  // (vienen de third_party_commissions.total_commission)
  const thirdPartyFees = Math.max(
    0,
    Number(thirdPartyAccumulatedCommission ?? 0)
  );

  // NUEVO: base de deuda del tercero hacia el CB (solo si action === 'cobra')
  const baseDebtToCB = action === "cobra" ? Math.abs(netBalance) : 0;

  // NUEVO: deuda efectiva = deuda base + comisiones
  const effectiveDebtToCB = baseDebtToCB + thirdPartyFees;

  // comisiones acumuladas del tercero (magnitud positiva)

  // b) cuando el CB debe al tercero (paga) => saldo - comisiones (no negativo)
  const basePayableByCB = action === "paga" ? Math.abs(netBalance) : 0;
  const effectivePayableByCB = Math.max(0, basePayableByCB - thirdPartyFees);

  // Lo que realmente queda pendiente para mostrar en UI,
  // incorporando comisiones acumuladas (thirdPartyFees)
  const pendingForPanel =
    action === "cobra"
      ? effectiveDebtToCB
      : action === "paga"
      ? effectivePayableByCB
      : thirdPartyFees;

  // Acción “visual”: si hay pendiente, mostramos "paga" o "cobra".
  // Si solo quedan comisiones pero action venía "sin_saldo", lo tratamos como "cobra".
  const visualAction =
    pendingForPanel > 0 ? (action === "paga" ? "paga" : "cobra") : "sin_saldo";

  // Formateador cómodo
  const fmtCOP = (v: number) => new Intl.NumberFormat("es-CO").format(v);

  // Cupo original que viene del backend
  const availableCreditRaw = Number(thirdPartyBalance?.available_credit ?? 0);

  // Cupo disponible ajustado: se descuenta la comisión acumulada
  const availableCreditAdjusted = Math.max(
    0,
    availableCreditRaw - thirdPartyFees
  );

  let saldoResumen = null;

  if (pendingForPanel <= 0) {
    saldoResumen = (
      <Typography mt={1}>
        <strong>✔️ No hay saldos pendientes entre partes.</strong>
      </Typography>
    );
  } else if (action === "cobra") {
    saldoResumen = (
      <Typography mt={1}>
        <strong>📥 {nombreTercero} debe al corresponsal:</strong> $
        {fmtCOP(pendingForPanel)}
      </Typography>
    );
  } else if (action === "paga") {
    saldoResumen = (
      <Typography mt={1}>
        <strong>💸 El corresponsal debe a {nombreTercero}:</strong> $
        {fmtCOP(pendingForPanel)}
      </Typography>
    );
  }

  // Línea superior del panel de la derecha (siempre arriba)
  const saldoTop = (() => {
    if (!thirdPartyBalance) return null;

    if (pendingForPanel <= 0) {
      return (
        <Typography fontWeight="bold" sx={{ fontSize: "1rem", mb: 1 }}>
          ✔️ No hay saldos pendientes entre partes.
        </Typography>
      );
    }

    if (visualAction === "paga") {
      return (
        <Typography fontWeight="bold" sx={{ fontSize: "1rem", mb: 1 }}>
          💸 El corresponsal debe a {nombreTercero}: ${fmtCOP(pendingForPanel)}
        </Typography>
      );
    }

    return (
      <Typography fontWeight="bold" sx={{ fontSize: "1rem", mb: 1 }}>
        📥 {nombreTercero} debe al corresponsal: ${fmtCOP(pendingForPanel)}
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
                    // 1. Parsear ID seleccionado desde el <MenuItem>
                    const rawId = e.target.value; // viene como string
                    const parsedId = Number(rawId); // lo volvemos número

                    // 2. Buscar el objeto del tercero con ese ID
                    const found =
                      othersList.find((o: any) => Number(o.id) === parsedId) ||
                      null;

                    // 3. Actualizar el estado de selección primero
                    setSelectedOther(found);

                    // 4. Si no hay tercero válido => limpiar y salir SIN llamar APIs
                    if (!parsedId || parsedId <= 0 || !found) {
                      console.warn("⚠️ Tercero inválido o no encontrado", {
                        rawId,
                        parsedId,
                        found,
                      });

                      setThirdPartyBalance(null);
                      setThirdPartyAccumulatedCommission(0);
                      return;
                    }

                    const thirdId = parsedId;
                    const correspondentId = Number(correspondent.id || 0);

                    console.log(
                      "🟣 Cargando datos para tercero/corresponsal:",
                      {
                        thirdId,
                        correspondentId,
                        foundName: found.name,
                      }
                    );

                    // 5. Obtener balance actual del tercero con el corresponsal
                    try {
                      const balanceRes = await getThirdPartyBalance(
                        correspondentId,
                        thirdId
                      );

                      if (balanceRes?.data) {
                        setThirdPartyBalance(balanceRes.data);

                        if (!balanceRes.success && balanceRes.message) {
                          setAlertMessage(`⚠️ ${balanceRes.message}`);
                          setAlertOpen(true);
                        }
                      } else {
                        setThirdPartyBalance(null);
                      }
                    } catch (err) {
                      console.error("❌ Error getThirdPartyBalance:", err);
                      setThirdPartyBalance(null);
                    }

                    // 6. Obtener comisión ACUMULADA desde tabla third_party_commissions
                    try {
                      const commissionRes = await getThirdPartyCommission({
                        thirdId,
                        correspondentId,
                        timeoutMs: 15000,
                      });

                      // asumimos respuesta tipo:
                      // { success: true, data: { total_commission: "1000.00", ... } }
                      // o directamente { total_commission: "1000.00", ... }

                      const totalFromDB =
                        (commissionRes?.data &&
                          Number(commissionRes.data.total_commission ?? 0)) ||
                        Number((commissionRes as any)?.total_commission ?? 0) ||
                        0;

                      console.log("💵 Comisión acumulada BD:", totalFromDB);

                      setThirdPartyAccumulatedCommission(totalFromDB);
                    } catch (err) {
                      console.error("❌ Error getThirdPartyCommission:", err);
                      setThirdPartyAccumulatedCommission(0);
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

            {/* Panel de balance (derecha) — estado entre corresponsal y tercero */}
            {selectedOther && thirdPartyBalance && (
              <Grid item xs={12} md={6} mb={2}>
                <Paper
                  elevation={2}
                  sx={{
                    width: "100%",
                    height: "100%",
                    border: "none",
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
                      {/* ====== FILA 1: Relación corresponsal <-> tercero ====== */}
                      <Grid item xs={8}>
                        <Typography
                          sx={{ fontSize: "0.95rem", fontWeight: 500 }}
                        >
                          {pendingForPanel > 0
                            ? visualAction === "paga"
                              ? `CB Debe a ${nombreTercero}`
                              : `${nombreTercero} Debe al CB`
                            : "✔️ Sin saldos"}
                        </Typography>
                      </Grid>

                      <Grid item xs={4} textAlign="right">
                        <Typography
                          sx={{ fontSize: "0.95rem", fontWeight: 500 }}
                        >
                          $
                          {new Intl.NumberFormat("es-CO").format(
                            pendingForPanel > 0 ? pendingForPanel : 0
                          )}
                        </Typography>
                      </Grid>

                      {/* ====== FILA 2: Cupo crédito total ====== */}
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

                      {/* ====== FILA 3: Cupo disponible ajustado ======
               (cupo descontando comisiones acumuladas) */}
                      <Grid item xs={8}>
                        <Typography sx={{ fontSize: "0.95rem" }}>
                          Cupo disponible
                        </Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="right">
                        <Typography sx={{ fontSize: "0.95rem" }}>
                          ${" "}
                          {new Intl.NumberFormat("es-CO").format(
                            availableCreditAdjusted
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
