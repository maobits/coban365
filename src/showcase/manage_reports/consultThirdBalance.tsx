// src/pages/consultThirdBalance.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SnackReportThird from "../../snacks/ui/integral-box/reports/SnackReportThird"; // Dialog que requiere open / onClose
import { baseUrl } from "../../store/config/server";

/* -----------------------------
 * Tipos y utilidades
 * ----------------------------- */

type ConsultThirdBalanceProps = {
  /** Opcional: Número de cédula para precargar automáticamente */
  idNumber?: string;
  /** Límite inicial de movimientos (opcional, lo consume el backend si lo necesita) */
  limit?: number;
  /** Personalización */
  title?: string;
  showOpenModalButton?: boolean;
  openModalButtonText?: string;
  /** Extras en el header */
  renderHeaderExtras?: (third: ThirdBasic) => React.ReactNode;
};

type ThirdBasic = {
  id: number;
  correspondent_id: number;
  name: string;
  id_type?: string | null;
  id_number?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  credit?: number;
  balance?: number;
  negative_balance?: number | boolean;
  state?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

const INFO_URL = `${baseUrl}/api/other/utils/third_party_info.php`;

const buildUrlByIdNumber = (idNumber: string, limit?: number) => {
  const qs = new URLSearchParams();
  qs.set("id_number", idNumber.trim());
  if (typeof limit === "number") qs.set("limit", String(Math.max(1, limit)));
  return `${INFO_URL}?${qs.toString()}`;
};

const isPositiveInt = (s?: string) =>
  !s || (!!/^\d+$/.test(s) && parseInt(s, 10) >= 1);

/* -----------------------------
 * Componente principal
 * ----------------------------- */

const ConsultThirdBalance: React.FC<ConsultThirdBalanceProps> = ({
  idNumber,
  limit,
  title = "Consulta de Balance de Tercero",
  showOpenModalButton = true,
  openModalButtonText = "Consultar por documento",
  renderHeaderExtras,
}) => {
  // Estados base
  const [third, setThird] = useState<ThirdBasic | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Report Dialog (SnackReportThird)
  const [reportOpen, setReportOpen] = useState<boolean>(false);

  // Límite efectivo
  const [effectiveLimit, setEffectiveLimit] = useState<number | undefined>(
    limit
  );

  // Modal y formulario
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formIdNumber, setFormIdNumber] = useState<string>(idNumber || "");
  const [formLimit, setFormLimit] = useState<string>(
    typeof limit === "number" ? String(limit) : ""
  );

  // Limpia todo el estado visible (y opcionalmente inputs)
  const resetState = (opts?: { keepInputs?: boolean }) => {
    setThird(null);
    setReportOpen(false);
    setEffectiveLimit(undefined);
    setErrorMsg("");
    if (!opts?.keepInputs) {
      setFormIdNumber("");
      setFormLimit("");
    }
  };

  // Construye mensaje de error útil intentando leer el body
  const buildHttpErrorMessage = async (res: Response, url: string) => {
    let body: any = undefined;
    try {
      body = await res.clone().json();
    } catch {
      try {
        body = await res.clone().text();
      } catch {
        body = undefined;
      }
    }
    const backendMsg =
      (body && typeof body === "object" && (body.message || body.error)) ||
      (typeof body === "string" ? body.slice(0, 300) : "");

    const notFoundHint =
      res.status === 404
        ? "\nSugerencia: verifica el documento o que el tercero esté activo."
        : "";

    return `Error consultando tercero: ${res.status} ${res.statusText}${
      backendMsg ? `\nDetalle: ${backendMsg}` : ""
    }${notFoundHint}\nContext: { url: "${url}" }`;
  };

  // Validación si viene idNumber por props (dejamos libre por ahora)
  const inputError = useMemo(() => {
    if (!idNumber) return "";
    return "";
  }, [idNumber]);

  // Abrir automáticamente el reporte cuando ya tengamos tercero
  useEffect(() => {
    if (third?.id && third?.correspondent_id) {
      setReportOpen(true);
    }
  }, [third?.id, third?.correspondent_id]);

  // Carga inicial si llega idNumber por props
  useEffect(() => {
    let abort = false;

    (async () => {
      if (!idNumber) return;
      if (inputError) {
        setErrorMsg(inputError);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg("");

        const url = buildUrlByIdNumber(idNumber, limit);
        const res = await fetch(url);

        if (!res.ok) {
          const msg = await buildHttpErrorMessage(res, url);
          resetState({ keepInputs: true });
          setErrorMsg(msg);
          return;
        }

        const payload = await res.json();
        if (payload?.success === false) {
          const msg =
            payload?.message ||
            "No fue posible obtener la información del tercero.";
          resetState({ keepInputs: true });
          setErrorMsg(
            `${msg}\nContext: { received: ${JSON.stringify(
              payload?.received
            )} }`
          );
          return;
        }

        const maybeThird: ThirdBasic =
          payload?.data?.third ?? payload?.third ?? payload?.data;

        if (!maybeThird?.id || !maybeThird?.correspondent_id) {
          resetState({ keepInputs: true });
          setErrorMsg(
            "La respuesta no contiene (id, correspondent_id) del tercero."
          );
          return;
        }

        if (!abort) {
          setThird(maybeThird);
          setEffectiveLimit(limit);
          setFormIdNumber(maybeThird.id_number || idNumber || "");
          setFormLimit(typeof limit === "number" ? String(limit) : "");
          // reportOpen se activa vía el useEffect de arriba
        }
      } catch (err: any) {
        if (!abort) {
          resetState({ keepInputs: true });
          setErrorMsg(err?.message || String(err));
        }
      } finally {
        if (!abort) setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo una vez

  /* -----------------------------
   * Handlers del Modal
   * ----------------------------- */

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const handleSubmitModal = async () => {
    const idn = formIdNumber.trim();
    const limStr = formLimit.trim();

    if (!idn) {
      setErrorMsg("Debes ingresar el documento (cédula).");
      return;
    }
    if (!isPositiveInt(limStr)) {
      setErrorMsg("El límite debe ser un entero positivo.");
      return;
    }
    const parsedLimit =
      limStr.length > 0 ? Math.max(1, parseInt(limStr, 10)) : undefined;

    try {
      setLoading(true);
      setErrorMsg("");

      const url = buildUrlByIdNumber(idn, parsedLimit);
      const res = await fetch(url);

      if (!res.ok) {
        const msg = await buildHttpErrorMessage(res, url);
        resetState({ keepInputs: true }); // limpia el reporte, conserva inputs
        setErrorMsg(msg);
        return; // mantenemos el modal abierto para corregir
      }

      const payload = await res.json();
      if (payload?.success === false) {
        const msg =
          payload?.message ||
          "No fue posible obtener la información del tercero.";
        resetState({ keepInputs: true });
        setErrorMsg(
          `${msg}\nContext: { received: ${JSON.stringify(payload?.received)} }`
        );
        return;
      }

      const maybeThird: ThirdBasic =
        payload?.data?.third ?? payload?.third ?? payload?.data;

      if (!maybeThird?.id || !maybeThird?.correspondent_id) {
        resetState({ keepInputs: true });
        setErrorMsg(
          "La respuesta no contiene (id, correspondent_id) del tercero."
        );
        return;
      }

      setThird(maybeThird);
      setEffectiveLimit(parsedLimit);
      setErrorMsg("");
      setModalOpen(false); // cerrar solo si OK (el reporte abre automáticamente)
    } catch (err: any) {
      resetState({ keepInputs: true });
      setErrorMsg(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
   * Render básico (loading / error)
   * ----------------------------- */

  if (loading && !third) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={24} />
          <Typography variant="body1">Cargando datos del tercero…</Typography>
        </Stack>
      </Paper>
    );
  }

  /* -----------------------------
   * UI principal
   * ----------------------------- */

  const correspondentId = third?.correspondent_id;
  const effectiveThirdId = third?.id;
  const effectiveIdNumber = third?.id_number || formIdNumber || idNumber || "";

  return (
    <Box>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="text"
              size="small"
              onClick={() => resetState()}
              aria-label="Limpiar"
            >
              Limpiar
            </Button>

            {showOpenModalButton && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SearchIcon />}
                onClick={handleOpenModal}
              >
                {openModalButtonText}
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Info breve del tercero si existe */}
        {third ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>Tercero:</strong> {third.name || "—"} &nbsp;•&nbsp;
            <strong>ID:</strong> {effectiveThirdId} &nbsp;•&nbsp;
            <strong>Cédula:</strong> {effectiveIdNumber || "—"} &nbsp;•&nbsp;
            <strong>Corresponsal:</strong> {correspondentId}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Ingrese un documento para iniciar la consulta.
          </Typography>
        )}

        {third && renderHeaderExtras ? (
          <Box mt={1}>{renderHeaderExtras(third)}</Box>
        ) : null}

        <Divider sx={{ mt: 2 }} />
      </Paper>

      {/* Mensajes de error */}
      {errorMsg ? (
        <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
          {errorMsg}
        </Alert>
      ) : null}

      {/* Reporte (Dialog) cuando ya tenemos al tercero */}
      {third && correspondentId && effectiveThirdId && (
        <SnackReportThird
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          correspondentId={correspondentId}
          thirdCedula={effectiveIdNumber} // la versión de SnackReportThird que nos diste acepta thirdCedula opcional
        />
      )}

      {/* Si no hay nada que mostrar */}
      {!third && !loading && !errorMsg && (
        <Alert severity="info">
          Esperando datos para renderizar el reporte. Usa “{openModalButtonText}
          ”.
        </Alert>
      )}

      {/* ----------------------
          Modal de búsqueda
      ----------------------- */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <EditNoteIcon fontSize="small" style={{ marginRight: 8 }} />
          Consultar tercero por documento
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Cerrar">
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Documento (cédula)"
              value={formIdNumber}
              onChange={(e) => setFormIdNumber(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Límite de movimientos"
              placeholder="50"
              value={formLimit}
              onChange={(e) => setFormLimit(e.target.value)}
              fullWidth
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            />
            <Alert severity="info">
              Solo el <strong>documento</strong> es obligatorio. El límite es
              opcional.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmitModal} variant="contained">
            Consultar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConsultThirdBalance;
