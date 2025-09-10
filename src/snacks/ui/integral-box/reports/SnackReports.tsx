// src/snacks/ui/reports/SnackReport.tsx
import React, { useRef } from "react";
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
  CircularProgress,
  Divider,
  Box,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import { useTheme } from "../../../../glamour/ThemeContext";
import html2pdf from "html2pdf.js";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import { baseUrl } from "../../../../store/config/server";

interface ReportItem {
  type: string;
  count: number;
  subtotal: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  reportData: {
    report_date_pretty: string;
    initial_box: number;
    transactions: {
      total: number;
      summary: ReportItem[];
      cash_balance: number;
    };
    correspondent: {
      id: number; // 👈 usamos el id para la recarga por fecha
      code: string;
      name: string;
    };
    cash: {
      id: number;
      name: string;
      open?: number | null; // 1 abierto, 0 cerrado
    };
  } | null;
}

const SnackReport: React.FC<Props> = ({ open, onClose, reportData }) => {
  const { colors } = useTheme();
  const printRef = useRef<HTMLDivElement>(null);

  // Estado para las fechas.
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(dayjs());
  const [loading, setLoading] = React.useState(false);

  if (!reportData || !reportData.transactions || loading) {
    return (
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
          REPORTE GENERAL
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 4,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  const { summary, cash_balance } = reportData.transactions;
  const initialBox = reportData.initial_box;
  const reportDate = reportData.report_date_pretty;
  const { correspondent, cash } = reportData;

  // Normalizador de nombres
  const normalize = (str: string) =>
    str
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  // Tipos considerados Terceros/Compensaciones
  const thirdPartyTypes = [
    "prestamo a tercero",
    "pago de tercero",
    "prestamo de terceros",
    "pago a tercero",
    "compensacion",
    "compensaciones",
    "transferir a otra caja", // lo mapeamos a transferencia/entrada según signo
    "transferencia de efectivo",
    "entrada de efectivo",
  ];

  // 1) Orden fijo para EFECTIVO (añadí los que llegan en tu JSON)
  const effectiveOrder = [
    "retiro",
    "retiro nequi",
    "retiro con tarjeta",
    "deposito",
    "recaudos", // ← plural
    "pago de crédito", // ← coincide con JSON
    "abono a tarjeta de crédito", // ← coincide con JSON
    "recarga nequi",
    // conserva los tuyos si quieres compatibilidad:
    "recaudo",
    "pago t. credito",
    "pago cartera",
  ];

  // Orden fijo para TERCEROS/COMPENSACIONES
  const thirdPartyOrder = [
    "compensaciones",
    "pago de tercero",
    "prestamo de tercero",
    "pago a tercero",
    "prestamo a tercero",
    "transferencia de efectivo",
    "entrada de efectivo",
  ];

  // Mapear un nombre (y alias) a la fila en summary
  const findRow = (
    target: string,
    aliases: string[] = []
  ): ReportItem | null => {
    const targetN = normalize(target);
    const found = summary.find((s) => {
      const n = normalize(s.type);
      return n === targetN || aliases.map(normalize).includes(n);
    });
    return found ? { ...found } : null;
  };

  // Preparar EFECTIVO: todo lo que NO es de terceros/compensación
  const isThird = (t: string) => thirdPartyTypes.includes(normalize(t));
  const summaryEffective = summary.filter((s) => !isThird(s.type));

  // Para render con orden fijo: buscamos por nombre, o 0 si no existe
  const effectiveRowsOrdered: ReportItem[] = effectiveOrder
    .map((name) => {
      // tabla de equivalencias (alias)
      const eq: Record<string, string[]> = {
        "retiro nequi": ["retiro nequi", "retiro - nequi"],
        "recarga nequi": ["recarga nequi", "recarga - nequi"],

        // depósitos
        deposito: ["depósito"],

        // recaudos plural/singular
        recaudos: ["recaudo", "recaudos"],

        // pagos de crédito
        "pago de crédito": [
          "pago de credito",
          "pago t. credito",
          "pago tarjeta de credito",
          "pago tarjeta crédito",
        ],

        // abonos a tarjeta
        "abono a tarjeta de crédito": [
          "abono a tarjeta de credito",
          "pago cartera",
          "abono tarjeta",
        ],

        // retiros con tarjeta
        "retiro con tarjeta": ["retiro con tarjeta", "retiro tarjeta"],
      };

      // buscar coincidencia directa
      const row = findRow(name, []);
      if (row) return row;

      // buscar por alias si existe
      const aliases = eq[name] || [];
      const row2 = aliases.length ? findRow(name, aliases) : null;

      // si nada coincide, devolvemos fila vacía
      return row2 || { type: name, count: 0, subtotal: 0 };
    })
    // filtramos solo las que tienen datos
    .filter((r) => r.count > 0 || r.subtotal !== 0);

  const totalEffectiveCount = effectiveRowsOrdered.reduce(
    (acc, r) => acc + (r.count || 0),
    0
  );
  const totalEffective = effectiveRowsOrdered.reduce(
    (acc, r) => acc + (r.subtotal || 0),
    0
  );

  // Preparar TERCEROS/COMPENSACIONES desde summary
  // Caso especial: "Transferir a otra caja" → lo repartimos en una fila
  // (si el backend ya separa, se tomarán esas filas).
  const transferRow = findRow("transferir a otra caja");
  const transferAs: Record<string, ReportItem> = {
    "transferencia de efectivo": {
      type: "Transferencia de efectivo",
      count: 0,
      subtotal: 0,
    },
    "entrada de efectivo": {
      type: "Entrada de efectivo",
      count: 0,
      subtotal: 0,
    },
  };
  if (transferRow) {
    if (transferRow.subtotal < 0) {
      transferAs["transferencia de efectivo"] = {
        type: "Transferencia de efectivo",
        count: transferRow.count,
        subtotal: transferRow.subtotal,
      };
    } else if (transferRow.subtotal > 0) {
      transferAs["entrada de efectivo"] = {
        type: "Entrada de efectivo",
        count: transferRow.count,
        subtotal: transferRow.subtotal,
      };
    }
  }

  const thirdRowsOrdered: ReportItem[] = thirdPartyOrder
    .map((name) => {
      // si vienen directamente separadas
      const direct = findRow(name);
      if (direct) return direct;

      // si venía como "transferir a otra caja", usamos el reparto anterior
      if (
        name === "transferencia de efectivo" ||
        name === "entrada de efectivo"
      ) {
        const pre = transferAs[name];
        return pre ? pre : { type: name, count: 0, subtotal: 0 };
      }

      // compensación puede llegar como "compensacion"
      if (name === "compensaciones") {
        const c1 = findRow("compensaciones");
        const c2 = c1 || findRow("compensacion");
        if (c2) return c2;
      }

      return { type: name, count: 0, subtotal: 0 };
    })
    .filter((r) => r.count > 0 || r.subtotal !== 0);

  const totalThirdCount = thirdRowsOrdered.reduce(
    (acc, r) => acc + (r.count || 0),
    0
  );
  const totalThird = thirdRowsOrdered.reduce(
    (acc, r) => acc + (r.subtotal || 0),
    0
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleExportPDF = () => {
    if (printRef.current) {
      const opt = {
        margin: 0.3,
        filename: `reporte_caja_${cash?.id}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 3 },
        jsPDF: {
          unit: "mm",
          format: [120, 290],
          orientation: "portrait",
        },
      };
      html2pdf().set(opt).from(printRef.current).save();
    }
  };

  const handleDateChange = async (newDate: Dayjs | null) => {
    if (!newDate || !reportData) return;

    setSelectedDate(newDate);
    setLoading(true);

    const payload = {
      id_cash: reportData.cash.id,
      id_correspondent: reportData.correspondent.id,
      date: newDate.format("YYYY-MM-DD"),
    };

    try {
      const res = await fetch(
        `${baseUrl}/api/transactions/utils/special_reports.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (data.success) {
        // mantener la misma referencia (no cambiamos la lógica)
        reportData.transactions = data.report.transactions;
        reportData.initial_box = data.report.initial_box;
        reportData.report_date_pretty = data.report.report_date_pretty;
        // si el backend trae open en cash, lo actualizamos
        if (data.report?.cash?.open !== undefined) {
          reportData.cash.open = data.report.cash.open;
        }
      }
    } catch (error) {
      console.error("❌ Error al actualizar el reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  const estadoCaja =
    cash?.open === 1 ? "Abierta" : cash?.open === 0 ? "Cerrada" : "—";

  return (
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
        REPORTE GENERAL
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          maxWidth: 700,
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
          {/* Encabezado estilo ticket como en la imagen */}
          <Box>
            <Typography align="center" fontWeight="bold" fontSize={17}>
              REPORTE DIARIO DE CAJA
            </Typography>

            <Typography align="center" sx={{ mt: 0.2 }}>
              {correspondent?.code} - {correspondent?.name}
            </Typography>

            <Typography align="center" sx={{ mt: 0.2 }}>
              Caja: ID {cash?.id} - {cash?.name}
            </Typography>

            <Grid container spacing={1} sx={{ mt: 1.2 }}>
              <Grid item xs={6}>
                <Typography fontSize={13}>Fecha Reporte</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label=""
                      value={selectedDate}
                      format="DD-MM-YYYY"
                      onChange={handleDateChange}
                      slotProps={{
                        textField: {
                          size: "small",
                          sx: { width: 160 },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography fontSize={13}>Fecha consulta:</Typography>
                <Typography fontSize={13} mt={0.3}>
                  {reportDate}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1.2 }} />

            <Grid container>
              <Grid item xs={7}>
                <Typography fontSize={13}>
                  Estado Reporte Diario Caja
                </Typography>
              </Grid>
              <Grid item xs={5} textAlign="right">
                <Typography fontSize={13} fontWeight="bold">
                  {estadoCaja}
                </Typography>
              </Grid>

              <Grid item xs={7} mt={0.6}>
                <Typography fontSize={13}>Saldo&nbsp; inicial:</Typography>
              </Grid>
              <Grid item xs={5} mt={0.6} textAlign="right">
                <Typography fontSize={13} fontWeight="bold">
                  {formatCurrency(initialBox)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 1.6 }} />

          {/* MOVIMIENTOS EN EFECTIVO (orden fijo) */}
          <Typography
            sx={{ fontWeight: "bold", textAlign: "left", color: "inherit" }}
          >
            Movimientos en efectivo
          </Typography>

          <Table size="small" sx={{ mt: 0.8 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: 12 }}>
                  <b>TIPO</b>
                </TableCell>
                <TableCell align="center" sx={{ fontSize: 12 }}>
                  <b>CANT</b>
                </TableCell>
                <TableCell align="right" sx={{ fontSize: 12 }}>
                  <b>VALOR</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {effectiveRowsOrdered.map((r, i) => (
                <TableRow key={`eff-${i}`}>
                  <TableCell sx={{ fontSize: 13 }}>{r.type}</TableCell>
                  <TableCell align="center" sx={{ fontSize: 13 }}>
                    {r.count}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: 13,
                      color: r.subtotal < 0 ? "red" : "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(r.subtotal)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Línea total SALDO EFECTIVO */}
              <TableRow>
                <TableCell sx={{ fontSize: 13, fontWeight: "bold" }}>
                  SALDO EFECTIVO
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontSize: 13, fontWeight: "bold" }}
                >
                  {totalEffectiveCount}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontSize: 13,
                    fontWeight: "bold",
                    color: totalEffective < 0 ? "red" : "inherit",
                  }}
                >
                  {formatCurrency(totalEffective)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Divider sx={{ my: 2 }} />

          {/* TERCEROS Y COMPENSACIONES (orden fijo) */}
          <Table size="small" sx={{ mt: 0.2 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: 12 }}>
                  <b>TIPO</b>
                </TableCell>
                <TableCell align="center" sx={{ fontSize: 12 }}>
                  <b>CANT</b>
                </TableCell>
                <TableCell align="right" sx={{ fontSize: 12 }}>
                  <b>VALOR</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {thirdRowsOrdered.map((r, i) => (
                <TableRow key={`tp-${i}`}>
                  <TableCell sx={{ fontSize: 13 }}>
                    {{
                      compensaciones: "Compensaciones",
                      "pago de tercero": "Pago de tercero",
                      "prestamo de tercero": "Prestamo de tercero",
                      "pago a tercero": "Pago a tercero",
                      "prestamo a tercero": "Prestamo a tercero",
                      "transferencia de efectivo": "Transferencia de efectivo",
                      "entrada de efectivo": "Entrada de efectivo",
                    }[normalize(r.type)] || r.type}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: 13 }}>
                    {r.count}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: 13,
                      color: r.subtotal < 0 ? "red" : "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(r.subtotal)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Línea total SALDO TERCERO Y COMPENSACIONES */}
              <TableRow>
                <TableCell sx={{ fontSize: 13, fontWeight: "bold" }}>
                  SALDO TERCERO Y COMPENSACIONES
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontSize: 13, fontWeight: "bold" }}
                >
                  {totalThirdCount}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontSize: 13,
                    fontWeight: "bold",
                    color: totalThird < 0 ? "red" : "inherit",
                  }}
                >
                  {formatCurrency(totalThird)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Divider sx={{ my: 2 }} />

          {/* Caja actual al final */}
          <Box textAlign="right" mt={1} pr={2}>
            <Typography fontSize={13} fontWeight="bold">
              CAJA ACTUAL: {formatCurrency(cash_balance)}
            </Typography>
          </Box>
        </div>
      </DialogContent>

      <DialogActions>
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
  );
};

export default SnackReport;
