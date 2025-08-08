import React from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import { useTheme } from "../../../../glamour/ThemeContext";

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
  const fontTitle = { xs: "0.62rem", sm: "0.7rem" };
  const fontValue = { xs: "0.85rem", sm: "1rem" };

  return (
    <Box
      sx={{
        backgroundColor: "#f9f9f9",
        borderRadius: 2,
        p: 1,
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        mt: 0, // ❌ sin margen superior
        mb: 0, // ❌ sin margen inferior
      }}
    >
      <Typography
        variant="h6"
        fontSize="1rem"
        fontWeight="bold"
        sx={{ mb: 1, mt: 0 }}
      >
        Resumen financiero
      </Typography>

      <Grid container spacing={1}>
        {/* En caja */}
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={1}
            sx={{
              p: 0.5,
              borderRadius: 2,
              backgroundColor: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <Box display="flex" alignItems="center" gap={0.8}>
              <AccountBoxIcon sx={{ fontSize: "1.3rem", color: "#FBC02D" }} />
              <Box>
                <Typography
                  fontSize={fontTitle}
                  color="text.secondary"
                  sx={{ mt: 0 }}
                >
                  En caja
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
            elevation={1}
            sx={{
              p: 0.5,
              borderRadius: 2,
              backgroundColor: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <Box display="flex" alignItems="center" gap={0.8}>
              <AccountBalanceIcon
                sx={{ fontSize: "1.3rem", color: "#E64A19" }}
              />
              <Box>
                <Typography
                  fontSize={fontTitle}
                  color="text.secondary"
                  sx={{ mt: 0 }}
                >
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
            elevation={1}
            sx={{
              p: 0.5,
              borderRadius: 2,
              backgroundColor: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <Box display="flex" alignItems="center" gap={0.8}>
              <MonetizationOnIcon
                sx={{ fontSize: "1.3rem", color: "#43A047" }}
              />
              <Box>
                <Typography
                  fontSize={fontTitle}
                  color="text.secondary"
                  sx={{ mt: 0 }}
                >
                  Cupo
                </Typography>
                <Typography fontWeight="bold" fontSize={fontValue}>
                  $
                  {new Intl.NumberFormat("es-CO").format(
                    creditLimit - bankDebt
                  )}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialSummaryPanel;
