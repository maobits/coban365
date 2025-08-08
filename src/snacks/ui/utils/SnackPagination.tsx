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
import { useTheme as useCustomTheme } from "../../../glamour/ThemeContext";

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
  selectedDate?: string;
  onDateChange?: (date: string) => void;
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
  selectedDate,
  onDateChange,
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
          gap: 1.5,
          mb: 1.5,
          px: 2,
        }}
      >
        <Typography
          fontWeight="bold"
          sx={{ color: colors.primary, fontSize: "0.85rem" }}
        >
          Filtrar por categoría:
        </Typography>

        <Select
          size="small"
          value={categoryFilter}
          onChange={(e) => onCategoryChange?.(e.target.value)}
          displayEmpty
          sx={{
            minWidth: 160,
            fontSize: "0.80rem",
            backgroundColor: "#fff",
            color: colors.primary,
            "& .MuiSelect-icon": {
              color: colors.primary,
            },
          }}
        >
          <MenuItem value="" sx={{ fontSize: "0.80rem" }}>
            Todas las categorías
          </MenuItem>
          {categoryOptions.map((option) => (
            <MenuItem key={option} value={option} sx={{ fontSize: "0.80rem" }}>
              {option}
            </MenuItem>
          ))}
        </Select>

        <Grid item>
          <TextField
            size="small"
            label="Filtrar por fecha"
            type="date"
            value={selectedDate || ""}
            onChange={(e) => onDateChange?.(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180, fontSize: "0.80rem" }}
          />
        </Grid>
      </Box>

      {/* Paginación y control de filas por página */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
          px: 2,
          py: 1.2,
          borderRadius: 2,
          flexWrap: "wrap",
          gap: 1.5,
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          color: colors.text_white,
          fontFamily: fonts.base,
          boxShadow: 2,
        }}
      >
        {/* Selector de filas por página */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            fontWeight="bold"
            sx={{ color: colors.text_white, fontSize: "0.85rem" }}
          >
            {label}:
          </Typography>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value))}
            sx={{
              fontSize: "0.80rem",
              color: colors.text_white,
              backgroundColor: "rgba(255,255,255,0.1)",
              "& .MuiSelect-icon": {
                color: colors.text_white,
              },
            }}
          >
            {rowsPerPageOptions.map((option) => (
              <MenuItem
                key={option}
                value={option}
                sx={{ fontSize: "0.80rem" }}
              >
                {option}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Control de paginación */}
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
              fontSize: "0.80rem",
            },
          }}
        />

        {/* Indicador de rango */}
        <Typography
          sx={{
            color: colors.text_white,
            fontWeight: 500,
            fontSize: "0.80rem",
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
