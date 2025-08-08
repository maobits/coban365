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
}

const SnackReportThird: React.FC<Props> = ({
  open,
  onClose,
  correspondentId,
}) => {
  const { colors } = useTheme();
  const printRef = useRef<HTMLDivElement>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
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
    selectedThird?.movements?.filter(
      (m: any) =>
        m.transaction_type_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        m.note?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);

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
                  max: new Date().toISOString().slice(0, 10),
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
                    <TableRow>
                      {/*<TableCell>Saldo actual</TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          t.negative_balance ? t.balance * -1 : t.balance
                        )}
                      </TableCell>*/}
                    </TableRow>
                    <TableRow>
                      <TableCell>Saldo neto</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            (t.negative_balance
                              ? t.net_balance * -1
                              : t.net_balance) >= 0
                              ? "green"
                              : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {formatCurrency(
                          t.negative_balance
                            ? t.net_balance * -1
                            : t.net_balance
                        )}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Cupo disponible</TableCell>
                      <TableCell align="right">
                        {formatCurrency(t.available_credit)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Préstamos a tercero</TableCell>
                      <TableCell align="right">
                        {formatCurrency(t.loan_to_third_party)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pagos de tercero</TableCell>
                      <TableCell align="right">
                        {formatCurrency(t.charge_to_third_party)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Préstamos de tercero</TableCell>
                      <TableCell align="right">
                        {formatCurrency(t.loan_from_third_party)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pagos a tercero</TableCell>
                      <TableCell align="right">
                        {formatCurrency(t.debt_to_third_party)}
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
                  reportData.third_party_summary.reduce(
                    (acc: number, t: any) => {
                      let deuda = 0;

                      // Si el tercero tiene saldo negativo (debe al corresponsal)
                      if (t.balance < 0 && t.negative_balance === true) {
                        deuda += Math.abs(t.balance);
                      }

                      // Préstamos otorgados al tercero
                      if (t.loan_to_third_party > 0) {
                        deuda += t.loan_to_third_party;
                      }

                      // Pagos que el tercero ya ha hecho (restan deuda)
                      if (t.charge_to_third_party > 0) {
                        deuda -= t.charge_to_third_party;
                      }

                      return acc + (deuda > 0 ? deuda : 0); // evitar deuda negativa
                    },
                    0
                  )
                )}
              </Typography>

              <Typography fontSize={13}>
                Deuda del corresponsal:{" "}
                {formatCurrency(
                  reportData.third_party_summary.reduce(
                    (acc: number, t: any) => {
                      let deuda = 0;

                      // Deuda por saldo positivo (sin saldo negativo)
                      if (t.balance > 0 && t.negative_balance === false) {
                        deuda += t.balance;
                      }

                      // Deuda por préstamo recibido del tercero
                      deuda += t.loan_from_third_party || 0;

                      // Resta pagos hechos al tercero
                      deuda -= t.debt_to_third_party || 0;

                      return acc + deuda;
                    },
                    0
                  )
                )}
              </Typography>

              <Typography
                fontSize={13}
                fontWeight="bold"
                sx={{
                  color: reportData.total_net_balance < 0 ? "red" : "green",
                }}
              >
                Total neto: {formatCurrency(reportData.total_net_balance)}
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
                    <TableRow>
                      {/*<TableCell>Saldo actual</TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          selectedThird.negative_balance
                            ? selectedThird.balance * -1
                            : selectedThird.balance
                        )}
                      </TableCell>*/}
                    </TableRow>
                    <TableRow>
                      <TableCell>Saldo neto</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            (selectedThird.negative_balance
                              ? selectedThird.net_balance * -1
                              : selectedThird.net_balance) >= 0
                              ? "green"
                              : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {formatCurrency(
                          selectedThird.negative_balance
                            ? selectedThird.net_balance * -1
                            : selectedThird.net_balance
                        )}
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

                        <TableCell align="right">Valor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedMovements.map((m: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {new Date(m.created_at).toLocaleString("es-CO", {
                              dateStyle: "short",
                              timeStyle: "short",
                              hour12: true,
                            })}
                          </TableCell>
                          <TableCell>{m.transaction_type_name}</TableCell>

                          <TableCell align="right">
                            {formatCurrency(parseFloat(m.cost))}
                          </TableCell>
                        </TableRow>
                      ))}
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
