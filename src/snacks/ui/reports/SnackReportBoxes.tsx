// src/snacks/ui/reports/SnackReportBoxes.tsx

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
} from "@mui/material";
import { useTheme } from "../../../glamour/ThemeContext";
import { getBoxReport } from "../../../store/reports/Reports";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Props {
  correspondentId: number;
}

const SnackReportBoxes: React.FC<Props> = ({ correspondentId }) => {
  const { colors, fonts } = useTheme();
  const [reportData, setReportData] = useState<any[]>([]);
  const [correspondentName, setCorrespondentName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      const res = await getBoxReport(correspondentId, filters);
      if (res.success && Array.isArray(res.data.reportes)) {
        setReportData(res.data.reportes);
        setCorrespondentName(res.data.correspondent_name || "");
        setError(null);
      } else {
        setError(res.message || "Error al obtener el reporte");
        setReportData([]);
      }
    } catch (err) {
      console.error(err);
      setError("Error al obtener el reporte.");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [correspondentId]);

  const applyFilters = () => {
    fetchData();
  };
  const calculateGlobalTotals = () => {
    let ingresosTotal = 0;
    let egresosTotal = 0;
    reportData.forEach((box) => {
      (box.resumen || []).forEach((item: any) => {
        ingresosTotal += item.ingresos || 0;
        egresosTotal += item.egresos || 0;
      });
    });
    return {
      ingresosTotal,
      egresosTotal,
      saldoTotal: ingresosTotal - egresosTotal,
    };
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const dateRange =
      startDate && endDate ? ` (${startDate} a ${endDate})` : "";
    const title = `Reporte por Cajas – ${correspondentName}${dateRange}`;
    doc.text(title, 14, 15);
    let currentY = 20;

    reportData.forEach((box) => {
      doc.text(`Caja: ${box.cash_name}`, 14, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Tipo", "Categoría", "Ingresos", "Egresos", "Saldo"]],
        body: (box.resumen || []).map((item: any) => [
          item.transaction_type_name,
          item.category,
          item.ingresos,
          item.egresos,
          item.saldo_por_tipo,
        ]),
      });
      currentY = doc.lastAutoTable.finalY + 10;
    });

    const totals = calculateGlobalTotals();
    autoTable(doc, {
      startY: currentY,
      body: [
        [
          "",
          "Totales generales",
          totals.ingresosTotal.toLocaleString("es-CO"),
          totals.egresosTotal.toLocaleString("es-CO"),
          totals.saldoTotal.toLocaleString("es-CO"),
        ],
      ],
    });

    const filename = `Reporte_Cajas_${correspondentName.replace(/\s/g, "_")}${
      dateRange ? `_${startDate}_a_${endDate}` : ""
    }.pdf`;
    doc.save(filename);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    reportData.forEach((box) => {
      const worksheetData = [
        ["Tipo", "Categoría", "Ingresos", "Egresos", "Saldo"],
        ...(box.resumen || []).map((item: any) => [
          item.transaction_type_name,
          item.category,
          item.ingresos,
          item.egresos,
          item.saldo_por_tipo,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(wb, ws, box.cash_name.substring(0, 31));
    });

    const totals = calculateGlobalTotals();
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["Totales Generales"],
      ["Ingresos", "Egresos", "Saldo"],
      [totals.ingresosTotal, totals.egresosTotal, totals.saldoTotal],
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Totales");

    const filename = `Reporte_Cajas_${correspondentName.replace(/\s/g, "_")}${
      startDate && endDate ? `_${startDate}_a_${endDate}` : ""
    }.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!reportData || reportData.length === 0) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography color="textSecondary">
          No hay datos para mostrar.
        </Typography>
      </Box>
    );
  }
  return (
    <Box mt={4}>
      <Typography
        variant="h6"
        fontFamily={fonts.heading}
        color={colors.primary}
        gutterBottom
      >
        Reporte por Cajas – {correspondentName}
      </Typography>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Fecha de inicio"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Fecha final"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Stack direction="row" spacing={2} mt={1}>
            <Button variant="contained" onClick={applyFilters}>
              Aplicar filtros
            </Button>
            <Button variant="outlined" onClick={exportPDF}>
              Exportar PDF
            </Button>
            <Button variant="outlined" onClick={exportExcel}>
              Exportar Excel
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {reportData.map((box: any, index: number) => (
        <Box key={index} mb={4}>
          <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1}>
            Caja: {box.cash_name}
          </Typography>
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Ingresos</TableCell>
                  <TableCell>Egresos</TableCell>
                  <TableCell>Saldo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(box.resumen || []).map((item: any) => (
                  <TableRow key={item.transaction_type_id}>
                    <TableCell>{item.transaction_type_name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      $
                      {new Intl.NumberFormat("es-CO").format(
                        item.ingresos || 0
                      )}
                    </TableCell>
                    <TableCell>
                      $
                      {new Intl.NumberFormat("es-CO").format(item.egresos || 0)}
                    </TableCell>
                    <TableCell>
                      $
                      {new Intl.NumberFormat("es-CO").format(
                        item.saldo_por_tipo || 0
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      ))}

      <Box mt={6}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          Totales Globales
        </Typography>
        <Paper>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell style={{ fontWeight: "bold" }}>Ingresos</TableCell>
                <TableCell>
                  $
                  {new Intl.NumberFormat("es-CO").format(
                    calculateGlobalTotals().ingresosTotal
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ fontWeight: "bold" }}>Egresos</TableCell>
                <TableCell>
                  $
                  {new Intl.NumberFormat("es-CO").format(
                    calculateGlobalTotals().egresosTotal
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ fontWeight: "bold" }}>Saldo</TableCell>
                <TableCell>
                  $
                  {new Intl.NumberFormat("es-CO").format(
                    calculateGlobalTotals().saldoTotal
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Box>
  );
};

export default SnackReportBoxes;
