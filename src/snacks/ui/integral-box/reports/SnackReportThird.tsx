// src/snacks/ui/reports/SnackReportThird.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  CircularProgress,
  Divider,
  Box,
  TextField,
  Alert,
  Grid,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import SearchIcon from "@mui/icons-material/Search";
import html2pdf from "html2pdf.js";
import { useTheme } from "../../../../glamour/ThemeContext";
import { getThirdPartyBalanceSheet } from "../../../../store/reports/Reports";
import InfoIcon from "@mui/icons-material/Info";

interface Props {
  open: boolean;
  onClose: () => void;
  correspondentId: number;
  thirdCedula?: string; // opcional
}

const SnackReportThird: React.FC<Props> = ({
  open,
  onClose,
  correspondentId,
  thirdCedula,
}) => {
  const { colors } = useTheme();
  const printRef = useRef<HTMLDivElement>(null);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [selectedDate, setSelectedDate] = useState<string>(
    todayLocalYYYYMMDD()
  );

  // Modal de detalle
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedThird, setSelectedThird] = useState<any>(null);

  // Paginación/Busqueda local en detalle
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtros de fecha (solo en el modal detalle)
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");
  const [appliedRange, setAppliedRange] = useState<{
    from?: string;
    to?: string;
  }>({});

  // Helpers
  function todayLocalYYYYMMDD(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);

  // Polaridad estilos
  const isNegative = (p: any) => Number(p) === 0; // 0 = egreso (rojo), 1 = ingreso (verde)
  const negCellSx = { color: "error.main", fontWeight: 700 } as const;
  const posCellSx = { color: "success.main", fontWeight: 700 } as const;

  // Carga principal
  const loadReport = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const res =
        thirdCedula && thirdCedula.trim()
          ? await getThirdPartyBalanceSheet(correspondentId, {
              date: selectedDate,
              idNumber: thirdCedula.trim(),
            } as any)
          : await getThirdPartyBalanceSheet(
              correspondentId,
              selectedDate as any
            );

      if (!res?.success || !res?.report) {
        setReportData(null);
        setErrorMsg(res?.message || "No fue posible cargar el reporte.");
      } else {
        setReportData(res.report);
      }
    } catch (err: any) {
      console.error("❌ Error al obtener reporte de terceros:", err);
      setReportData(null);
      setErrorMsg(err?.message || "Error al obtener el reporte.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDate, thirdCedula]);

  const handleExportPDF = () => {
    if (printRef.current) {
      const opt = {
        margin: 0.3,
        filename: `reporte_terceros_corresponsal_${correspondentId}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 3 },
        jsPDF: { unit: "mm", format: [100, 290], orientation: "portrait" },
      };
      html2pdf().set(opt).from(printRef.current).save();
    }
  };

  const handleOpenDetail = (third: any) => {
    setSelectedThird(third);
    setOpenDetail(true);
    setSearchTerm("");
    setCurrentPage(1);
    setRangeStart("");
    setRangeEnd("");
    setAppliedRange({});
  };

  // ===== Movimientos filtrados por rango de fecha (local) =====
  const dateWithin = (isoDate: string, from?: string, to?: string) => {
    const d = isoDate.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };

  const rangeFilteredMovements = useMemo(() => {
    const list = selectedThird?.movements || [];
    if (!appliedRange.from && !appliedRange.to) return list;
    return list.filter((m: any) =>
      dateWithin(
        String(m.created_at ?? "")
          .replace(" ", "T")
          .slice(0, 10),
        appliedRange.from,
        appliedRange.to
      )
    );
  }, [selectedThird, appliedRange]);

  // Filtro + paginación en el detalle
  const filteredMovements =
    useMemo(() => {
      const list = rangeFilteredMovements || [];
      const txt = (searchTerm || "").toLowerCase();
      if (!txt) return list;
      return list.filter((m: any) => {
        return (
          (m.transaction_type_name || "").toLowerCase().includes(txt) ||
          (m.note || "").toLowerCase().includes(txt) ||
          (m.type_of_movement || "").toLowerCase().includes(txt) ||
          (m.reference || "").toLowerCase().includes(txt)
        );
      });
    }, [rangeFilteredMovements, searchTerm]) || [];

  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.max(
    1,
    Math.ceil((filteredMovements.length || 0) / itemsPerPage)
  );

  /**
   * Saldo Actual:
   * Siempre = saldo inicial + Σ(efecto de cada movimiento visible).
   * Regla de signo: polarity 0 = egreso (resta), polarity 1 = ingreso (suma).
   */
  const currentBalance = useMemo(() => {
    if (!selectedThird) return 0;

    const initial = Number(selectedThird.balance || 0);

    // Con rango: lista filtrada; sin rango: todos los movimientos del tercero
    const baseList =
      appliedRange.from || appliedRange.to
        ? rangeFilteredMovements || []
        : selectedThird?.movements || [];

    if (!baseList.length) return initial;

    const sorted = [...baseList].sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let running = initial;
    for (const m of sorted) {
      const cost = Number(m.cost || 0);
      const bank = Number(m.bank_commission || 0); // negativo si costo
      const disp = Number(m.dispersion || 0); // negativo si costo
      // ✅ Ajuste: polarity 0 resta, polarity 1 suma
      const signedValue = Number(m.polarity) === 0 ? -cost : +cost;
      running += signedValue + bank + disp;
    }
    return running;
  }, [selectedThird, rangeFilteredMovements, appliedRange]);

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle
        sx={{
          backgroundColor: colors.primary,
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        REPORTE POR TERCEROS
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {loading ? (
        <DialogContent
          sx={{
            p: 4,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </DialogContent>
      ) : !reportData ? (
        <DialogContent sx={{ p: 4, textAlign: "center" }}>
          {errorMsg ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          ) : null}
          <Typography color="text.secondary">
            No fue posible cargar el reporte. Verifica la conexión o la fecha e
            inténtalo nuevamente.
          </Typography>

          <Box mt={2}>
            <TextField
              type="date"
              size="small"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              inputProps={{ max: todayLocalYYYYMMDD() }}
            />
          </Box>
        </DialogContent>
      ) : (
        <DialogContent
          sx={{
            maxWidth: 700,
            mx: "auto",
            mt: 2,
            mb: 2,
            backgroundColor: "#fff",
            border: "1px dashed #999",
            p: 3,
            fontSize: 14,
          }}
        >
          <Box ref={printRef}>
            <Box textAlign="center" mb={2}>
              <Typography fontWeight="bold" fontSize={15}>
                Reporte financiero por terceros
              </Typography>

              <TextField
                type="date"
                size="small"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                inputProps={{ max: todayLocalYYYYMMDD() }}
                sx={{ mt: 1 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {reportData.third_party_summary.map((t: any, idx: number) => (
              <Box key={t.id ?? idx} mb={3}>
                <Typography fontWeight="bold" fontSize={14} mb={1}>
                  Tercero ID {t.id} - {t.name}
                </Typography>

                <Table size="small" aria-label="resumen-tercero">
                  <TableBody>
                    <TableRow>
                      <TableCell>Saldo inicial</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: Number(t.balance) >= 0 ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {formatCurrency(Number(t.balance))}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Cupo disponible</TableCell>
                      <TableCell align="right">
                        {formatCurrency(Number(t.available_credit))}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Préstamos a tercero</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            Number(t.loan_to_third_party) < 0 ? "red" : "green",
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(Number(t.loan_to_third_party || 0))}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Pagos de tercero</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            Number(t.charge_to_third_party) >= 0
                              ? "green"
                              : "red",
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(Number(t.charge_to_third_party || 0))}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Préstamos de tercero</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            Number(t.loan_from_third_party) >= 0
                              ? "green"
                              : "red",
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(Number(t.loan_from_third_party || 0))}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Pagos a tercero</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            Number(t.debt_to_third_party) >= 0
                              ? "green"
                              : "red",
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(Number(t.debt_to_third_party || 0))}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Deuda de terceros</TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: "red", fontWeight: 700 }}
                      >
                        {formatCurrency(-Number(t.third_party_debt || 0))}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Deuda del corresponsal</TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: "green", fontWeight: 700 }}
                      >
                        {formatCurrency(Number(t.correspondent_debt || 0))}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Saldo neto</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: Number(t.net_balance) >= 0 ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {formatCurrency(Number(t.net_balance))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleOpenDetail(t)}
                  startIcon={<InfoIcon />}
                  sx={{ mt: 1 }}
                >
                  Ver detalle
                </Button>

                <Divider sx={{ my: 2 }} />
              </Box>
            ))}

            <Box mt={2} textAlign="right">
              <Typography fontSize={13}>
                Deuda de terceros:{" "}
                {formatCurrency(
                  Number(
                    reportData?.total_third_party_debt ??
                      reportData?.third_party_summary?.reduce(
                        (acc: number, t: any) =>
                          acc + Number(t?.third_party_debt || 0),
                        0
                      ) ??
                      0
                  )
                )}
              </Typography>

              <Typography fontSize={13}>
                Deuda del corresponsal:{" "}
                {formatCurrency(
                  Number(
                    reportData?.total_correspondent_debt ??
                      reportData?.third_party_summary?.reduce(
                        (acc: number, t: any) =>
                          acc + Number(t?.correspondent_debt || 0),
                        0
                      ) ??
                      0
                  )
                )}
              </Typography>

              <Typography
                fontSize={13}
                fontWeight="bold"
                sx={{
                  color:
                    Number(reportData?.total_net_balance || 0) < 0
                      ? "red"
                      : "green",
                }}
              >
                Total neto:{" "}
                {formatCurrency(Number(reportData?.total_net_balance || 0))}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      )}

      <DialogActions>
        <Button
          onClick={handleExportPDF}
          variant="outlined"
          startIcon={<PrintIcon />}
        >
          Imprimir PDF
        </Button>
        <Button onClick={onClose} variant="contained" color="primary">
          Cerrar
        </Button>
      </DialogActions>

      {/* Modal Detalle */}
      {openDetail && (
        <Dialog
          open={openDetail}
          onClose={() => setOpenDetail(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Detalle del tercero</DialogTitle>
          <DialogContent>
            {selectedThird && (
              <>
                {/* Cabecera estilo imagen */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Grid container alignItems="center" spacing={2}>
                    {/* Bloque Cliente / Saldos */}
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Grid container spacing={1}>
                          <Grid item xs={5}>
                            <Typography color="text.secondary">
                              Cliente
                            </Typography>
                          </Grid>
                          <Grid item xs={7}>
                            <Typography fontWeight="bold">
                              {selectedThird.name}
                            </Typography>
                          </Grid>

                          <Grid item xs={5}>
                            <Typography color="text.secondary">
                              Saldo Inicial
                            </Typography>
                          </Grid>
                          <Grid item xs={7}>
                            <Typography>
                              {formatCurrency(
                                Number(selectedThird.balance || 0)
                              )}
                            </Typography>
                          </Grid>

                          <Grid item xs={5}>
                            <Typography color="text.secondary">
                              Saldo Actual
                            </Typography>
                          </Grid>
                          <Grid item xs={7}>
                            <Typography fontWeight="bold">
                              {formatCurrency(currentBalance)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>

                    {/* Bloque Estado de cuentas / Fechas */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ textAlign: { xs: "left", md: "center" } }}>
                        <Typography fontWeight="bold" sx={{ mb: 1 }}>
                          Estado de cuentas
                        </Typography>

                        <Grid
                          container
                          spacing={1.5}
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Grid item xs={12} sm={5}>
                            <TextField
                              fullWidth
                              size="small"
                              type="date"
                              label="Desde"
                              value={rangeStart}
                              onChange={(e) => {
                                const v = e.target.value;
                                setRangeStart(v);
                                if (rangeEnd && v && rangeEnd < v)
                                  setRangeEnd(v);
                              }}
                              InputLabelProps={{ shrink: true }}
                              inputProps={{
                                max: rangeEnd || todayLocalYYYYMMDD(),
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={5}>
                            <TextField
                              fullWidth
                              size="small"
                              type="date"
                              label="Hasta"
                              value={rangeEnd}
                              onChange={(e) => {
                                const v = e.target.value;
                                setRangeEnd(v);
                                if (rangeStart && v && rangeStart > v)
                                  setRangeStart(v);
                              }}
                              InputLabelProps={{ shrink: true }}
                              inputProps={{
                                min: rangeStart || undefined,
                                max: todayLocalYYYYMMDD(),
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm="auto">
                            <Button
                              variant="contained"
                              startIcon={<SearchIcon />}
                              sx={{
                                bgcolor: "#f28c28",
                                "&:hover": { bgcolor: "#dc7d21" },
                                fontWeight: 700,
                                px: 2.5,
                                height: 40,
                              }}
                              onClick={() => {
                                setAppliedRange({
                                  from: rangeStart || undefined,
                                  to: rangeEnd || undefined,
                                });
                                setCurrentPage(1);
                              }}
                            >
                              Buscar
                            </Button>
                          </Grid>

                          <Grid item xs={12} sm="auto">
                            <Button
                              variant="text"
                              onClick={() => {
                                setRangeStart("");
                                setRangeEnd("");
                                setAppliedRange({});
                                setCurrentPage(1);
                              }}
                            >
                              Limpiar
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Tabla de movimientos */}
                <TextField
                  label="Filtrar movimientos"
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />

                <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
                  <Table size="small" aria-label="tabla-detalle-movimientos">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Referencia 1</TableCell>
                        <TableCell>Referencia 2</TableCell>
                        <TableCell align="right">Valor</TableCell>
                        <TableCell align="right">Comisión Bancaria</TableCell>
                        <TableCell align="right">Dispersión</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedMovements.map((m: any, idx: number) => {
                        const valueSx = isNegative(m.polarity)
                          ? negCellSx
                          : posCellSx;

                        const bank = parseFloat(m.bank_commission || 0);
                        const disp = parseFloat(m.dispersion || 0);
                        const total = parseFloat(m.total_balance_third || 0);

                        return (
                          <TableRow key={`${m.id ?? idx}-${idx}`}>
                            <TableCell>
                              {new Date(m.created_at).toLocaleDateString(
                                "es-CO"
                              )}
                            </TableCell>
                            <TableCell sx={valueSx}>
                              {m.transaction_type_name || "—"}
                            </TableCell>
                            <TableCell>{m.type_of_movement || "—"}</TableCell>
                            <TableCell>
                              {m.reference || m.note || "—"}
                            </TableCell>
                            <TableCell align="right" sx={valueSx}>
                              {formatCurrency(parseFloat(m.cost || 0))}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: bank < 0 ? "error.main" : "inherit",
                                fontWeight: bank < 0 ? 700 : 400,
                              }}
                            >
                              {formatCurrency(bank)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: disp < 0 ? "error.main" : "inherit",
                                fontWeight: disp < 0 ? 700 : 400,
                              }}
                            >
                              {formatCurrency(disp)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {formatCurrency(total)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>

                {/* Paginación simple */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    justifyContent: "flex-end",
                    mt: 1,
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Typography variant="body2">
                    Página {currentPage} de {totalPages}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Siguiente
                  </Button>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenDetail(false)}
              color="primary"
              variant="contained"
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
};

export default SnackReportThird;
