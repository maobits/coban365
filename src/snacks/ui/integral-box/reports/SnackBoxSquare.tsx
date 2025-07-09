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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import { useTheme } from "../../../../glamour/ThemeContext";
import html2pdf from "html2pdf.js";

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
      code: string;
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

  useEffect(() => {
    if (open) {
      setCounts({});
      setFocusedKey(null);
    }
  }, [open]);

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
  const cashBalance = reportData?.transactions?.cash_balance || 0;
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
            Fecha: {reportData?.report_date_pretty}
          </Typography>

          {renderTable("BILLETES", "bills")}
          {renderTable("FAJOS", "bundles")}
          {renderTable("MONEDAS", "coins")}

          {/* Salto de página visual */}
          <div style={{ pageBreakBefore: "always" }} />

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
                  resultDiff === 0 ? "green" : resultDiff < 0 ? "red" : "blue",
                mt: 1,
              }}
            >
              {getMessage()}
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

export default SnackBoxSquare;
