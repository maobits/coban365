// src/snacks/ui/reports/SnackReportBoxes.tsx
import React, { useEffect, useState, useRef } from "react";
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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import html2pdf from "html2pdf.js";
import dayjs, { Dayjs } from "dayjs";
import { useTheme } from "../../../../glamour/ThemeContext";
import { getSpecialReportBoxes } from "../../../../store/reports/Reports"; // asegúrate de importar correctamente

interface ReportItem {
  type: string;
  count: number;
  subtotal: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  correspondentId: number;
}

const SnackReportBoxes: React.FC<Props> = ({
  open,
  onClose,
  correspondentId,
}) => {
  const { colors } = useTheme();
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (date?: string) => {
    setLoading(true);
    try {
      const res = await getSpecialReportBoxes(correspondentId, date);
      setReportData(res);
    } catch (err) {
      console.error("❌ Error al obtener el reporte por cajas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchReport(selectedDate?.format("YYYY-MM-DD"));
    }
  }, [open]);

  const handleDateChange = (newDate: Dayjs | null) => {
    setSelectedDate(newDate);
    if (newDate) {
      fetchReport(newDate.format("YYYY-MM-DD"));
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);

  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const thirdPartyTypes = [
    "prestamo a tercero",
    "pago de tercero",
    "prestamo de terceros",
    "pago a tercero",
    "compensacion",
  ];

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
        filename: `reporte_cajas_corresponsal_${correspondentId}.pdf`,
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
        REPORTE POR CAJAS
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {loading || !reportData ? (
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
      ) : (
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
              Reporte por cajas del corresponsal
            </Typography>
            <Typography align="center" fontSize={13}>
              Fecha: {reportData.report_date_pretty}
            </Typography>

            <Box textAlign="center" my={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Fecha del reporte"
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

            <Divider sx={{ my: 2 }} />

            {reportData.boxes.map((box: any, idx: number) => {
              const effective = box.transactions.summary.filter(
                (item: ReportItem) =>
                  !thirdPartyTypes.includes(normalize(item.type))
              );
              const thirdParty = box.transactions.summary.filter(
                (item: ReportItem) =>
                  thirdPartyTypes.includes(normalize(item.type))
              );

              const totalEffective = effective.reduce(
                (acc, cur) => acc + cur.subtotal,
                0
              );

              return (
                <Box key={idx} mb={3}>
                  <Typography fontWeight="bold" fontSize={14} mb={1}>
                    Caja ID {box.id} - {box.name}
                  </Typography>

                  {renderSection("SALDO EFECTIVO", effective, true)}

                  <Typography align="right" fontSize={13} mt={1}>
                    Total efectivo: {formatCurrency(totalEffective)}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {renderSection("TERCEROS Y COMPENSACIONES", thirdParty)}

                  <Divider sx={{ my: 2 }} />

                  <Box textAlign="right" mt={1}>
                    <Typography fontSize={13}>
                      Caja inicial: {formatCurrency(box.initial_box)}
                    </Typography>
                    <Typography fontWeight="bold" fontSize={13}>
                      CAJA ACTUAL:{" "}
                      {formatCurrency(box.transactions.cash_balance)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}

            <Divider sx={{ my: 2 }} />

            <Box mt={2} textAlign="right">
              <Typography fontSize={13}>
                Total inicial: {formatCurrency(reportData.totals.initial_total)}
              </Typography>
              <Typography fontSize={13}>
                Transacciones totales: {reportData.totals.total_transactions}
              </Typography>
              <Typography fontSize={13} fontWeight="bold">
                EFECTIVO TOTAL:{" "}
                {formatCurrency(reportData.totals.effective_total)}
              </Typography>
            </Box>
          </div>
        </DialogContent>
      )}

      <DialogActions>
        <Button
          onClick={handleExportPDF}
          variant="outlined"
          startIcon={<PrintIcon />}
        >
          Imprimir PDF
        </Button>
        <Button onClick={onClose} variant="contained" color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SnackReportBoxes;
