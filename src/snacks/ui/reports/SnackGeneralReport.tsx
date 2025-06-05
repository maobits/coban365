// src/snacks/ui/reports/SnackGeneralReport.tsx

import React, { useEffect, useState } from "react";
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  CircularProgress,
  Grid,
  TextField,
  Button,
  MenuItem,
  Stack,
} from "@mui/material";
import { getGeneralReport } from "../../../store/reports/Reports";
import { useTheme } from "../../../glamour/ThemeContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Props {
  correspondentId: number;
}

const SnackGeneralReport: React.FC<Props> = ({ correspondentId }) => {
  const { colors, fonts } = useTheme();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [correspondentName, setCorrespondentName] = useState<string>("");

  const fetchReport = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await getGeneralReport(correspondentId, filters);
      if (res.success) {
        setReportData(res.data);
        setCorrespondentName(res.data.correspondent_name || "");
        setError(null);
      } else {
        setError(res.message || "Error al obtener el reporte");
        setReportData(null);
      }
    } catch (err) {
      console.error(err);
      setError("Error al obtener el reporte.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(); // carga inicial sin filtros
  }, [correspondentId]);

  const applyFilters = () => {
    const filters: any = {};
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;
    fetchReport(filters);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const dateRange =
      startDate && endDate ? ` (${startDate} a ${endDate})` : "";
    const title = `Reporte General – ${correspondentName}${dateRange}`;

    doc.text(title, 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["Tipo", "Categoría", "Ingresos", "Egresos", "Saldo"]],
      body: filteredResumen.map((item: any) => [
        item.transaction_type_name,
        item.category,
        item.ingresos,
        item.egresos,
        item.saldo_por_tipo,
      ]),
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      body: [
        ["", "", `Ingresos: $${ingresosTotal.toLocaleString("es-CO")}`],
        ["", "", `Egresos: $${egresosTotal.toLocaleString("es-CO")}`],
        ["", "", `Saldo Neto: $${saldoTotal.toLocaleString("es-CO")}`],
      ],
      theme: "plain",
      styles: { fontStyle: "bold" },
    });

    const filename = `Reporte_General_${correspondentName.replace(/\s/g, "_")}${
      dateRange ? `_${startDate}_a_${endDate}` : ""
    }.pdf`;
    doc.save(filename);
  };

  const exportExcel = () => {
    const worksheetData = [
      ["Tipo", "Categoría", "Ingresos", "Egresos", "Saldo"],
      ...filteredResumen.map((item: any) => [
        item.transaction_type_name,
        item.category,
        item.ingresos,
        item.egresos,
        item.saldo_por_tipo,
      ]),
      [],
      ["", "", `Ingresos:`, ingresosTotal],
      ["", "", `Egresos:`, egresosTotal],
      ["", "", `Saldo Neto:`, saldoTotal],
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte General");

    const filename = `Reporte_General_${correspondentName.replace(/\s/g, "_")}${
      startDate && endDate ? `_${startDate}_a_${endDate}` : ""
    }.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const filteredResumen = reportData?.resumen?.filter((item: any) =>
    selectedType ? item.transaction_type_id === parseInt(selectedType) : true
  );

  const ingresosTotal =
    filteredResumen?.reduce(
      (acc: number, item: any) => acc + item.ingresos,
      0
    ) || 0;

  const egresosTotal =
    filteredResumen?.reduce(
      (acc: number, item: any) => acc + item.egresos,
      0
    ) || 0;

  const saldoTotal = ingresosTotal - egresosTotal;

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

  if (!reportData || !reportData.resumen?.length) {
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
        Reporte General – {correspondentName}
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
          <TextField
            select
            label="Tipo de transacción"
            fullWidth
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {reportData.resumen.map((item: any) => (
              <MenuItem
                key={item.transaction_type_id}
                value={item.transaction_type_id}
              >
                {item.transaction_type_name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" spacing={2}>
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
            {filteredResumen.map((item: any) => (
              <TableRow key={item.transaction_type_id}>
                <TableCell>{item.transaction_type_name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  ${new Intl.NumberFormat("es-CO").format(item.ingresos || 0)}
                </TableCell>
                <TableCell>
                  ${new Intl.NumberFormat("es-CO").format(item.egresos || 0)}
                </TableCell>
                <TableCell>
                  $
                  {new Intl.NumberFormat("es-CO").format(
                    item.saldo_por_tipo || 0
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2} style={{ fontWeight: "bold" }}>
                <strong>Totales Generales</strong>
              </TableCell>
              <TableCell style={{ fontWeight: "bold" }}>
                <span>Ingresos: </span>$
                {new Intl.NumberFormat("es-CO").format(ingresosTotal)}
              </TableCell>
              <TableCell style={{ fontWeight: "bold" }}>
                <span>Egresos: </span>$
                {new Intl.NumberFormat("es-CO").format(egresosTotal)}
              </TableCell>
              <TableCell style={{ fontWeight: "bold" }}>
                <span>Saldo Neto: </span>$
                {new Intl.NumberFormat("es-CO").format(saldoTotal)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default SnackGeneralReport;
