// ============================================================================
//  Maobits · BITSCORE / Servicio Global de Comisiones
//  ----------------------------------------------------------------------------
//  report_global_commissions.tsx
//  Servicio centralizado para consultar el reporte de comisiones acumuladas
//  por tercero en un corresponsal y el total global del corresponsal.
//  ----------------------------------------------------------------------------
//  Endpoint esperado (PHP):
//    /api/transactions/utils/third_party_commissions_report.php
//    Parámetros (GET):
//      - correspondent_id (obligatorio)
//      - third_party_id   (opcional)
//      - min_total        (opcional)
//      - search           (opcional, por nombre del tercero)
//      - limit            (opcional, default 100)
//      - offset           (opcional, default 0)
// ============================================================================

import { baseUrl } from "../config/server";

/* =========================================================================
 * Tipos de datos
 * ========================================================================= */

export interface GlobalCommissionRow {
  id: number;
  third_party_id: number;
  third_party_name: string | null;
  correspondent_id: number;
  total_commission: number;
  last_update: string;
}

export interface GlobalCommissionSummary {
  third_parties_with_commission: number;
  grand_total_commission: number;
}

export interface GlobalCommissionPagination {
  limit: number;
  offset: number;
  count: number;
  has_more: boolean;
}

export interface GlobalCommissionReport {
  correspondent: {
    id: number;
    name: string;
  };
  summary: GlobalCommissionSummary;
  pagination: GlobalCommissionPagination;
  rows: GlobalCommissionRow[];
}

export interface GlobalCommissionAPIResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: GlobalCommissionReport;
  details?: any;
}

/* =========================================================================
 * Utilidad de log
 * ========================================================================= */

function logGlobal(label: string, info: any) {
  // eslint-disable-next-line no-console
  console.groupCollapsed(`🧾 [GlobalCommissions] ${label}`);
  // eslint-disable-next-line no-console
  console.log(info);
  // eslint-disable-next-line no-console
  console.groupEnd();
}

/* =========================================================================
 * Parámetros del servicio
 * ========================================================================= */

export interface GetGlobalCommissionsParams {
  correspondentId: number;

  /** ID de tercero específico (opcional). */
  thirdPartyId?: number;

  /** Mínimo de comisión para filtrar la lista (opcional). */
  minTotal?: number;

  /** Búsqueda por nombre de tercero (opcional). */
  search?: string;

  /** Paginación: número máximo de filas (por defecto 100). */
  limit?: number;

  /** Desplazamiento para paginación (por defecto 0). */
  offset?: number;

  /** Tiempo máximo de espera del request en ms (por defecto 15000). */
  timeoutMs?: number;
}

/* =========================================================================
 * Servicio principal
 * ========================================================================= */

/**
 * Consulta el reporte global de comisiones por tercero para un corresponsal.
 * Devuelve el detalle por tercero, el total global y metadatos de paginación.
 */
export async function getGlobalCommissionsReport(
  params: GetGlobalCommissionsParams
): Promise<GlobalCommissionReport> {
  const {
    correspondentId,
    thirdPartyId,
    minTotal,
    search,
    limit = 100,
    offset = 0,
    timeoutMs = 15000,
  } = params;

  if (!correspondentId || correspondentId <= 0) {
    throw new Error(
      `[GlobalCommissions] correspondentId inválido (${correspondentId}).`
    );
  }

  // Construir querystring
  const qs = new URLSearchParams();
  qs.set("correspondent_id", String(correspondentId));
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));

  if (thirdPartyId && thirdPartyId > 0) {
    qs.set("third_party_id", String(thirdPartyId));
  }
  if (typeof minTotal === "number" && !Number.isNaN(minTotal)) {
    qs.set("min_total", String(minTotal));
  }
  if (search && search.trim().length > 0) {
    qs.set("search", search.trim());
  }

  const url = `${baseUrl}/api/transactions/utils/third_party_commissions_report.php?${qs.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    logGlobal("GET report → request", { url, params });

    const res = await fetch(url, { method: "GET", signal: controller.signal });
    const text = await res.text();

    let payload: GlobalCommissionAPIResponse | null = null;
    try {
      payload = JSON.parse(text) as GlobalCommissionAPIResponse;
    } catch (e) {
      logGlobal("GET report → JSON parse error", { text, error: e });
      throw new Error(
        "Respuesta inválida del servicio de reporte de comisiones."
      );
    }

    logGlobal("GET report → response", {
      status: res.status,
      url,
      payload,
    });

    if (!res.ok || !payload?.success || !payload.data) {
      const msg =
        payload?.message ||
        payload?.error ||
        `No se pudo obtener el reporte global de comisiones (HTTP ${res.status}).`;
      throw new Error(msg);
    }

    // Normalizar numéricos por seguridad
    const data = payload.data;
    data.summary.grand_total_commission = Number(
      data.summary.grand_total_commission || 0
    );
    data.summary.third_parties_with_commission = Number(
      data.summary.third_parties_with_commission || 0
    );

    data.pagination.limit = Number(data.pagination.limit || limit);
    data.pagination.offset = Number(data.pagination.offset || offset);
    data.pagination.count = Number(data.pagination.count || 0);
    data.pagination.has_more = Boolean(data.pagination.has_more);

    data.rows = (data.rows || []).map((r) => ({
      ...r,
      id: Number(r.id),
      third_party_id: Number(r.third_party_id),
      correspondent_id: Number(r.correspondent_id),
      total_commission: Number(r.total_commission || 0),
    }));

    return data;
  } catch (err) {
    logGlobal("GET report → error", { url, error: err });
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
