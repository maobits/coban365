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

  const compactFont = { xs: "1rem", sm: "1.1rem", md: "1.2rem" };
  const compactValueFont = { xs: "1.2rem", sm: "1.4rem", md: "1.6rem" };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mr: 2, // ✅ margen derecho agregado
        border: `1px solid ${theme.colors.secondary}`,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        width: "100%",
        overflowX: "auto",
      }}
    >
      <Grid
        container
        spacing={2}
        justifyContent="center"
        alignItems="center"
        wrap="wrap"
      >
        {/* Banco */}
        <Grid item xs={12} sm={4}>
          <Box textAlign="center">
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize={compactFont}
            >
              🏦 Banco
            </Typography>
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize={compactValueFont}
            >
              ${new Intl.NumberFormat("es-CO").format(bankDebt)}
            </Typography>
          </Box>
        </Grid>

        {/* Caja */}
        <Grid item xs={12} sm={4}>
          <Box textAlign="center">
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize={compactFont}
            >
              🪙 Caja
            </Typography>
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize={compactValueFont}
            >
              ${new Intl.NumberFormat("es-CO").format(cashBalance)}
            </Typography>
          </Box>
        </Grid>

        {/* Cupo */}
        <Grid item xs={12} sm={4}>
          <Box textAlign="center">
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize={compactFont}
            >
              ✅ Cupo
            </Typography>
            <Typography
              fontWeight="bold"
              color={theme.colors.text_white}
              fontSize={compactValueFont}
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
