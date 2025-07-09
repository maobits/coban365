// src/snacks/ui/reports/SnackReport.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "../../../../glamour/ThemeContext";

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

  if (!reportData || !reportData.transactions) {
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

  const { summary, total, cash_balance } = reportData.transactions;
  const initialBox = reportData.initial_box;
  const reportDate = reportData.report_date_pretty;
  const { correspondent, cash } = reportData;

  const thirdPartyTypes = [
    "Préstamo a tercero",
    "Pago de tercero",
    "Préstamo de terceros",
    "Pago a tercero",
    "Compensación",
  ];

  const effective = summary.filter(
    (item) => !thirdPartyTypes.includes(item.type)
  );
  const thirdParty = summary.filter((item) =>
    thirdPartyTypes.includes(item.type)
  );

  const totalEffective = effective.reduce((acc, cur) => acc + cur.subtotal, 0);
  const totalThirdParty = thirdParty.reduce(
    (acc, cur) => acc + cur.subtotal,
    0
  );

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
        variant="subtitle2"
        sx={{
          mt: 2,
          mb: 1,
          fontWeight: "bold",
          color: highlight ? colors.primary : "text.primary",
          borderBottom: `2px solid ${highlight ? colors.primary : "#ccc"}`,
          pb: 0.5,
        }}
      >
        {title}
      </Typography>
      <Table size="small" sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f1f1f1" }}>
            <TableCell sx={{ width: "60%" }}>
              <b>TIPO</b>
            </TableCell>
            <TableCell align="center" sx={{ width: "20%" }}>
              <b>CANTIDAD</b>
            </TableCell>
            <TableCell align="right" sx={{ width: "20%" }}>
              <b>SUBTOTAL</b>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell sx={{ width: "60%" }}>{r.type}</TableCell>
              <TableCell align="center" sx={{ width: "20%" }}>
                {r.count}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  width: "20%",
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

      <DialogContent sx={{ p: 3, backgroundColor: "#fff", mt: 3 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography fontSize={14}>
              <b>CORRESPONSAL:</b>{" "}
              {reportData.correspondent
                ? `${reportData.correspondent.code} - ${reportData.correspondent.name}`
                : "—"}
            </Typography>
            <Typography fontSize={14}>
              <b>MOVIMIENTOS CAJA:</b>{" "}
              {reportData.cash
                ? `ID ${reportData.cash.id} - ${reportData.cash.name}`
                : "—"}
            </Typography>

            <Typography fontSize={14}>
              <b>FECHA - HORA:</b> {reportDate}
            </Typography>
          </Grid>
          <Grid item xs={6} textAlign="right">
            <Typography fontSize={15} fontWeight="bold">
              CAJA INICIAL: {formatCurrency(initialBox)}
            </Typography>
          </Grid>
        </Grid>

        {renderSection("SALDO EFECTIVO", effective, true)}

        <Typography
          fontSize={14}
          sx={{ mt: 1, fontWeight: "bold", textAlign: "left" }}
        >
          TOTAL SALDO EFECTIVO: {formatCurrency(totalEffective)}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {renderSection("TERCEROS Y COMPENSACIONES", thirdParty)}

        <Divider sx={{ my: 2 }} />

        <Typography
          variant="h6"
          fontWeight="bold"
          textAlign="right"
          sx={{ mt: 2 }}
        >
          CAJA ACTUAL: {formatCurrency(cash_balance)}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SnackReport;
