import React from "react";
import { Grid, Paper, Typography } from "@mui/material";
import { useTheme } from "../../../../glamour/ThemeContext"; // ← tu theme personalizado

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
  const theme = useTheme();

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
        border: `1px solid ${theme.colors.secondary}`,
        borderRadius: 2,
        backgroundColor: theme.colors.primary,
      }}
    >
      <Grid container spacing={2} justifyContent="center">
        {/* Banco */}
        <Grid item xs={12} md={3} textAlign="center">
          <Typography
            fontWeight="bold"
            color={theme.colors.text_white}
            fontSize="1.5rem"
          >
            🏦 Banco
          </Typography>

          <Typography
            fontWeight="bold"
            color={theme.colors.text_white}
            fontSize="1.8rem"
          >
            ${new Intl.NumberFormat("es-CO").format(bankDebt)}
          </Typography>
        </Grid>

        {/* Caja */}
        <Grid item xs={12} md={3} textAlign="center">
          <Typography
            fontWeight="bold"
            color={theme.colors.text_white}
            fontSize="1.5rem"
          >
            🪙 Caja
          </Typography>
          <Typography
            fontWeight="bold"
            color={theme.colors.text_white}
            fontSize="1.8rem"
          >
            ${new Intl.NumberFormat("es-CO").format(cashBalance)}
          </Typography>
        </Grid>

        {/* Cupo */}
        <Grid item xs={12} md={3} textAlign="center">
          <Typography
            fontWeight="bold"
            color={theme.colors.text_white}
            fontSize="1.5rem"
          >
            ✅ Cupo
          </Typography>
          <Typography
            fontWeight="bold"
            color={theme.colors.text_white}
            fontSize="1.8rem"
          >
            ${new Intl.NumberFormat("es-CO").format(creditLimit - bankDebt)}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FinancialSummaryPanel;
