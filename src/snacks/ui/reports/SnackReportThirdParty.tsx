import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
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
import { getThirdPartyReport } from "../../../store/reports/Reports";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface Props {
  correspondentId?: number;
  idNumber?: string;
}

const SnackReportThirdParty: React.FC<Props> = ({
  correspondentId,
  idNumber,
}) => {
  const { colors, fonts } = useTheme();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterId, setFilterId] = useState<string>(idNumber ?? "");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterId.trim()) {
        params.idNumber = filterId.trim();
      } else if (correspondentId) {
        params.correspondentId = correspondentId; // ✅ CORRECTO: camelCase como espera el frontend
      }

      const res = await getThirdPartyReport(params);

      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [res.data];
        setReportData(data);
        setError(null);
      } else {
        setError(res.message || "Error al obtener los datos.");
        setReportData([]);
      }
    } catch (err) {
      console.error("❌ Error en la carga:", err);
      setError("No se pudo cargar la información.");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (correspondentId || filterId.trim()) {
      fetchReport();
    }
  }, [correspondentId, filterId]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    reportData.forEach((third, i) => {
      if (!third.hasData) return;
      if (i > 0) doc.addPage();

      doc.setFontSize(14);
      doc.text(`Estado de Cuenta – ${third.third?.name}`, 14, 20);

      autoTable(doc, {
        startY: 30,
        head: [["Fecha", "Concepto", "Cuenta por Cobrar", "Cuenta por Pagar"]],
        body: third.movements.map((mov: any) => [
          mov.created_at?.split(" ")[0] || "",
          mov.description || "—",
          `$${mov.account_receivable || 0}`,
          `$${mov.account_to_pay || 0}`,
        ]),
      });

      // Mensaje de saldo legible
      const balanceLabel =
        third.balance >= 0
          ? `El corresponsal debe a ${third.third?.name} (${third.third?.id_number})`
          : `El tercero ${third.third?.name} (${third.third?.id_number}) debe al corresponsal`;

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        body: [[balanceLabel, "", "", `$${Math.abs(third.balance)}`]],
        theme: "plain",
      });
    });

    doc.save("estado_cuenta_terceros.pdf");
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    reportData.forEach((third, i) => {
      if (!third.hasData) return;

      const wsData = [
        ["Fecha", "Concepto", "Cuenta por Cobrar", "Cuenta por Pagar"],
        ...third.movements.map((mov: any) => [
          mov.created_at?.split(" ")[0] || "",
          mov.description || "—",
          mov.account_receivable || 0,
          mov.account_to_pay || 0,
        ]),
        [],

        [
          third.balance >= 0
            ? `El corresponsal debe a ${third.third?.name} (${third.third?.id_number})`
            : `El tercero ${third.third?.name} (${third.third?.id_number}) debe al corresponsal`,
          "",
          "",
          Math.abs(third.balance),
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        third.third?.name || `Tercero${i + 1}`
      );
    });

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "estado_cuenta_terceros.xlsx"
    );
  };

  return (
    <Box mt={10}>
      <Typography
        variant="h6"
        fontFamily={fonts.heading}
        color={colors.primary}
        gutterBottom
      >
        Estado de Cuenta – Terceros
      </Typography>

      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label="Buscar por documento"
          variant="outlined"
          value={filterId}
          onChange={(e) => setFilterId(e.target.value)}
          size="small"
        />
        <Button variant="contained" onClick={fetchReport}>
          Consultar
        </Button>
        <Button variant="outlined" onClick={exportToPDF}>
          Exportar PDF
        </Button>
        <Button variant="outlined" onClick={exportToExcel}>
          Exportar Excel
        </Button>
      </Stack>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box textAlign="center" mt={4}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : reportData.length === 0 ||
        reportData.every((r) => r.hasData === false) ? (
        <Box textAlign="center" mt={4}>
          <Typography color="textSecondary">
            No hay datos para mostrar.
          </Typography>
        </Box>
      ) : (
        reportData.map((thirdData, index) => (
          <Paper key={index} sx={{ mb: 4, p: 2 }}>
            <Box
              mb={2}
              p={2}
              borderRadius="8px"
              bgcolor={colors.surface}
              border={`1px solid ${colors.border || "#ccc"}`}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                fontFamily={fonts.heading}
                color={colors.primary}
                gutterBottom
              >
                {thirdData.third?.name || "Tercero"}
              </Typography>

              <Stack direction="row" spacing={3} flexWrap="wrap">
                <Typography variant="body2" fontWeight="500">
                  <strong>Documento:</strong> {thirdData.third?.id_number}
                </Typography>
                <Typography variant="body2" fontWeight="500">
                  <strong>Teléfono:</strong> {thirdData.third?.phone}
                </Typography>
                <Typography variant="body2" fontWeight="500">
                  <strong>Cupo Total:</strong> $
                  {new Intl.NumberFormat("es-CO").format(
                    thirdData.financial_status?.credit_limit || 0
                  )}
                </Typography>
                <Typography variant="body2" fontWeight="500">
                  <strong>Disponible:</strong> $
                  {new Intl.NumberFormat("es-CO").format(
                    thirdData.financial_status?.available_credit || 0
                  )}
                </Typography>
              </Stack>
            </Box>

            {thirdData.hasData && (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Concepto</TableCell>
                      <TableCell>Cuenta por Cobrar</TableCell>
                      <TableCell>Cuenta por Pagar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {thirdData.movements.map((mov: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{mov.created_at?.split(" ")[0]}</TableCell>
                        <TableCell>{mov.description || "—"}</TableCell>
                        <TableCell>
                          $
                          {new Intl.NumberFormat("es-CO").format(
                            mov.account_receivable || 0
                          )}
                        </TableCell>
                        <TableCell>
                          $
                          {new Intl.NumberFormat("es-CO").format(
                            mov.account_to_pay || 0
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ fontWeight: "bold" }}>
                        Totales
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        $
                        {new Intl.NumberFormat("es-CO").format(
                          thirdData.total_receivable
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        $
                        {new Intl.NumberFormat("es-CO").format(
                          thirdData.total_to_pay
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Box
                  mt={2}
                  px={2}
                  py={1}
                  borderRadius="8px"
                  bgcolor={
                    thirdData.balance >= 0
                      ? colors.successLight || "#E6F4EA"
                      : colors.errorLight || "#FDEAEA"
                  }
                  border={`1px solid ${
                    thirdData.balance >= 0
                      ? colors.success || "green"
                      : colors.error || "red"
                  }`}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    fontFamily={fonts.heading}
                    color={
                      thirdData.balance >= 0 ? colors.success : colors.error
                    }
                  >
                    {thirdData.balance >= 0
                      ? `El corresponsal debe a ${thirdData.third?.name} (${thirdData.third?.id_number}): `
                      : `El tercero ${thirdData.third?.name} (${thirdData.third?.id_number}) debe al corresponsal: `}
                    $
                    {new Intl.NumberFormat("es-CO").format(
                      Math.abs(thirdData.balance)
                    )}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        ))
      )}
    </Box>
  );
};

export default SnackReportThirdParty;
