// src/snacks/ui/reports/ThirdPartySummaryReport.tsx
import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import { useTheme } from "../../../glamour/ThemeContext";
import { getThirdPartyBalanceSheet } from "../../../store/reports/Reports";

interface Props {
  correspondentId: number;
  date?: string;
  /** Alto máximo del listado con scroll vertical */
  maxHeight?: number | string;
  /** Ancho máximo del “ticket” dentro del modal */
  ticketWidth?: number | string;
}

const ThirdPartySummaryReport: React.FC<Props> = ({
  correspondentId,
  date,
  maxHeight = 360,
  ticketWidth = 520,
}) => {
  const { colors, fonts } = useTheme();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getThirdPartyBalanceSheet(correspondentId, date);
      if (res.success && res.report?.third_party_summary) {
        setSummary(res.report.third_party_summary);
        setError(null);
      } else {
        setSummary([]);
        setError(res.message || "No se pudo obtener el reporte.");
      }
    } catch (err) {
      console.error("❌ Error al cargar resumen de terceros:", err);
      setError("Error de conexión al servidor.");
      setSummary([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correspondentId, date]);

  if (loading) {
    return (
      <Box textAlign="center" mt={2}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" mt={2}>
        <Typography color="error" fontSize="0.9rem">
          {error}
        </Typography>
      </Box>
    );
  }

  if (summary.length === 0) {
    return (
      <Box textAlign="center" mt={2}>
        <Typography color="textSecondary" fontSize="0.9rem">
          No hay terceros para mostrar.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      id="third-party-ticket"
      sx={{
        mx: "auto",
        width: "min(100%,  " + ticketWidth + "px)",
        maxWidth: ticketWidth,
        background: colors.surface,
        borderRadius: 2,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        p: 1.75,
        border: "1px solid #e9e9e9",
        position: "relative",
        overflowX: "hidden", // 👈 evita scroll horizontal
        "@media print": {
          boxShadow: "none",
          borderRadius: 0,
          border: "none",
          width: "100%",
          maxWidth: "100%",
          p: 0,
        },
      }}
    >
      {/* Cabecera */}
      <Box
        sx={{
          pb: 1,
          mb: 1,
          borderBottom: "1px dashed #cfcfcf",
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            fontFamily: fonts.heading,
            color: colors.primary,
            fontWeight: 800,
            fontSize: "1.05rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Resumen de terceros
        </Typography>
        {date && (
          <Typography
            sx={{
              mt: 0.25,
              fontSize: "0.75rem",
              color: "text.secondary",
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            Fecha: {date}
          </Typography>
        )}
      </Box>

      {/* Lista con scroll vertical y SIN scroll horizontal */}
      <Box
        sx={{
          maxHeight,
          overflowY: "auto",
          pr: 0.5,
          "@media print": { maxHeight: "unset", overflow: "visible", pr: 0 },
        }}
      >
        <Stack spacing={0}>
          {summary.map((third: any, idx: number) => {
            // Nombre robusto (toma el disponible)
            const displayName =
              third?.name ??
              third?.third?.name ??
              third?.third_name ??
              third?.id_number ??
              "—";

            return (
              <Box
                key={third.id ?? idx}
                sx={{
                  py: 0.65,
                  display: "flex", // 👈 flex evita desbordes
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: "wrap", // 👈 salta de línea si no cabe
                  borderBottom:
                    idx === summary.length - 1 ? "none" : "1px dashed #e1e1e1",
                }}
              >
                {/* Nombre (ocupa hasta 45% y corta con ellipsis) */}
                <Typography
                  title={displayName}
                  sx={{
                    flex: "1 1 45%",
                    minWidth: 140,
                    maxWidth: "60%",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayName}
                </Typography>

                {/* Balance */}
                <Typography
                  component="span"
                  sx={{
                    flex: "0 1 auto",
                    fontSize: "0.85rem",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    whiteSpace: "nowrap",
                  }}
                >
                  <strong>Balance:</strong>{" "}
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      color: Number(third.balance) >= 0 ? "green" : "red",
                    }}
                  >
                    ${formatCOP(Number(third.balance) || 0)}
                  </span>
                </Typography>

                {/* Disponible */}
                <Typography
                  component="span"
                  sx={{
                    flex: "0 1 auto",
                    fontSize: "0.85rem",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    whiteSpace: "nowrap",
                  }}
                >
                  <strong>Disponible:</strong> $
                  {formatCOP(Number(third.available_credit) || 0)}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* Pie */}
      <Box
        sx={{
          mt: 1.2,
          pt: 1.2,
          borderTop: "1px dashed #cfcfcf",
          textAlign: "center",
          "@media print": { mt: 0.5, pt: 0.5 },
        }}
      >
        <Typography
          sx={{
            fontSize: "0.72rem",
            color: "text.secondary",
            letterSpacing: "0.03em",
          }}
        >
          COBAN365 · Ticket de terceros
        </Typography>
      </Box>
    </Box>
  );
};

export default ThirdPartySummaryReport;
