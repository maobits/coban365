// src/snacks/ui/reports/SnackBoxSquare.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  Divider,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import LockIcon from "@mui/icons-material/Lock"; // 👈 icono para cerrar caja
import { useTheme } from "../../../../glamour/ThemeContext";
import html2pdf from "html2pdf.js";
// Servicio para cerrar caja (agregado)
import { closeBox } from "../../../../store/reports/Reports";
// ✅ Nuevo: servicio para leer cuadre por fecha
import { getCashBalance } from "../../../../store/reports/Reports";

const denominations = {
  bills: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
  bundles: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
  coins: [1000, 500, 200, 100, 50],
};

interface Props {
  open: boolean;
  onClose: () => void;
  reportData: {
    report_date_pretty: string;
    initial_box: number;
    transactions: {
      total: number;
      summary: any[];
      cash_balance: number;
    };
    correspondent: {
      code: string; // en tu backend es el id/código visible
      name: string;
    };
    cash: {
      id: number;
      name: string;
    };
  } | null;
}

const SnackBoxSquare: React.FC<Props> = ({ open, onClose, reportData }) => {
  const { colors } = useTheme();
  const printRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState<{ [key: string]: number }>({});
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  // Estado para cerrar caja
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error";
  }>({
    open: false,
    msg: "",
    sev: "success",
  });

  // ✅ Filtro de fecha + meta del cuadre encontrado
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [loadingDate, setLoadingDate] = useState(false);
  const [savedAtLabel, setSavedAtLabel] = useState<string | null>(null); // "YYYY-MM-DD HH:MM:SS" o null

  // ✅ Estado para “caja actual” efectiva (congelada si aplica)
  const [overrideCurrentCash, setOverrideCurrentCash] = useState<number | null>(
    null
  );

  // helper: ¿selectedDate es anterior a hoy?
  const isPastDate = (d: string) => d < todayStr; // YYYY-MM-DD compara lexicográfico

  useEffect(() => {
    if (open) {
      // limpiar conteos al abrir y posicionar la fecha en hoy
      setCounts({});
      setFocusedKey(null);
      setSelectedDate(todayStr);
      setSavedAtLabel(null);
      setOverrideCurrentCash(null);
    }
  }, [open]);

  // ✅ Cargar cuadre si existe para la fecha seleccionada
  useEffect(() => {
    const load = async () => {
      if (!open || !reportData?.cash?.id || !selectedDate) return;
      setLoadingDate(true);
      try {
        const res = await getCashBalance(reportData.cash.id, selectedDate);
        const row = res?.data || null;

        if (row && row.details) {
          // details puede ser JSON del conteo
          try {
            const details =
              typeof row.details === "string"
                ? JSON.parse(row.details)
                : row.details;

            // construir counts desde details.sections
            const next: Record<string, number> = {};

            const put = (
              type: "bills" | "bundles" | "coins",
              list?: Array<{ denom: number; count: number }>
            ) => {
              if (!Array.isArray(list)) return;
              list.forEach((r) => {
                next[`${type}-${Number(r.denom)}`] = Number(r.count || 0);
              });
            };

            put("bills", details?.sections?.bills);
            put("bundles", details?.sections?.bundles);
            put("coins", details?.sections?.coins);

            setCounts(next);
          } catch {
            // si no se puede parsear, limpiamos
            setCounts({});
          }

          const label = `${row.balance_date || selectedDate}${
            row.balance_time ? ` ${row.balance_time}` : ""
          }`;
          setSavedAtLabel(label);

          // ✅ Si la fecha es pasada y el cuadre está congelado, usar ese current_cash
          if (isPastDate(selectedDate) && Number(row.frozen_box) === 1) {
            setOverrideCurrentCash(Number(row.current_cash || 0));
          } else {
            setOverrideCurrentCash(null);
          }
        } else {
          // no hay cuadre ese día
          setCounts({});
          setSavedAtLabel(null);
          setOverrideCurrentCash(null);
        }
      } catch {
        // ante error no rompemos la UI
        setCounts({});
        setSavedAtLabel(null);
        setOverrideCurrentCash(null);
      } finally {
        setLoadingDate(false);
      }
    };
    load();
  }, [open, reportData?.cash?.id, selectedDate]);

  const handleChange = (key: string, value: string) => {
    const parsed = parseInt(value);
    setCounts((prev) => ({ ...prev, [key]: isNaN(parsed) ? 0 : parsed }));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);

  const calculateSubtotal = (type: keyof typeof denominations) =>
    denominations[type].reduce((sum, val) => {
      const qty = counts[`${type}-${val}`] || 0;
      const unit = type === "bundles" ? val * 100 : val;
      return sum + qty * unit;
    }, 0);

  const totalBills = calculateSubtotal("bills");
  const totalBundles = calculateSubtotal("bundles");
  const totalCoins = calculateSubtotal("coins");
  const totalEffective = totalBills + totalBundles + totalCoins;

  // ✅ “Caja actual” efectiva:
  // - Si la fecha es anterior a hoy y el cuadre vino congelado → usar overrideCurrentCash
  // - Si es hoy → usar el cash_balance en vivo del reporte (no congelado)
  const cashBalance =
    overrideCurrentCash !== null
      ? overrideCurrentCash
      : reportData?.transactions?.cash_balance || 0;

  const resultDiff = totalEffective - cashBalance;

  const getMessage = () => {
    if (resultDiff > 0)
      return `Sobrante en caja: ${formatCurrency(resultDiff)}.`;
    if (resultDiff < 0)
      return `Faltante en caja: ${formatCurrency(Math.abs(resultDiff))}.`;
    return "La caja está cuadrada correctamente.";
  };

  const renderTable = (title: string, type: keyof typeof denominations) => (
    <>
      <Typography
        sx={{ fontWeight: "bold", textAlign: "center", mt: 2, fontSize: 13 }}
      >
        {title}
      </Typography>
      <Table size="small" sx={{ mt: 1 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontSize: 12 }}>
              <b>{type === "bundles" ? "FAJOS (100 Unid)" : "DENOM"}</b>
            </TableCell>
            <TableCell align="center" sx={{ fontSize: 12 }}>
              <b>CANT</b>
            </TableCell>
            <TableCell align="right" sx={{ fontSize: 12 }}>
              <b>SUBTOTAL</b>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {denominations[type].map((val) => {
            const key = `${type}-${val}`;
            const unit = type === "bundles" ? val * 100 : val;
            const qty = counts[key] || 0;
            return (
              <TableRow key={val}>
                <TableCell sx={{ fontSize: 13 }}>
                  {formatCurrency(val)}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: 13 }}>
                  <TextField
                    type="number"
                    size="small"
                    variant="outlined"
                    value={focusedKey === key && qty === 0 ? "" : String(qty)}
                    onFocus={() => setFocusedKey(key)}
                    onBlur={() => setFocusedKey(null)}
                    onChange={(e) => handleChange(key, e.target.value)}
                    inputProps={{
                      min: 0,
                      style: { width: 50, textAlign: "center", fontSize: 13 },
                    }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ fontSize: 13 }}>
                  {formatCurrency(qty * unit)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Typography
        fontWeight="bold"
        sx={{ mt: 1, textAlign: "right", mr: 1, fontSize: 13 }}
      >
        Subtotal {title}: {formatCurrency(calculateSubtotal(type))}
      </Typography>
    </>
  );

  const handleExportPDF = () => {
    if (printRef.current) {
      const opt = {
        margin: 0.3,
        filename: `cuadre_caja_${reportData?.cash?.id || "caja"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: {
          unit: "in",
          format: [4.8, 18], // MÁS ANCHO y ALTO
          orientation: "portrait",
        },
      };
      html2pdf().set(opt).from(printRef.current).save();
    }
  };

  // === Cerrar caja ===
  const buildDetailsPayload = () => {
    // Construimos el "details" que espera el backend (sin alterar la UI)
    const mapRows = (type: "bills" | "bundles" | "coins") =>
      denominations[type].map((val) => ({
        denom: val,
        count: counts[`${type}-${val}`] || 0,
        ...(type === "bundles" ? { units_per_bundle: 100 } : {}),
        subtotal:
          (counts[`${type}-${val}`] || 0) *
          (type === "bundles" ? val * 100 : val),
      }));

    return {
      header: {
        correspondent_code: reportData?.correspondent?.code ?? "",
        correspondent_name: reportData?.correspondent?.name ?? "",
        cash: {
          id: reportData?.cash?.id ?? 0,
          name: reportData?.cash?.name ?? "",
        },
        reported_at: new Date().toISOString(),
      },
      sections: {
        bills: mapRows("bills"),
        bundles: mapRows("bundles"),
        coins: mapRows("coins"),
      },
      subtotals: {
        bills: totalBills,
        bundles: totalBundles,
        coins: totalCoins,
      },
      totals: {
        total_effective: totalEffective,
        current_cash: cashBalance, // ✅ usa la “caja actual” efectiva
        balance: totalEffective - cashBalance,
        abs_diff: Math.abs(totalEffective - cashBalance),
        message:
          resultDiff === 0
            ? "Cuadre OK"
            : resultDiff < 0
            ? "Faltante en caja"
            : "Sobrante en caja",
      },
    };
  };

  const getCashierId = () => {
    try {
      const raw = localStorage.getItem("userSession");
      if (!raw) return 0;
      const u = JSON.parse(raw);
      // soportar distintas formas
      return u?.id || u?.cashier?.id || u?.user?.id || 0;
    } catch {
      return 0;
    }
  };

  const handleConfirmCloseBox = async () => {
    if (!reportData) return;
    setSaving(true);
    try {
      const payload = {
        correspondent_id: Number(reportData.correspondent.code) || 0,
        cash_id: reportData.cash.id,
        cashier_id: getCashierId(),
        details: buildDetailsPayload(),
        note: note?.trim() || undefined,
        // ✅ respetar la fecha seleccionada para el cierre
        balance_date: selectedDate,
      };

      const res = await closeBox(payload as any);
      if (res?.success) {
        setSnack({
          open: true,
          msg: "Cierre de caja registrado correctamente.",
          sev: "success",
        });
        setConfirmOpen(false);

        // 👇 dar 1.2s para que se vea el snackbar y luego recargar
        setTimeout(() => {
          onClose?.();
          window.location.reload();
        }, 1200);
      } else {
        throw new Error(res?.message || "No se pudo cerrar la caja.");
      }
    } catch (e: any) {
      if (e?.isApiError && e.status === 409) {
        const ya = e.payload?.data;
        const extra = ya?.closing_time
          ? ` (Hora: ${ya.closing_time}${
              ya?.closed_by ? `, Usuario: ${ya.closed_by}` : ""
            })`
          : "";
        setSnack({
          open: true,
          msg: e?.message || `La caja ya fue cerrada hoy${extra}.`,
          sev: "error",
        });
        setConfirmOpen(false);
      } else {
        setSnack({
          open: true,
          msg: e?.message || "Error al cerrar la caja.",
          sev: "error",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetDate = () => {
    setSelectedDate(todayStr);
    setCounts({});
    setSavedAtLabel(null);
    setOverrideCurrentCash(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullScreen>
        <DialogTitle
          sx={{
            backgroundColor: colors.primary,
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          CUADRE DE CAJA
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            maxWidth: 520,
            mx: "auto",
            mt: 3,
            mb: 2,
            backgroundColor: "#fff",
            border: "1px dashed #999",
            p: 3,
            fontSize: 14,
          }}
        >
          <div ref={printRef}>
            <Typography align="center" fontWeight="bold" fontSize={15}>
              {reportData?.correspondent?.code} -{" "}
              {reportData?.correspondent?.name}
            </Typography>
            <Typography align="center" fontSize={13}>
              Caja: ID {reportData?.cash?.id} - {reportData?.cash?.name}
            </Typography>
            <Typography align="center" fontSize={13}>
              Fecha (reporte): {reportData?.report_date_pretty}
            </Typography>
            {/* ✅ Mostrar la fecha/hora del cuadre cargado (si existe) */}
            {savedAtLabel && (
              <Typography align="center" fontSize={12} sx={{ mt: 0.5 }}>
                Cuadre guardado: <b>{savedAtLabel}</b>
              </Typography>
            )}
            {loadingDate && (
              <Typography align="center" fontSize={12} sx={{ mt: 0.5 }}>
                Cargando conteo de la fecha…
              </Typography>
            )}
            {renderTable("BILLETES", "bills")}
            {renderTable("FAJOS", "bundles")}
            {renderTable("MONEDAS", "coins")}
            {/* Salto de página visual */}

            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: "right", pr: 1 }}>
              <Typography fontSize={13}>
                Total efectivo: {formatCurrency(totalEffective)}
              </Typography>
              <Typography fontSize={13}>
                Caja actual: {formatCurrency(cashBalance)}
              </Typography>
              <Typography fontSize={13}>
                Saldo: {formatCurrency(resultDiff)}
              </Typography>
              <Typography
                fontWeight="bold"
                fontSize={13}
                sx={{
                  color:
                    resultDiff === 0
                      ? "green"
                      : resultDiff < 0
                      ? "red"
                      : "blue",
                  mt: 1,
                }}
              >
                {getMessage()}
              </Typography>
            </Box>
          </div>
        </DialogContent>

        <DialogActions
          sx={{
            display: "flex",
            gap: 1,
            px: 2,
            py: 1.5,
            alignItems: "center",
          }}
        >
          {/* ✅ Filtro de fecha a la IZQUIERDA + botón Limpiar */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, mr: "auto" }}
          >
            <TextField
              type="date"
              size="small"
              label="Fecha"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="text" onClick={handleResetDate}>
              Limpiar
            </Button>
          </Box>

          {/* 👇 Botones existentes, sin cambios de orden salvo el bloque de fecha a la izquierda */}
          <Button
            onClick={() => setConfirmOpen(true)}
            variant="contained"
            color="primary"
            startIcon={<LockIcon />}
          >
            Cerrar caja
          </Button>

          <Button
            onClick={handleExportPDF}
            variant="outlined"
            startIcon={<PrintIcon />}
          >
            Imprimir ticket PDF
          </Button>
          <Button onClick={onClose} variant="contained" color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmación de cierre */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmar cierre de caja</DialogTitle>
        <DialogContent dividers>
          <Typography fontSize={13}>
            <b>Corresponsal:</b> {reportData?.correspondent?.code} -{" "}
            {reportData?.correspondent?.name}
          </Typography>
          <Typography fontSize={13}>
            <b>Caja:</b> ID {reportData?.cash?.id} - {reportData?.cash?.name}
          </Typography>
          <Typography fontSize={13}>
            <b>Fecha de cierre:</b> {selectedDate}
          </Typography>
          <Typography fontSize={13}>
            <b>Total efectivo contado:</b> {formatCurrency(totalEffective)}
          </Typography>
          <Typography fontSize={13}>
            <b>Caja actual (sistema):</b> {formatCurrency(cashBalance)}
          </Typography>
          <Typography fontSize={13}>
            <b>Saldo:</b> {formatCurrency(resultDiff)} — {getMessage()}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <TextField
            label="Nota (opcional)"
            fullWidth
            multiline
            minRows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmCloseBox}
            variant="contained"
            color="primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1 }} /> Guardando…
              </>
            ) : (
              "Confirmar cierre"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.sev}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SnackBoxSquare;
