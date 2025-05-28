import React from "react";
import { Box, Grid, Paper, Typography, LinearProgress } from "@mui/material";

interface Props {
  bankDebt: number;
  cashBalance: number;
  creditLimit: number;
  cashCapacity: number;
}

const FinancialSummaryPanel: React.FC<Props> = ({
  bankDebt,
  cashBalance,
  creditLimit,
  cashCapacity,
}) => {
  const debtPercentage = creditLimit ? (bankDebt / creditLimit) * 100 : 0;
  const availablePercentage = creditLimit
    ? ((creditLimit - bankDebt) / creditLimit) * 100
    : 0;
  const saldoCajaPercentage = creditLimit
    ? (cashBalance / creditLimit) * 100
    : 0;
  const cajaCapacidad = cashCapacity || 1;
  const cashPercentage = (cashBalance / cajaCapacidad) * 100;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        border: "1px solid #90ee90",
        borderRadius: 2,
        backgroundColor: "#0e1a37",
      }}
    >
      <Grid container spacing={2} justifyContent="center">
        {/* Deuda al banco */}
        <Grid item xs={12} md={3} textAlign="center">
          <Typography variant="h6" fontWeight="bold" color="#A4FF47">
            💵 Deuda al banco
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="#A4FF47">
            ${new Intl.NumberFormat("es-CO").format(bankDebt)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={debtPercentage}
            sx={{ mt: 1, height: 8 }}
          />
          <Typography variant="caption" color="#fff">
            {debtPercentage.toFixed(1)}% del cupo usado
          </Typography>
        </Grid>

        {/* Saldo en caja */}
        <Grid item xs={12} md={3} textAlign="center">
          <Typography variant="h6" fontWeight="bold" color="#FFD700">
            💰 Saldo en caja
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="#FFD700">
            ${new Intl.NumberFormat("es-CO").format(cashBalance)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={cashPercentage}
            sx={{ mt: 1, height: 8 }}
          />
          <Typography variant="caption" color="#fff">
            {cashPercentage.toFixed(1)}% de capacidad
          </Typography>
        </Grid>

        {/* Cupo total */}
        <Grid item xs={12} md={3} textAlign="center">
          <Typography variant="h6" fontWeight="bold" color="#C0C0C0">
            🏦 Cupo total
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="#C0C0C0">
            ${new Intl.NumberFormat("es-CO").format(creditLimit)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={saldoCajaPercentage}
            sx={{ mt: 1, height: 8 }}
          />
          <Typography variant="caption" color="#fff">
            {saldoCajaPercentage.toFixed(1)}% del cupo ocupado con saldo en caja
          </Typography>
        </Grid>

        {/* Cupo disponible */}
        <Grid item xs={12} md={3} textAlign="center">
          <Typography variant="h6" fontWeight="bold" color="#8BC34A">
            ✅ Cupo disponible
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="#8BC34A">
            ${new Intl.NumberFormat("es-CO").format(creditLimit - bankDebt)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={availablePercentage}
            sx={{ mt: 1, height: 8 }}
          />
          <Typography variant="caption" color="#fff">
            {availablePercentage.toFixed(1)}% del cupo disponible
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FinancialSummaryPanel;
