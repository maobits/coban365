import React from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import { useTheme } from "../../../../glamour/ThemeContext";

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
      elevation={3}
      sx={{
        p: 5, // Más padding general
        border: `1px solid ${theme.colors.secondary}`,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
      }}
    >
      <Grid container spacing={6} justifyContent="center">
        {/* Banco */}
        <Grid item xs={12} md={4}>
          <Box textAlign="center" py={2}>
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize="1.8rem"
              gutterBottom
            >
              🏦 Banco
            </Typography>
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize="2rem"
            >
              ${new Intl.NumberFormat("es-CO").format(bankDebt)}
            </Typography>
          </Box>
        </Grid>

        {/* Caja */}
        <Grid item xs={12} md={4}>
          <Box textAlign="center" py={2}>
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize="1.8rem"
              gutterBottom
            >
              🪙 Caja
            </Typography>
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize="2rem"
            >
              ${new Intl.NumberFormat("es-CO").format(cashBalance)}
            </Typography>
          </Box>
        </Grid>

        {/* Cupo */}
        <Grid item xs={12} md={4}>
          <Box textAlign="center" py={2}>
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize="1.8rem"
              gutterBottom
            >
              ✅ Cupo
            </Typography>
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize="2rem"
            >
              ${new Intl.NumberFormat("es-CO").format(creditLimit - bankDebt)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FinancialSummaryPanel;
