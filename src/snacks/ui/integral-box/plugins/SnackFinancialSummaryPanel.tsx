import React from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import { useTheme } from "../../../../glamour/ThemeContext";

// Importar íconos
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

interface Props {
  bankDebt: number;
  cashBalance: number;
  creditLimit: number;
  cashCapacity: number;
  thirdPartyBalanceInverted: number;
}

const FinancialSummaryPanel: React.FC<Props> = ({
  bankDebt,
  cashBalance,
  creditLimit,
  cashCapacity,
  thirdPartyBalanceInverted,
}) => {
  const theme = useTheme();
  const fontTitle = { xs: "1.3rem", sm: "1.6rem", md: "1.8rem" };
  const fontValue = { xs: "1.8rem", sm: "2.2rem", md: "2.6rem" };

  return (
    <Grid container spacing={2}>
      {/* Efectivo en Caja */}
      <Grid item xs={12} sm={4}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <AccountBoxIcon
              sx={{ fontSize: "2.4rem", color: "#FBC02D" }} // amarillo
            />
            <Box>
              <Typography fontSize={fontTitle} color="text.secondary">
                Efectivo En Caja
              </Typography>
              <Typography fontWeight="bold" fontSize={fontValue}>
                ${new Intl.NumberFormat("es-CO").format(cashBalance)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Banco */}
      <Grid item xs={12} sm={4}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <AccountBalanceIcon
              sx={{ fontSize: "2.4rem", color: "#E64A19" }} // naranja/rojo
            />
            <Box>
              <Typography fontSize={fontTitle} color="text.secondary">
                Banco
              </Typography>
              <Typography fontWeight="bold" fontSize={fontValue}>
                ${new Intl.NumberFormat("es-CO").format(bankDebt)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Cupo */}
      <Grid item xs={12} sm={4}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <MonetizationOnIcon
              sx={{ fontSize: "2.4rem", color: "#43A047" }} // verde
            />
            <Box>
              <Typography fontSize={fontTitle} color="text.secondary">
                Cupo
              </Typography>
              <Typography fontWeight="bold" fontSize={fontValue}>
                ${new Intl.NumberFormat("es-CO").format(creditLimit - bankDebt)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default FinancialSummaryPanel;
