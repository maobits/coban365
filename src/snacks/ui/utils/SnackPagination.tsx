import React from "react";
import {
  Box,
  Pagination,
  Typography,
  Select,
  MenuItem,
  useTheme,
  Grid,
  TextField,
} from "@mui/material";
import { useTheme as useCustomTheme } from "../../../glamour/ThemeContext"; // ajusta ruta si es necesario

interface SnackPaginationProps {
  total: number;
  currentPage: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  rowsPerPageOptions?: number[];
  label?: string;
  categoryFilter?: string;
  onCategoryChange?: (category: string) => void;
  categoryOptions?: string[];
  selectedDate?: string; // ← ✅ ya lo tienes
  onDateChange?: (date: string) => void; // ← ✅ ya lo tienes
}

const SnackPagination: React.FC<SnackPaginationProps> = ({
  total,
  currentPage,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 20, 50],
  label = "Elementos por página",
  categoryFilter = "",
  onCategoryChange,
  categoryOptions = [
    "Ingresos",
    "Retiros",
    "Terceros",
    "Otros",
    "Compensación",
    "Transferir",
  ],
  selectedDate, // ← ✅ AÑADIR ESTO AQUÍ
  onDateChange, // ← ✅ Y ESTO TAMBIÉN
}) => {
  const muiTheme = useTheme();
  const { colors, fonts } = useCustomTheme();

  const pageCount = Math.ceil(total / rowsPerPage);

  return (
    <>
      {/* Filtro de categoría */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
          px: 3,
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ color: colors.primary }}
        >
          Filtrar por categoría:
        </Typography>
        <Select
          size="medium"
          value={categoryFilter}
          onChange={(e) => onCategoryChange?.(e.target.value)}
          displayEmpty
          sx={{
            minWidth: 200,
            backgroundColor: "#fff",
            color: colors.primary,
            "& .MuiSelect-icon": {
              color: colors.primary,
            },
          }}
        >
          <MenuItem value="">Todas las categorías</MenuItem>
          {categoryOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>

        <Grid item>
          <TextField
            label="Filtrar por fecha"
            type="date"
            value={selectedDate || ""}
            onChange={(e) => onDateChange?.(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 220 }}
          />
        </Grid>
      </Box>

      {/* Paginación y control de filas por página */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 3,
          px: 3,
          py: 2,
          borderRadius: 2,
          flexWrap: "wrap",
          gap: 2,
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          color: colors.text_white,
          fontFamily: fonts.base,
          boxShadow: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: colors.text_white }}
          >
            {label}:
          </Typography>
          <Select
            size="medium"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value))}
            sx={{
              color: colors.text_white,
              fontSize: "1rem",
              borderColor: colors.text_white,
              backgroundColor: "rgba(255,255,255,0.1)",
              "& .MuiSelect-icon": {
                color: colors.text_white,
              },
            }}
          >
            {rowsPerPageOptions.map((option) => (
              <MenuItem key={option} value={option} sx={{ fontSize: "1rem" }}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={(_, value) => onPageChange(value)}
          color="primary"
          shape="rounded"
          sx={{
            "& .MuiPaginationItem-root": {
              color: colors.text_white,
              fontWeight: "bold",
              fontSize: "1rem",
            },
          }}
        />

        <Typography
          variant="h6"
          sx={{
            color: colors.text_white,
            fontWeight: 500,
          }}
        >
          Mostrando {(currentPage - 1) * rowsPerPage + 1} -{" "}
          {Math.min(currentPage * rowsPerPage, total)} de {total}
        </Typography>
      </Box>
    </>
  );
};

export default SnackPagination;
