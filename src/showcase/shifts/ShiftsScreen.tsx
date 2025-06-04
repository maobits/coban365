import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "../../glamour/ThemeContext";
import { createShift } from "../../store/shift/CrudShift";

const ShiftsRegisterScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { correspondentId, cashId } = useParams<{
    correspondentId: string;
    cashId: string;
  }>();

  const [form, setForm] = useState({
    transactionType: "",
    amount: "",
    agreement: "",
    reference: "",
    fullName: "",
    documentId: "",
    phone: "",
    email: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    const { transactionType, amount, fullName, documentId, email } = form;

    // Validación básica
    if (
      !transactionType ||
      !amount ||
      !fullName ||
      !documentId ||
      !email ||
      isNaN(Number(amount))
    ) {
      setError(
        "⚠️ Por favor completa todos los campos obligatorios correctamente."
      );
      return;
    }

    // Validar parámetros
    const parsedCorrespondentId = parseInt(correspondentId || "");
    const parsedCashId = parseInt(cashId || "");

    if (isNaN(parsedCorrespondentId) || isNaN(parsedCashId)) {
      setError("❌ Error: ID de corresponsal o caja no válidos en la URL.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        correspondent_id: parsedCorrespondentId,
        cash_id: parsedCashId,
        transaction_type: transactionType,
        amount: Number(amount),
        agreement: form.agreement,
        reference: form.reference,
        full_name: fullName,
        document_id: documentId,
        phone: form.phone,
        email: email,
      };

      const response = await createShift(payload);

      if (response.success) {
        setSuccess(true);
        setForm({
          transactionType: "",
          amount: "",
          agreement: "",
          reference: "",
          fullName: "",
          documentId: "",
          phone: "",
          email: "",
        });
        // No navegamos fuera: permanece en la misma URL
      } else {
        // Mensaje detallado si falla por clave foránea u otro
        const message =
          response.message?.includes("foreign key") ||
          response.message?.includes("constraint")
            ? "❌ Verifica que el corresponsal y la caja existan en el sistema."
            : response.message || "❌ No se pudo registrar el turno.";
        setError(message);
      }
    } catch (err) {
      console.error("❌ Error al enviar turno:", err);
      setError("❌ Error al enviar el turno. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{ p: 4, backgroundColor: colors.background_grey, minHeight: "100vh" }}
    >
      <Paper sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Registrar Turno
        </Typography>

        <Grid container spacing={2}>
          {[
            {
              label: "Tipo de transacción",
              key: "transactionType",
              required: true,
            },
            { label: "Valor", key: "amount", required: true },
            { label: "Convenio", key: "agreement" },
            { label: "Referencia", key: "reference" },
            { label: "Nombres", key: "fullName", required: true },
            {
              label: "Documento de identidad",
              key: "documentId",
              required: true,
            },
            { label: "Número de celular", key: "phone" },
            { label: "Correo electrónico", key: "email", required: true },
          ].map(({ label, key, required }) => (
            <Grid item xs={12} sm={6} key={key}>
              <TextField
                fullWidth
                label={label + (required ? " *" : "")}
                type={key === "amount" ? "number" : "text"}
                value={form[key as keyof typeof form]}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            </Grid>
          ))}
        </Grid>

        <Box mt={4} textAlign="right">
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrar Turno"}
          </Button>
        </Box>
      </Paper>

      {/* Snackbar de error */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Snackbar de éxito */}
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          🎉 Turno registrado exitosamente
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ShiftsRegisterScreen;
