// src/snacks/ui/reports/SnackReportComission.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  Stack,
  TextField,
  Button,
  Divider,
} from "@mui/material";
import { Download, Search } from "@mui/icons-material";
import { useTheme } from "../../../glamour/ThemeContext";
import {
  getCommissions,
  CommissionsResponse,
  RangeKey,
} from "../../../store/reports/Reports";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Props = {
  correspondent?: any;
  correspondentId?: number;
  idCash?: number;
  date?: string;
  correspondentName?: string;
  className?: string;
};

const COLUMNS: { key: RangeKey; title: string }[] = [
  { key: "leq80", title: "Inferior o igual $80.000" },
  { key: "between", title: "Entre $ 80.000 & $800.000" },
  { key: "gte800", title: "Superior a $800.000" },
];

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(isFinite(n) ? n : 0);

/** ====== Hook ====== */
const useCommissions = (
  ids: { idCash?: number; idCorrespondent?: number },
  filters: { date?: string; startDate?: string; endDate?: string }
) => {
  const [data, setData] = useState<CommissionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canQuery = !!(ids.idCash || ids.idCorrespondent);

  const fetchData = async () => {
    if (!canQuery) {
      setError("Debes enviar idCash o idCorrespondent.");
      setData(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await getCommissions(
        ids.idCash
          ? { idCash: ids.idCash }
          : { idCorrespondent: ids.idCorrespondent! },
        {
          date: filters.date,
          startDate: filters.date ? undefined : filters.startDate,
          endDate: filters.date ? undefined : filters.endDate,
        }
      );
      setData(res);
    } catch (e: any) {
      setError(e?.message || "No fue posible obtener las comisiones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ids.idCash,
    ids.idCorrespondent,
    filters.date,
    filters.startDate,
    filters.endDate,
  ]);

  return { data, loading, error, refetch: fetchData, canQuery };
};

const SnackReportComission: React.FC<Props> = ({
  correspondent,
  correspondentId,
  idCash,
  date,
  correspondentName,
  className,
}) => {
  const { colors, fonts } = useTheme();

  // ===== Resolver id del corresponsal si no viene directo =====
  const resolvedCorrespondentId = useMemo<number | undefined>(() => {
    if (typeof correspondentId === "number") return correspondentId;

    if (correspondent && typeof correspondent === "object") {
      const candidates = [
        correspondent.id,
        correspondent.correspondent_id,
        correspondent.id_correspondent,
      ].filter((v) => typeof v === "number");
      if (candidates.length > 0) return candidates[0] as number;
    }
    return undefined;
  }, [correspondentId, correspondent]);

  // ===== Filtros de fecha en la UI =====
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [singleDate, setSingleDate] = useState<string>(date || "");

  // Parámetros para el servicio
  const params = useMemo(
    () =>
      idCash
        ? { idCash }
        : resolvedCorrespondentId
        ? { idCorrespondent: resolvedCorrespondentId }
        : {},
    [idCash, resolvedCorrespondentId]
  );

  const { data, loading, error, refetch, canQuery } = useCommissions(params, {
    date: singleDate || undefined,
    startDate: singleDate ? undefined : startDate || undefined,
    endDate: singleDate ? undefined : endDate || undefined,
  });

  const incomes = data?.summary.Ingresos;
  const withdrawals = data?.summary.Retiros;

  const scopeText = useMemo(() => {
    if (idCash) return `Caja: ${idCash}`;
    if (resolvedCorrespondentId)
      return `Corresponsal: ${
        correspondentName ??
        correspondent?.name ??
        correspondent?.correspondent_name ??
        resolvedCorrespondentId
      } (todas las cajas)`;
    return "—";
  }, [
    idCash,
    resolvedCorrespondentId,
    correspondentName,
    correspondent?.name,
    correspondent?.correspondent_name,
  ]);

  const rangeText = useMemo(() => {
    if (singleDate) return `Día: ${singleDate}`;
    if (startDate && endDate) return `Rango: ${startDate} a ${endDate}`;
    return "Rango: —";
  }, [singleDate, startDate, endDate]);

  const totalsPeriodo = useMemo(() => {
    if (!data)
      return { movimientos: 0, comEntradas: 0, comSalidas: 0, comTotal: 0 };
    const m = (incomes?.totals.count || 0) + (withdrawals?.totals.count || 0);
    const ce = incomes?.totals.total_commission || 0;
    const cs = withdrawals?.totals.total_commission || 0;
    return {
      movimientos: m,
      comEntradas: ce,
      comSalidas: cs,
      comTotal: ce + cs,
    };
  }, [data, incomes, withdrawals]);

  const mustWarn = !canQuery;

  // ===== Exportación PDF (Horizontal) =====
  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

    const title = `REPORTE DE COMISIONES`;
    doc.setFontSize(18);
    doc.text(title, 40, 40);

    doc.setFontSize(11);
    doc.text(scopeText, 40, 62);
    doc.text(rangeText, 40, 80);

    // Usar EXACTAMENTE los mismos encabezados que en la GUI
    const columnsTitles = ["Rango", ...COLUMNS.map((c) => c.title)];

    autoTable(doc, {
      startY: 110,
      head: [columnsTitles],
      body: [
        [
          "Número de transacciones",
          incomes?.ranges.leq80.transactions ?? 0,
          incomes?.ranges.between.transactions ?? 0,
          incomes?.ranges.gte800.transactions ?? 0,
        ],
        [
          "Valor total de transacciones",
          fmtCOP(incomes?.ranges.leq80.total_amount ?? 0),
          fmtCOP(incomes?.ranges.between.total_amount ?? 0),
          fmtCOP(incomes?.ranges.gte800.total_amount ?? 0),
        ],
        ["Tarifa", "$160", "0,20%", "$1.600"],
        [
          "Total",
          fmtCOP(incomes?.ranges.leq80.total_commission ?? 0),
          fmtCOP(incomes?.ranges.between.total_commission ?? 0),
          fmtCOP(incomes?.ranges.gte800.total_commission ?? 0),
        ],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [17, 17, 17] },
      theme: "grid",
      margin: { left: 40, right: 40 },
      tableWidth: "auto",
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [columnsTitles],
      body: [
        [
          "Número de transacciones",
          withdrawals?.ranges.leq80.transactions ?? 0,
          withdrawals?.ranges.between.transactions ?? 0,
          withdrawals?.ranges.gte800.transactions ?? 0,
        ],
        [
          "Valor total de transacciones",
          fmtCOP(withdrawals?.ranges.leq80.total_amount ?? 0),
          fmtCOP(withdrawals?.ranges.between.total_amount ?? 0),
          fmtCOP(withdrawals?.ranges.gte800.total_amount ?? 0),
        ],
        ["Tarifa", "$80", "0,10%", "$800"],
        [
          "Total",
          fmtCOP(withdrawals?.ranges.leq80.total_commission ?? 0),
          fmtCOP(withdrawals?.ranges.between.total_commission ?? 0),
          fmtCOP(withdrawals?.ranges.gte800.total_commission ?? 0),
        ],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [17, 17, 17] },
      theme: "grid",
      margin: { left: 40, right: 40 },
      tableWidth: "auto",
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["DETALLE", "NÚMERO DE MOVIMIENTOS", "COMISIÓN"]],
      body: [
        [
          "TRANSACCIONES DE ENTRADA",
          incomes?.totals.count ?? 0,
          fmtCOP(incomes?.totals.total_commission ?? 0),
        ],
        [
          "TRANSACCIONES DE SALIDA",
          withdrawals?.totals.count ?? 0,
          fmtCOP(withdrawals?.totals.total_commission ?? 0),
        ],
        ["TOTALES", totalsPeriodo.movimientos, fmtCOP(totalsPeriodo.comTotal)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [17, 17, 17] },
      theme: "grid",
      margin: { left: 40, right: 40 },
      tableWidth: "auto",
    });

    doc.save("reporte_comisiones.pdf");
  };

  return (
    <Box className={className} sx={{ mt: 1 }}>
      {/* ======= Título centrado ======= */}
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography
          sx={{ letterSpacing: 1 }}
          variant="h5"
          fontFamily={fonts.heading}
          fontWeight={800}
        >
          REPORTE DE COMISIONES
        </Typography>
      </Box>

      {/* ======= Filtros superiores ======= */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="center"
        sx={{ mb: 2 }}
      >
        <TextField
          type="date"
          label="Desde"
          InputLabelProps={{ shrink: true }}
          value={singleDate ? "" : startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={!!singleDate}
          sx={{ minWidth: 220 }}
        />
        <TextField
          type="date"
          label="Hasta"
          InputLabelProps={{ shrink: true }}
          value={singleDate ? "" : endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={!!singleDate}
          sx={{ minWidth: 220 }}
        />
        <TextField
          type="date"
          label="Día exacto (opcional)"
          InputLabelProps={{ shrink: true }}
          value={singleDate}
          onChange={(e) => setSingleDate(e.target.value)}
          helperText="Si eliges un día, se ignora el rango."
          sx={{ minWidth: 240 }}
        />
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<Search />}
            onClick={refetch}
            disabled={!canQuery}
            sx={{ px: 3, borderRadius: 999 }}
          >
            Buscar
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportPDF}
            disabled={!data}
            sx={{ px: 3, borderRadius: 999 }}
          >
            PDF (Horizontal)
          </Button>
        </Stack>
      </Stack>

      {/* ======= Resumen visible con ALCANCE + RANGO ======= */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Alcance
            </Typography>
            <Typography variant="body1">{scopeText}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {singleDate ? "Fecha seleccionada" : "Rango de fechas"}
            </Typography>
            <Typography variant="body1">
              {rangeText.replace("Rango: ", "")}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {mustWarn && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Debes enviar <strong>idCash</strong> o{" "}
          <strong>idCorrespondent</strong>.
        </Alert>
      )}

      {loading && (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      )}
      {!mustWarn && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {data && !mustWarn && (
        <Stack spacing={3}>
          {/* ENTRADA */}
          <Paper elevation={1}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: colors.primary,
                color: colors.text_white,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              TRANSACCIONES DE ENTRADA
            </Box>
            <Box sx={{ p: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#111", "& th": { color: "#fff" } }}>
                    <TableCell>Rango</TableCell>
                    {COLUMNS.map((c) => (
                      <TableCell key={c.key} align="center">
                        {c.title}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={{ bgcolor: "rgba(0,0,0,0.03)" }}>
                    <TableCell>Número de transacciones</TableCell>
                    {COLUMNS.map((c) => (
                      <TableCell key={c.key} align="center">
                        {incomes?.ranges[c.key].transactions ?? 0}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Valor total de transacciones</TableCell>
                    {COLUMNS.map((c) => (
                      <TableCell key={c.key} align="center">
                        {fmtCOP(incomes?.ranges[c.key].total_amount ?? 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Tarifa</TableCell>
                    {COLUMNS.map((c) => {
                      if (c.key === "leq80")
                        return (
                          <TableCell key={c.key} align="center">
                            $160
                          </TableCell>
                        );
                      if (c.key === "between")
                        return (
                          <TableCell key={c.key} align="center">
                            0,20%
                          </TableCell>
                        );
                      return (
                        <TableCell key={c.key} align="center">
                          $1.600
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow sx={{ bgcolor: "rgba(0,0,0,0.03)" }}>
                    <TableCell>Total</TableCell>
                    {COLUMNS.map((c) => (
                      <TableCell key={c.key} align="center">
                        {fmtCOP(incomes?.ranges[c.key].total_commission ?? 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Paper>

          {/* SALIDA */}
          <Paper elevation={1}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: colors.primary,
                color: colors.text_white,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              TRANSACCIONES DE SALIDA
            </Box>
            <Box sx={{ p: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#111", "& th": { color: "#fff" } }}>
                    <TableCell>Rango</TableCell>
                    {COLUMNS.map((c) => (
                      <TableCell key={c.key} align="center">
                        {c.title}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={{ bgcolor: "rgba(0,0,0,0.03)" }}>
                    <TableCell>Número de transacciones</TableCell>
                    {COLUMNS.map((c) => (
                      <TableCell key={c.key} align="center">
                        {withdrawals?.ranges[c.key].transactions ?? 0}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Valor total de transacciones</TableCell>
                    {COLUMNS.map((c) => (
                      <TableCell key={c.key} align="center">
                        {fmtCOP(withdrawals?.ranges[c.key].total_amount ?? 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Tarifa</TableCell>
                    {COLUMNS.map((c) => {
                      if (c.key === "leq80")
                        return (
                          <TableCell key={c.key} align="center">
                            $80
                          </TableCell>
                        );
                      if (c.key === "between")
                        return (
                          <TableCell key={c.key} align="center">
                            0,10%
                          </TableCell>
                        );
                      return (
                        <TableCell key={c.key} align="center">
                          $800
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow sx={{ bgcolor: "rgba(0,0,0,0.03)" }}>
                    <TableCell>Total</TableCell>
                    {COLUMNS.map((c) => (
                      <TableCell key={c.key} align="center">
                        {fmtCOP(
                          withdrawals?.ranges[c.key].total_commission ?? 0
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Paper>

          {/* Totales */}
          <Paper elevation={1}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: colors.primary,
                color: colors.text_white,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              TOTAL DE TRANSACCIONES DEL PERIODO
            </Box>
            <Box sx={{ p: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#111", "& th": { color: "#fff" } }}>
                    <TableCell>DETALLE</TableCell>
                    <TableCell align="center">NÚMERO DE MOVIMIENTOS</TableCell>
                    <TableCell align="center">COMISIÓN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>TRANSACCIONES DE ENTRADA</TableCell>
                    <TableCell align="center">
                      {incomes?.totals.count ?? 0}
                    </TableCell>
                    <TableCell align="center">
                      {fmtCOP(incomes?.totals.total_commission ?? 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>TRANSACCIONES DE SALIDA</TableCell>
                    <TableCell align="center">
                      {withdrawals?.totals.count ?? 0}
                    </TableCell>
                    <TableCell align="center">
                      {fmtCOP(withdrawals?.totals.total_commission ?? 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: "rgba(25,118,210,0.08)" }}>
                    <TableCell sx={{ fontWeight: 600 }}>TOTALES</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {totalsPeriodo.movimientos}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {fmtCOP(totalsPeriodo.comTotal)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Paper>

          <Typography variant="caption" color="text.secondary">
            * Ingresos: 0.20% — mínimo $160 — tope $1.600. Retiros: 0.10% —
            mínimo $80 — tope $800.
          </Typography>
        </Stack>
      )}

      {!loading && !mustWarn && !error && !data && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography color="text.secondary" align="center">
            No hay datos para mostrar en el rango seleccionado.
          </Typography>
        </>
      )}
    </Box>
  );
};

export default SnackReportComission;
