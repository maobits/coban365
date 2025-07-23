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
      code: string;
      name: string;
    };
    cash: {
      id: number;
      name: string;
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
  console.log("Tipos en summary:", [...new Set(summary.map((s) => s.type))]);

  const initialBox = reportData.initial_box;
  const reportDate = reportData.report_date_pretty;
  const { correspondent, cash } = reportData;

  // Función para normalizar nombres (acentos, espacios duplicados, etc.)
  const normalize = (str: string) =>
    str
      .normalize("NFD") // elimina acentos
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ") // elimina espacios duplicados
      .trim()
      .toLowerCase();

  const thirdPartyTypes = [
    "prestamo a tercero",
    "pago de tercero",
    "prestamo de terceros",
    "pago a tercero",
    "compensacion",
  ];

  const effective = summary.filter(
    (item) => !thirdPartyTypes.includes(normalize(item.type))
  );
  const thirdParty = summary.filter((item) =>
    thirdPartyTypes.includes(normalize(item.type))
  );

  const totalEffective = effective.reduce((acc, cur) => acc + cur.subtotal, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);

  const renderSection = (
    title: string,
    rows: ReportItem[],
    highlight = false
  ) => (
    <>
      <Typography
        sx={{
          fontWeight: "bold",
          textAlign: "center",
          mt: 2,
          color: highlight ? colors.primary : "inherit",
        }}
      >
        {title}
      </Typography>
      <Table size="small" sx={{ mt: 1 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontSize: 12 }}>
              <b>TIPO</b>
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
          {rows.map((r, i) => (
            <TableRow key={i}>
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
        </TableBody>
      </Table>
    </>
  );

  const handleExportPDF = () => {
    if (printRef.current) {
      const opt = {
        margin: 0.3,
        filename: `reporte_caja_${cash?.id}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 3 },
        jsPDF: {
          unit: "mm",
          format: [100, 290],
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
      id_correspondent: reportData.correspondent.id, // ✅ CORREGIDO: usar ID numérico
      date: newDate.format("YYYY-MM-DD"),
    };

    console.log("📤 Enviando al backend:", payload);

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
      console.log("📥 Respuesta del backend:", data);

      if (data.success) {
        reportData.transactions = data.report.transactions;
        reportData.initial_box = data.report.initial_box;
        reportData.report_date_pretty = data.report.report_date_pretty;
      }
    } catch (error) {
      console.error("❌ Error al actualizar el reporte:", error);
    } finally {
      setLoading(false);
    }
  };

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
          <Typography align="center" fontWeight="bold" fontSize={15}>
            {correspondent?.code} - {correspondent?.name}
          </Typography>
          <Typography align="center" fontSize={14}>
            Caja: ID {cash?.id} - {cash?.name}
          </Typography>
          <Box textAlign="center" mb={2} mt={1.5}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha del reporte general"
                value={selectedDate}
                format="DD-MM-YYYY"
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: 180, mx: "auto" },
                  },
                }}
              />
            </LocalizationProvider>
          </Box>

          <Divider sx={{ my: 1 }} />

          {renderSection("SALDO EFECTIVO", effective, true)}

          <Box mt={1} pr={2}>
            <Typography fontWeight="bold" align="right" sx={{ fontSize: 13 }}>
              Total efectivo: {formatCurrency(totalEffective)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {renderSection("TERCEROS Y COMPENSACIONES", thirdParty)}

          <Divider sx={{ my: 2 }} />

          <Box textAlign="right" mt={2} pr={2}>
            <Typography fontSize={13}>
              Caja inicial: {formatCurrency(initialBox)}
            </Typography>
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
