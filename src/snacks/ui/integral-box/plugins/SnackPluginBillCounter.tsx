import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import { useTheme } from "../../../../glamour/ThemeContext";
import { Calculate } from "@mui/icons-material";

interface Props {
  amount: number; // Monto esperado para comparar
}

const denominations = [
  100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50,
];

const SnackPluginBillCounter: React.FC<Props> = ({ amount }) => {
  const { colors, fonts } = useTheme();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<{ [key: number]: number }>({});
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const calcTotal = Object.entries(counts).reduce((sum, [denom, qty]) => {
      const value = parseInt(denom, 10);
      return sum + value * qty;
    }, 0);
    setTotal(calcTotal);
  }, [counts]);

  const handleChange = (denom: number, value: string) => {
    const quantity = parseInt(value);
    setCounts((prev) => ({
      ...prev,
      [denom]: !isNaN(quantity) && quantity >= 0 ? quantity : 0,
    }));
  };

  const expected = Number(amount) || 0;
  const difference = total - expected;

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={<Calculate />}
        onClick={() => {
          setCounts({}); // ← limpiar al abrir
          setOpen(true);
        }}
        sx={{
          backgroundColor: colors.secondary,
          color: colors.text_white,
          fontWeight: "bold",
        }}
      >
        Calculadora POS
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontFamily: fonts.heading,
            color: colors.primary,
            fontSize: "1.5rem",
          }}
        >
          Contador de Billetes ·{" "}
          <Box component="span" fontWeight="bold">
            Esperando: ${Number(amount).toLocaleString("es-CO")}
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ backgroundColor: colors.background }}>
          <Table component={Paper}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                  Denominación
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                  Cantidad
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {denominations.map((denom) => (
                <TableRow key={denom}>
                  <TableCell sx={{ fontSize: "1.1rem" }}>
                    ${denom.toLocaleString("es-CO")}
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={counts[denom] || ""}
                      onChange={(e) => handleChange(denom, e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{ fontSize: "1.1rem" }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: "1.1rem" }}>
                    ${((counts[denom] || 0) * denom).toLocaleString("es-CO")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box sx={{ mt: 3 }}>
            <Typography fontSize="1.2rem">
              <strong>Total contado:</strong> {total.toLocaleString("es-CO")}
            </Typography>
            <Typography fontSize="1.2rem">
              <strong>Esperado:</strong> {expected.toLocaleString("es-CO")}
            </Typography>
            <Typography
              fontSize="1.2rem"
              sx={{
                color:
                  difference === 0
                    ? "green"
                    : difference > 0
                    ? "orange"
                    : "red",
                fontWeight: "bold",
              }}
            >
              {difference === 0
                ? "✅ Montos coinciden"
                : difference > 0
                ? `⚠️ Sobrante: $${difference.toLocaleString("es-CO")}`
                : `❌ Faltante: $${Math.abs(difference).toLocaleString(
                    "es-CO"
                  )}`}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SnackPluginBillCounter;
