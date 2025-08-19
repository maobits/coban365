// src/snacks/ui/reports/SnackReportThird.tsx
import React, { useEffect, useState, useRef } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import html2pdf from "html2pdf.js";
import { useTheme } from "../../../../glamour/ThemeContext";
import { getThirdPartyBalanceSheet } from "../../../../store/reports/Reports";
import InfoIcon from "@mui/icons-material/Info";

interface Props {
  open: boolean;
  onClose: () => void;
  correspondentId: number;
  thirdCedula?: string; // ⬅️ NUEVO
}
const SnackReportThird: React.FC<Props> = ({
  open,
  onClose,
  correspondentId,
  thirdCedula, // ⬅️ NUEVO
}) => {
  const { colors } = useTheme();
  const printRef = useRef<HTMLDivElement>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    todayLocalYYYYMMDD()
  );

  // Estado para el modal de detalle.
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedThird, setSelectedThird] = useState<any>(null);

  // Estados para paginacion
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Función para abrir el modal.
  const handleOpenDetail = (third: any) => {
    setSelectedThird(third);
    setOpenDetail(true);
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await getThirdPartyBalanceSheet(
        correspondentId,
        selectedDate
      );
      setReportData(res.report);
    } catch (err) {
      console.error("❌ Error al obtener reporte de terceros:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadReport();
  }, [open, selectedDate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleExportPDF = () => {
    if (printRef.current) {
      const opt = {
        margin: 0.3,
        filename: `reporte_terceros_corresponsal_${correspondentId}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 3 },
        jsPDF: {
          unit: "mm",
          format: [100, 290],
          orientation: "portrait",
        },
      };
      html2pdf().set(opt).from(printRef.current).save();
    }
  };

  const filteredMovements =
    selectedThird?.movements?.filter((m: any) => {
      const txt = (searchTerm || "").toLowerCase();
      return (
        (m.transaction_type_name || "").toLowerCase().includes(txt) ||
        (m.note || "").toLowerCase().includes(txt) ||
        (m.type_of_movement || "").toLowerCase().includes(txt) // 👈 nuevo
      );
    }) || [];

  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);

  // Estilos para polaridad negattiva.
  // helpers
  const isNegative = (p: any) => Number(p) === 0; // tu regla actual
  const isPositive = (p: any) => Number(p) === 1; // positivo

  // estilos
  const negCellSx = { color: "error.main", fontWeight: 700 } as const; // rojo
  const posCellSx = { color: "success.main", fontWeight: 700 } as const; // verde

  // Helpers (deben ir antes de usarse)
  function todayLocalYYYYMMDD(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

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

      {loading || !reportData ? (
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
                inputProps={{
                  max: todayLocalYYYYMMDD(),
                }}
                sx={{ mt: 1 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />
            {reportData.third_party_summary.map((t: any, idx: number) => (
              <Box key={idx} mb={3}>
                <Typography fontWeight="bold" fontSize={14} mb={1}>
                  Tercero ID {t.id} - {t.name}
                </Typography>

                <Table size="small">
                  <TableBody>
                    {/* Saldo inicial */}
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

                    {/* Cupo disponible */}
                    <TableRow>
                      <TableCell>Cupo disponible</TableCell>
                      <TableCell align="right">
                        {formatCurrency(Number(t.available_credit))}
                      </TableCell>
                    </TableRow>

                    {/* Movimientos agregados (colores por signo real) */}
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

                    {/* Deudas (según regla: tercero = negativa siempre, corresponsal = positiva) */}
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

                    {/* Saldo neto al final */}
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

      {openDetail && (
        <Dialog
          open={openDetail}
          onClose={() => setOpenDetail(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Detalle del tercero</DialogTitle>
          <DialogContent>
            {selectedThird && (
              <>
                <Typography fontWeight="bold" gutterBottom>
                  {selectedThird.name} (ID: {selectedThird.id})
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Cupo asignado</TableCell>
                      <TableCell align="right">
                        {formatCurrency(selectedThird.credit_limit)}
                      </TableCell>
                    </TableRow>

                    {/* ⬇️ NUEVO: Saldo inicial debajo de cupo asignado */}
                    <TableRow>
                      <TableCell>Saldo inicial</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            Number(selectedThird.balance) >= 0
                              ? "green"
                              : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {formatCurrency(Number(selectedThird.balance))}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Saldo neto</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            Number(selectedThird.net_balance) >= 0
                              ? "green"
                              : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {formatCurrency(Number(selectedThird.net_balance))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Divider sx={{ my: 2 }} />
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

                <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Detalle</TableCell>

                        <TableCell align="right">Valor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedMovements.map((m: any, idx: number) => {
                        const neg = isNegative(m.polarity);
                        const pos = !neg && isPositive(m.polarity);
                        const cellSx = neg
                          ? negCellSx
                          : pos
                          ? posCellSx
                          : undefined;

                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              {new Date(m.created_at).toLocaleString("es-CO", {
                                dateStyle: "short",
                                timeStyle: "short",
                                hour12: true,
                              })}
                            </TableCell>

                            {/* Tipo */}
                            <TableCell sx={cellSx}>
                              {m.transaction_type_name}
                            </TableCell>

                            {/* Detalle */}
                            <TableCell sx={cellSx}>
                              {m.type_of_movement ?? "—"}
                            </TableCell>

                            {/* Valor */}
                            <TableCell align="right" sx={cellSx}>
                              {formatCurrency(parseFloat(m.cost))}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
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
