import React, { useMemo, useState, useEffect, useRef } from "react";
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

const COMBINER = "::"; // separador general
const RANGO_TAG = "RANGO="; // token de rango

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

  // Subcategorías por defecto (coinciden con tus modales)
  const subcategoriesMap = useMemo(
    () => ({
      Ingresos: [
        "Abono a tarjeta de crédito",
        "Depósito",
        "Pago de crédito",
        "Recaudos",
      ],
      Retiros: ["Retiro", "Retiro con tarjeta", "Retiro Nequi"],
      Otros: ["Ahorro ALM", "Saldo", "Transferencia"],
      Terceros: [
        "Pago a tercero",
        "Pago de tercero",
        "Préstamo a tercero",
        "Préstamo de terceros",
      ],
      Compensación: ["Compensación"],
      Transferir: ["Transferir a otra caja"],
    }),
    []
  );

  // Estado UI
  const [mainCategory, setMainCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");

  // Rango local
  const [minLocal, setMinLocal] = useState<string>("");
  const [maxLocal, setMaxLocal] = useState<string>("");
  const debounceRef = useRef<number | null>(null);

  // --- Parseo del categoryFilter entrante ---
  useEffect(() => {
    if (!categoryFilter) {
      setMainCategory("");
      setSubCategory("");
      setMinLocal("");
      setMaxLocal("");
      return;
    }

    const parts = categoryFilter.split(COMBINER).map((p) => p.trim());

    // 0: Categoria
    const cat = parts[0] ?? "";
    // 1: Subcategoria o "RANGO=.."
    const p1 = parts[1] ?? "";
    // 2: Posible "RANGO=.."
    const p2 = parts[2] ?? "";

    let sub = "";
    let min = "";
    let max = "";

    const tryParseRange = (token: string) => {
      if (token.startsWith(RANGO_TAG)) {
        const payload = token.slice(RANGO_TAG.length); // "MIN-MAX"
        const [a, b] = payload.split("-").map((x) => x.trim());
        return { min: a || "", max: b || "" };
      }
      return null;
    };

    // Detectar subcat y rango en p1/p2 (en cualquier orden válido)
    const r1 = tryParseRange(p1);
    const r2 = tryParseRange(p2);

    if (r1 && r2) {
      // si por error vienen dos rangos, preferimos el primero
      min = r1.min;
      max = r1.max;
    } else if (r1) {
      min = r1.min;
      max = r1.max;
      // p2 podría ser basura o vacío: lo ignoramos
    } else if (r2) {
      min = r2.min;
      max = r2.max;
      sub = p1 || "";
    } else {
      // no había rango, p1 es subcat si existe
      sub = p1 || "";
    }

    setMainCategory(cat);
    setSubCategory(sub);
    setMinLocal(min);
    setMaxLocal(max);
  }, [categoryFilter]);

  // Construye el string combinado final para enviar al padre
  const buildCombined = (
    cat: string,
    sub: string,
    min: string,
    max: string
  ) => {
    if (!cat) return ""; // Todas las categorías
    const tokens: string[] = [cat];

    if (sub) tokens.push(sub);
    if (min || max) tokens.push(`${RANGO_TAG}${min || ""}-${max || ""}`);

    return tokens.join(COMBINER);
  };

  // Handlers de categoría/subcategoría
  const handleMainCategoryChange = (value: string) => {
    const next = buildCombined(value, "", minLocal, maxLocal);
    setMainCategory(value);
    setSubCategory("");
    onCategoryChange?.(next);
  };

  const handleSubCategoryChange = (value: string) => {
    setSubCategory(value);
    const next = buildCombined(mainCategory, value, minLocal, maxLocal);
    onCategoryChange?.(next);
  };

  // Rango con debounce → empaquetar en category
  const emitRange = (minStr: string, maxStr: string) => {
    const next = buildCombined(mainCategory, subCategory, minStr, maxStr);
    onCategoryChange?.(next);
  };

  const handleRangeChange = (which: "min" | "max", val: string) => {
    if (which === "min") setMinLocal(val);
    else setMaxLocal(val);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      emitRange(
        which === "min" ? val : minLocal,
        which === "max" ? val : maxLocal
      );
    }, 300);
  };

  const currentSubcats =
    mainCategory && subcategoriesMap[mainCategory]
      ? subcategoriesMap[mainCategory]
      : [];

  return (
    <>
      {/* Filtros */}
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
          value={mainCategory}
          onChange={(e) => handleMainCategoryChange(e.target.value as string)}
          displayEmpty
          sx={{
            minWidth: 160,
            fontSize: "0.80rem",
            backgroundColor: "#fff",
            color: colors.primary,
            "& .MuiSelect-icon": { color: colors.primary },
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

        {/* Subcategoría */}
        {mainCategory && currentSubcats.length > 0 && (
          <>
            <Typography
              fontWeight="bold"
              sx={{ color: colors.primary, fontSize: "0.85rem" }}
            >
              Subcategoría:
            </Typography>
            <Select
              size="small"
              value={subCategory}
              onChange={(e) =>
                handleSubCategoryChange(e.target.value as string)
              }
              displayEmpty
              sx={{
                minWidth: 220,
                fontSize: "0.80rem",
                backgroundColor: "#fff",
                color: colors.primary,
                "& .MuiSelect-icon": { color: colors.primary },
              }}
            >
              <MenuItem value="" sx={{ fontSize: "0.80rem" }}>
                Todas las subcategorías
              </MenuItem>
              {currentSubcats.map((sub) => (
                <MenuItem key={sub} value={sub} sx={{ fontSize: "0.80rem" }}>
                  {sub}
                </MenuItem>
              ))}
            </Select>
          </>
        )}

        {/* Rango de valor */}
        <Typography
          fontWeight="bold"
          sx={{ color: colors.primary, fontSize: "0.85rem" }}
        >
          Valor:
        </Typography>
        <TextField
          size="small"
          type="number"
          placeholder="Mín"
          value={minLocal}
          onChange={(e) => handleRangeChange("min", e.target.value)}
          inputProps={{ min: 0 }}
          sx={{ width: 120, fontSize: "0.80rem", backgroundColor: "#fff" }}
        />
        <TextField
          size="small"
          type="number"
          placeholder="Máx"
          value={maxLocal}
          onChange={(e) => handleRangeChange("max", e.target.value)}
          inputProps={{ min: 0 }}
          sx={{ width: 120, fontSize: "0.80rem", backgroundColor: "#fff" }}
        />

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

      {/* Paginación */}
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
            onChange={(e) =>
              onRowsPerPageChange?.(parseInt(e.target.value as string))
            }
            sx={{
              fontSize: "0.80rem",
              color: colors.text_white,
              backgroundColor: "rgba(255,255,255,0.1)",
              "& .MuiSelect-icon": { color: colors.text_white },
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
