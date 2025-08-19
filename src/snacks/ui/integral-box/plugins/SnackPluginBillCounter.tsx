import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Tooltip,
  Collapse,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import HistoryIcon from "@mui/icons-material/History";

import { useTheme } from "../../../../glamour/ThemeContext";

import {
  posCalcCreate,
  posCalcUpdate,
  posCalcDelete,
  posCalcList,
  posCalcGet,
} from "../../../../store/transaction/CrudTransactions";

/** =======================
 *  Props
 *  ======================= */
type Props = {
  // IDs operativos (para guardar)
  cashId: number;
  correspondentId: number;
  cashierId?: number;

  // Monto por defecto del primer paquete
  defaultAmount: number;

  // Opcional: callback al guardar/actualizar
  onSaved?: () => void;
};

type TaskItem = { name: string; value: number };

const COP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

/** Denominaciones estándar */
const DENOMS = [2000, 5000, 10000, 20000, 50000, 100000];

const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const SnackPluginBillCounter: React.FC<Props> = ({
  cashId,
  correspondentId,
  cashierId,
  defaultAmount,
  onSaved,
}) => {
  const { colors, fonts } = useTheme();

  /** --------- TAREAS A EJECUTAR ---------
   *  Arrancamos SOLO con 1 fila: nombre vacío y valor por defecto.
   *  El resto de paquetes se agregan manualmente con el botón "+".
   */
  const [tasks, setTasks] = useState<TaskItem[]>([
    { name: "", value: Number(defaultAmount || 0) },
  ]);

  const addTaskRow = () =>
    setTasks((prev) => [...prev, { name: "", value: 0 }]);

  const removeTaskRow = (idx: number) =>
    setTasks((prev) => prev.filter((_, i) => i !== idx));

  /** --------- EFECTIVO RECIBIDO --------- */
  const [quantities, setQuantities] = useState<number[]>(
    Array(DENOMS.length).fill(0)
  );
  const [coins, setCoins] = useState<number>(0);

  /** --------- Cliente --------- */
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  /** --------- Histórico/CRUD --------- */
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  /** --------- Filtro por fecha --------- */
  const [fromDate, setFromDate] = useState<string>(todayStr());
  const [toDate, setToDate] = useState<string>(todayStr());
  const invalidRange =
    fromDate && toDate ? new Date(fromDate) > new Date(toDate) : false;

  /** --------- Totales --------- */
  const totalToProcess = useMemo(
    () => tasks.reduce((s, t) => s + (Number(t.value) || 0), 0),
    [tasks]
  );

  const totalReceived = useMemo(() => {
    const sumDenoms = quantities.reduce((s, q, i) => s + q * DENOMS[i], 0);
    return sumDenoms + (Number(coins) || 0);
  }, [quantities, coins]);

  const result = totalReceived - totalToProcess;
  const actionLabel =
    result === 0 ? "EXACTO" : result > 0 ? "SOBRA DINERO" : "FALTA DINERO";
  const actionColor =
    result === 0 ? "#2e7d32" : result > 0 ? "#f9a825" : "#c62828";

  /** --------- Handlers --------- */
  const handleTaskName = (idx: number, v: string) => {
    // Permite escribir libremente (sin sanitizar)
    setTasks((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], name: v };
      return next;
    });
  };

  const handleTaskValue = (idx: number, v: string) => {
    const clean = Number((v || "0").replace(/[^\d]/g, ""));
    setTasks((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], value: clean };
      return next;
    });
  };

  const handleQty = (idx: number, v: string) => {
    const clean = Number((v || "0").replace(/[^\d]/g, ""));
    setQuantities((prev) => {
      const next = prev.slice();
      next[idx] = clean;
      return next;
    });
  };

  const resetAll = () => {
    setTasks([{ name: "", value: Number(defaultAmount || 0) }]);
    setQuantities(Array(DENOMS.length).fill(0));
    setCoins(0);
    setCustomerName("");
    setCustomerPhone("");
    setEditingId(null);
  };

  /** --------- Carga de historial --------- */
  const loadHistory = async (f = fromDate, t = toDate) => {
    const res = await posCalcList({
      cash_id: cashId,
      from: f || undefined,
      to: t || undefined,
      limit: 50,
      offset: 0,
    });
    if (res?.success) setHistory(res.items || []);
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cashId]);

  /** --------- Guardar / Actualizar --------- */
  const buildItemsJson = () => {
    const data = {
      tasks,
      denominations: DENOMS.map((d, i) => ({ denom: d, qty: quantities[i] })),
      coins,
    };
    return JSON.stringify(data);
  };

  const basePayload = {
    cash_id: cashId,
    correspondent_id: correspondentId,
    cashier_id: cashierId,
    customer_name: customerName.trim() || null,
    customer_phone: customerPhone.trim() || null,
    subtotal: totalToProcess,
    discount: 0,
    fee: 0,
    total: totalReceived,
    note: actionLabel,
    items: buildItemsJson(),
  };

  const handleSave = async () => {
    // Validaciones mínimas
    if (invalidRange) return;
    if (totalToProcess <= 0 && totalReceived <= 0) return;

    if (editingId) {
      const res = await posCalcUpdate({ id: editingId, ...basePayload });
      if (res?.success) {
        await loadHistory();
        if (onSaved) onSaved();
        setEditingId(null);
      }
    } else {
      const res = await posCalcCreate(basePayload);
      if (res?.success) {
        await loadHistory();
        if (onSaved) onSaved();
      }
    }
  };

  const handleEdit = async (id: number) => {
    const res = await posCalcGet(id);
    if (!res?.success || !res?.data) return;

    const r = res.data;

    // Restaurar tareas/denominaciones/monedas desde items_json (si existe)
    try {
      const parsed = r.items ?? JSON.parse(r.items_json || "{}");
      if (parsed?.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length) {
        setTasks(
          parsed.tasks.map((t: any) => ({
            name: (t?.name ?? "").toString(),
            value: Number(t?.value || 0),
          }))
        );
      } else {
        setTasks([{ name: "", value: Number(defaultAmount || 0) }]);
      }

      if (parsed?.denominations && Array.isArray(parsed.denominations)) {
        const q = DENOMS.map((d) => {
          const found = parsed.denominations.find(
            (x: any) => Number(x?.denom) === d
          );
          return Number(found?.qty || 0);
        });
        setQuantities(q);
      } else {
        setQuantities(Array(DENOMS.length).fill(0));
      }

      setCoins(Number(parsed?.coins || 0));
    } catch {
      // fallback
      setTasks([{ name: "", value: Number(defaultAmount || 0) }]);
      setQuantities(Array(DENOMS.length).fill(0));
      setCoins(0);
    }

    setCustomerName(r.customer_name || "");
    setCustomerPhone(r.customer_phone || "");
    setEditingId(r.id);
  };

  const handleDelete = async (id: number) => {
    const res = await posCalcDelete(id);
    if (res?.success) {
      if (editingId === id) setEditingId(null);
      await loadHistory();
    }
  };

  /** --------------------------- UI ---------------------------- */

  return (
    <Box sx={{ p: 1 }}>
      <Grid container spacing={1}>
        {/* === Columna: TAREAS (izquierda) === */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={2}
            sx={{
              border: `1.5px solid ${colors.secondary}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                backgroundColor: "#e8f5e9",
                px: 1.2,
                py: 0.6,
                borderBottom: "1px solid #ddd",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography
                fontFamily={fonts.heading}
                fontWeight={700}
                fontSize="0.95rem"
              >
                TAREAS A EJECUTAR
              </Typography>

              <Tooltip title="Agregar paquete">
                <IconButton size="small" onClick={addTaskRow}>
                  <AddCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: "0.75rem" }}>
                    TRANSACCIONES
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.75rem" }}>
                    VALOR
                  </TableCell>
                  <TableCell sx={{ width: 40 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((t, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ p: 0.5 }}>
                      <TextField
                        placeholder={`Paquete ${idx + 1}`}
                        value={t.name}
                        onChange={(e) => handleTaskName(idx, e.target.value)}
                        size="small"
                        variant="standard"
                        fullWidth
                        inputProps={{ style: { fontSize: "0.82rem" } }}
                      />
                    </TableCell>
                    <TableCell sx={{ p: 0.5 }} align="right">
                      <TextField
                        value={
                          t.value
                            ? t.value
                                .toString()
                                .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                            : ""
                        }
                        onChange={(e) => handleTaskValue(idx, e.target.value)}
                        size="small"
                        variant="standard"
                        inputProps={{
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                          style: { fontSize: "0.82rem", textAlign: "right" },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ p: 0.5 }}>
                      {tasks.length > 1 && (
                        <Tooltip title="Eliminar paquete">
                          <IconButton
                            size="small"
                            onClick={() => removeTaskRow(idx)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                    Total a Procesar
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {COP(totalToProcess)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* === Columna: EFECTIVO RECIBIDO (centro) === */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={2}
            sx={{
              border: `1.5px solid ${colors.primary}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                backgroundColor: "#e3f2fd",
                px: 1.2,
                py: 0.6,
                borderBottom: "1px solid #ddd",
              }}
            >
              <Typography
                fontFamily={fonts.heading}
                fontWeight={700}
                fontSize="0.95rem"
              >
                EFECTIVO RECIBIDO
              </Typography>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: "0.75rem" }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontSize: "0.75rem" }}>
                    DENOMINACIÓN
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.75rem" }}>
                    SUBTOTAL
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {DENOMS.map((d, i) => {
                  const qty = quantities[i] || 0;
                  const sub = qty * d;
                  return (
                    <TableRow key={d}>
                      <TableCell sx={{ p: 0.5, width: 90 }}>
                        <TextField
                          value={qty || ""}
                          onChange={(e) => handleQty(i, e.target.value)}
                          size="small"
                          variant="standard"
                          inputProps={{
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                            style: { fontSize: "0.82rem", textAlign: "right" },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ p: 0.5, fontSize: "0.85rem" }}>
                        {COP(d)}
                      </TableCell>
                      <TableCell align="right" sx={{ p: 0.5 }}>
                        {COP(sub)}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Monedas */}
                <TableRow>
                  <TableCell colSpan={2} sx={{ p: 0.5 }}>
                    <TextField
                      label="Monedas"
                      value={coins || ""}
                      onChange={(e) =>
                        setCoins(
                          Number((e.target.value || "0").replace(/[^\d]/g, ""))
                        )
                      }
                      size="small"
                      variant="standard"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                        style: { fontSize: "0.82rem", textAlign: "right" },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {COP(totalReceived)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* === Columna: OPERACIÓN (derecha) === */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={2}
            sx={{
              border: `1.5px solid ${colors.secondary}`,
              borderRadius: 2,
              p: 1.2,
              height: "100%",
            }}
          >
            <Typography
              fontFamily={fonts.heading}
              fontWeight={700}
              fontSize="0.95rem"
              sx={{ mb: 0.8 }}
            >
              OPERACIÓN
            </Typography>

            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: "0.8rem" }}>
                    Valor a Procesar
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {COP(totalToProcess)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontSize: "0.8rem" }}>
                    Valor Recibido
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {COP(totalReceived)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontSize: "0.8rem" }}>Resultado</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      color:
                        result < 0
                          ? "#c62828"
                          : result > 0
                          ? "#2e7d32"
                          : "#1565c0",
                    }}
                  >
                    {result === 0 ? COP(0) : `(${COP(Math.abs(result))})`}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    <Box
                      sx={{
                        mt: 0.5,
                        fontWeight: 900,
                        backgroundColor: actionColor,
                        color: "#111",
                        px: 1,
                        py: 0.6,
                        borderRadius: 1,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {actionLabel}
                    </Box>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Divider sx={{ my: 1 }} />

            <Grid container spacing={1}>
              <Grid item xs={12}>
                <TextField
                  label="Cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Teléfono"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "tel" }}
                />
              </Grid>
            </Grid>

            <Box
              sx={{
                mt: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {new Date().toLocaleString()}
              </Typography>

              <Box display="flex" gap={1}>
                <Tooltip title="Limpiar">
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<CleaningServicesIcon />}
                    onClick={resetAll}
                  >
                    LIMPIAR
                  </Button>
                </Tooltip>

                <Tooltip title={editingId ? "Actualizar" : "Guardar"}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={
                      invalidRange ||
                      (totalToProcess <= 0 && totalReceived <= 0)
                    }
                  >
                    {editingId ? "ACTUALIZAR" : "GUARDAR"}
                  </Button>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* === Historial (con filtros de fecha) === */}
        <Grid item xs={12}>
          <Box
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              // no se rompe la línea en >= sm; en xs sí puede envolver
              flexWrap: { xs: "wrap", sm: "nowrap" },
              width: "100%",
            }}
          >
            <Typography
              fontWeight={700}
              fontSize="0.95rem"
              display="flex"
              alignItems="center"
              gap={0.6}
              sx={{ mr: 0.5, whiteSpace: "nowrap" }}
            >
              <HistoryIcon fontSize="small" />
              Historial
            </Typography>

            {/* DESDE */}
            <TextField
              label="Desde"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              // misma altura y ancho
              sx={{ width: 210, "& .MuiOutlinedInput-root": { height: 44 } }}
              // evita salto por helperText
              helperText=" "
              FormHelperTextProps={{
                sx: { m: 0, minHeight: 0, lineHeight: 0 },
              }}
            />

            {/* HASTA */}
            <TextField
              label="Hasta"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={invalidRange}
              helperText={invalidRange ? "Rango inválido" : " "}
              FormHelperTextProps={{
                sx: { m: 0, minHeight: 0, lineHeight: 0 },
              }}
              sx={{ width: 210, "& .MuiOutlinedInput-root": { height: 44 } }}
            />

            {/* BUSCAR */}
            <Tooltip title="Buscar por rango">
              <span>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => loadHistory(fromDate, toDate)}
                  disabled={invalidRange}
                  sx={{ height: 44, minWidth: 130, boxShadow: "none" }}
                >
                  BUSCAR
                </Button>
              </span>
            </Tooltip>

            {/* empuja acciones a la derecha en la MISMA línea */}
            <Box
              sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}
            >
              <Tooltip title="Recargar">
                <IconButton
                  onClick={() => loadHistory(fromDate, toDate)}
                  size="small"
                  sx={{ p: 0.75 }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Button
                size="small"
                onClick={() => setHistoryOpen((v) => !v)}
                variant="text"
                sx={{ height: 44 }}
              >
                {historyOpen ? "Ocultar" : "Ver"}
              </Button>
            </Box>
          </Box>

          <Collapse in={historyOpen}>
            <Paper
              elevation={0}
              sx={{
                mt: 1.25,
                p: 1,
                border: "1px solid #eee",
                borderRadius: 2,
                background: "#fafafa",
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: "0.75rem" }}>#</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }}>Cliente</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }}>Teléfono</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }} align="right">
                      Procesar
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }} align="right">
                      Recibido
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }}>Acción</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }} align="center">
                      Opciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(history || []).map((r, idx) => (
                    <TableRow key={r.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{r.customer_name || "—"}</TableCell>
                      <TableCell>{r.customer_phone || "—"}</TableCell>
                      <TableCell align="right">
                        {COP(r.subtotal || 0)}
                      </TableCell>
                      <TableCell align="right">{COP(r.total || 0)}</TableCell>
                      <TableCell>{r.note || "—"}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(r.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(r.id)}
                            color="error"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!history || history.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Sin registros en el rango seleccionado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Collapse>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SnackPluginBillCounter;
