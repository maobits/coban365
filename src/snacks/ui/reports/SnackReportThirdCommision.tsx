// src/snacks/ui/reports/SnackReportThirdCommision.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  TextField,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "../../../glamour/ThemeContext";
import PaidIcon from "@mui/icons-material/Paid";
import CloseIcon from "@mui/icons-material/Close";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { getGlobalCommissionsReport } from "../../../store/config/report_global_commissions";

interface Props {
  correspondentId: number;
}

const SnackReportThirdCommision: React.FC<Props> = ({ correspondentId }) => {
  const { colors, fonts } = useTheme();

  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [correspondentName, setCorrespondentName] = useState<string>("");
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [thirdCount, setThirdCount] = useState<number>(0);

  const [search, setSearch] = useState<string>("");
  const [minTotal, setMinTotal] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const min = minTotal.trim()
        ? Number(minTotal.replace(/\D/g, ""))
        : undefined;

      const res = await getGlobalCommissionsReport({
        correspondentId,
        search: search.trim() || undefined,
        minTotal:
          typeof min === "number" && !Number.isNaN(min) ? min : undefined,
        limit: 500,
        offset: 0,
      });

      setRows(res.rows || []);
      setCorrespondentName(res.correspondent.name || "");
      setGrandTotal(res.summary.grand_total_commission || 0);
      setThirdCount(res.summary.third_parties_with_commission || 0);
    } catch (err: any) {
      console.error("❌ Error al obtener reporte global de comisiones:", err);
      setError(
        err?.message || "Error al obtener el reporte global de comisiones."
      );
      setRows([]);
      setGrandTotal(0);
      setThirdCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, correspondentId]);

  const handleApplyFilters = () => {
    if (!open) return;
    fetchData();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    const title = `Comisiones de terceros – ${correspondentName}`;
    doc.text(title, 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [
        ["ID Tercero", "Tercero", "Comisión acumulada", "Última actualización"],
      ],
      body: rows.map((r: any) => [
        r.third_party_id,
        r.third_party_name || "-",
        formatCurrency(r.total_commission),
        r.last_update || "",
      ]),
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      body: [
        [
          "",
          `Total terceros con saldo: ${thirdCount}`,
          `Total comisiones: $${formatCurrency(grandTotal)}`,
          "",
        ],
      ],
    });

    const filename = `Comisiones_Terceros_${correspondentName.replace(
      /\s/g,
      "_"
    )}.pdf`;
    doc.save(filename);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const worksheetData = [
      ["ID Tercero", "Tercero", "Comisión acumulada", "Última actualización"],
      ...rows.map((r: any) => [
        r.third_party_id,
        r.third_party_name || "-",
        r.total_commission || 0,
        r.last_update || "",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Comisiones");

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["Resumen"],
      ["Terceros con saldo", "Total comisiones"],
      [thirdCount, grandTotal],
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Totales");

    const filename = `Comisiones_Terceros_${correspondentName.replace(
      /\s/g,
      "_"
    )}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <>
      <Tooltip title="Reporte de comisiones de terceros">
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            width: 33,
            height: 33,
            borderRadius: "50%",
            border: `2px solid ${colors.secondary}`,
            backgroundColor: "#f5f9f5",
            boxShadow: "0px 1px 4px rgba(0,0,0,0.12)",
            "&:hover": {
              backgroundColor: "#e8f5e9",
            },
          }}
        >
          <PaidIcon sx={{ color: colors.secondary }} />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: colors.primary,
            color: colors.text_white,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: fonts.heading,
          }}
        >
          <span>
            Comisiones de terceros –{" "}
            <strong>{correspondentName || "Corresponsal"}</strong>
          </span>
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ color: colors.text_white }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            backgroundColor: colors.background,
            pt: 5, // ← ← ← AQUI ÚNICO CAMBIO SOLICITADO (margen interior superior)
          }}
        >
          <Box mb={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Buscar por nombre de tercero"
                  fullWidth
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Mínimo comisión (COP)"
                  fullWidth
                  value={minTotal}
                  onChange={(e) =>
                    setMinTotal(e.target.value.replace(/[^\d.]/g, ""))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <Stack direction="row" spacing={2} mt={{ xs: 2, sm: 0 }}>
                  <Button variant="contained" onClick={handleApplyFilters}>
                    Aplicar filtros
                  </Button>
                  <Button variant="outlined" onClick={exportPDF}>
                    PDF
                  </Button>
                  <Button variant="outlined" onClick={exportExcel}>
                    Excel
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {loading ? (
            <Box textAlign="center" mt={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box textAlign="center" mt={4}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : rows.length === 0 ? (
            <Box textAlign="center" mt={4}>
              <Typography color="textSecondary">
                No hay comisiones registradas para mostrar.
              </Typography>
            </Box>
          ) : (
            <>
              <Paper>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID Tercero</TableCell>
                      <TableCell>Nombre del tercero</TableCell>
                      <TableCell align="right">Comisión acumulada</TableCell>
                      <TableCell>Última actualización</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.third_party_id}</TableCell>
                        <TableCell>{row.third_party_name || "-"}</TableCell>
                        <TableCell align="right">
                          ${formatCurrency(row.total_commission || 0)}
                        </TableCell>
                        <TableCell>{row.last_update || ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Resumen global
                </Typography>
                <Paper>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell style={{ fontWeight: "bold" }}>
                          Terceros con saldo
                        </TableCell>
                        <TableCell>{thirdCount}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ fontWeight: "bold" }}>
                          Total comisiones acumuladas
                        </TableCell>
                        <TableCell>
                          ${formatCurrency(grandTotal || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            backgroundColor: colors.background,
            px: 3,
            py: 2,
          }}
        >
          <Button onClick={() => setOpen(false)} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SnackReportThirdCommision;
