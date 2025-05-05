import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useTheme } from "../../../glamour/ThemeContext";
import { listOtherAccountStatement } from "../../../store/other/CrudOther";

interface Props {
  correspondentId: number;
  onSelectThird: (thirdId: number | null) => void;
}

const SnackBalanceThird: React.FC<Props> = ({
  correspondentId,
  onSelectThird,
}) => {
  const { colors, fonts } = useTheme();

  const [others, setOthers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (correspondentId) {
      fetchOtherBalances();
    }
  }, [correspondentId]);

  const fetchOtherBalances = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listOtherAccountStatement(correspondentId);
      setOthers(data);
      const defaultThird = data[0] || null;
      setSelected(defaultThird);
      onSelectThird(defaultThird?.third?.id || null); // Notifica al padre
    } catch (err: any) {
      setError("No se pudo obtener el balance de los terceros.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: any) => {
    const selectedId = event.target.value;
    const found = others.find((o) => o.third.id === selectedId);
    setSelected(found);
    onSelectThird(found?.third?.id || null); // Notifica al padre
  };

  return (
    <Box mt={2}>
      {/* Encabezado estilizado */}
      <Box
        sx={{
          backgroundColor: colors.primary,
          color: colors.secondary,
          padding: "12px 16px",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Typography
          variant="h6"
          fontFamily={fonts?.heading}
          sx={{ fontWeight: "bold" }}
        >
          Estado de Cuenta del Tercero
        </Typography>
      </Box>

      <Box sx={{ backgroundColor: colors.background, padding: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : others.length === 0 ? (
          <Typography>
            No hay terceros asociados a este corresponsal.
          </Typography>
        ) : (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tercero</InputLabel>
              <Select
                value={selected?.third.id || ""}
                label="Tercero"
                onChange={handleChange}
              >
                {others.map((o) => (
                  <MenuItem key={o.third.id} value={o.third.id}>
                    {o.third.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selected && (
              <Card sx={{ backgroundColor: colors.card }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    fontFamily={fonts?.heading}
                  >
                    {selected.third.name}
                  </Typography>
                  <Typography>
                    Balance:{" "}
                    <strong
                      style={{ color: selected.balance < 0 ? "red" : "green" }}
                    >
                      ${selected.balance.toLocaleString()}
                    </strong>
                  </Typography>
                  <Typography>
                    Total a Cobrar: $
                    {selected.total_receivable.toLocaleString()}
                  </Typography>
                  <Typography>
                    Total a Pagar: ${selected.total_to_pay.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default SnackBalanceThird;
