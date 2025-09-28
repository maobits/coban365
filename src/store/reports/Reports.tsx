import { baseUrl } from "../config/server"; // Importa la configuración del servidor

/**
 * Servicio para obtener el reporte general de un corresponsal.
 * Realiza una solicitud POST al endpoint `general_report.php`.
 *
 * @param {number} correspondentId - ID del corresponsal.
 * @returns {Promise<any>} Una promesa con los datos del reporte.
 */
export const getGeneralReport = async (
  correspondentId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/reports/general_report.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ correspondent_id: correspondentId }),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener el reporte general:", error);
    throw error;
  }
};

/**
 * Servicio para obtener el reporte por caja de un corresponsal.
 * Realiza una solicitud POST al endpoint `box_report.php`.
 *
 * @param {number} correspondentId - ID del corresponsal.
 * @param {object} filters - Filtros opcionales como cash_id, start_date y end_date.
 * @returns {Promise<any>} Una promesa con los datos del reporte.
 */
export const getBoxReport = async (
  correspondentId: number,
  filters: {
    cash_id?: number;
    start_date?: string;
    end_date?: string;
  } = {}
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/reports/box_report.php`;

    const body = {
      correspondent_id: correspondentId,
      ...filters,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener el reporte por caja:", error);
    throw error;
  }
};

/**
 * Servicio para obtener cifras generales del sistema.
 * Realiza una solicitud GET al endpoint `report_general_figures.php`.
 *
 * Devuelve:
 * - Total de corresponsales
 * - Total de usuarios
 * - Total de terceros
 * - Total de transacciones activas
 *
 * @returns {Promise<any>} Una promesa con los datos del resumen general.
 */

export const getGeneralFigures = async (): Promise<any> => {
  try {
    const url = `${baseUrl}/api/reports/report_general_figures.php`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener cifras generales:", error);
    throw error;
  }
};

/**
 * Servicio para obtener el estado de cuenta de todos los terceros de un corresponsal.
 * Realiza una solicitud GET al endpoint `other_account_statement.php`.
 *
 * @param {number} correspondentId - ID del corresponsal
 * @returns {Promise<any>} Una promesa con los datos de terceros y sus balances
 */
export const getOtherStatementByCorrespondent = async (
  correspondentId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/reports/other_account_statement.php?correspondent_id=${correspondentId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      "❌ Error al obtener el estado de cuenta de terceros:",
      error
    );
    throw error;
  }
};

/**
 * Servicio para obtener el estado de cuenta de terceros.
 * Si se proporciona `correspondentId`, obtiene todos los terceros del corresponsal.
 * Si se proporciona `idNumber`, obtiene solo el tercero con ese documento.
 *
 * @param {object} params - Parámetros del servicio.
 * @param {number} [params.correspondentId] - ID del corresponsal.
 * @param {string} [params.idNumber] - Número de documento del tercero.
 * @returns {Promise<any>} Una promesa con los datos del estado de cuenta.
 */

export const getThirdPartyReport = async (params: {
  correspondentId?: number;
  idNumber?: string;
}): Promise<any> => {
  try {
    let url = `${baseUrl}/api/reports/other_account_statement.php`;

    const queryParams: string[] = [];

    if (params.correspondentId) {
      queryParams.push(`correspondent_id=${params.correspondentId}`);
    }

    if (params.idNumber) {
      queryParams.push(`id_number=${encodeURIComponent(params.idNumber)}`);
    }

    if (queryParams.length === 0) {
      throw new Error("Se requiere al menos 'correspondentId' o 'idNumber'.");
    }

    url += `?${queryParams.join("&")}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener datos: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error en getOtherAccountStatement:", error);
    throw error;
  }
};

/**
 * Servicio para obtener el reporte especial por caja y corresponsal.
 * Realiza una solicitud POST al endpoint `special_reports.php`.
 *
 * @param {number} id_cash - ID de la caja.
 * @param {number} id_correspondent - ID del corresponsal.
 * @param {string} [date] - Fecha del reporte en formato YYYY-MM-DD (opcional).
 * @returns {Promise<any>} Una promesa con los datos del reporte especial.
 */

export const getSpecialReport = async (
  id_cash: number,
  id_correspondent: number,
  date?: string
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/special_reports.php`;

    const body: Record<string, any> = {
      id_cash,
      id_correspondent,
    };

    if (date) {
      body.date = date;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener el reporte especial:", error);
    throw error;
  }
};

/**
 * Servicio para obtener el reporte especial por todas las cajas de un corresponsal.
 * Realiza una solicitud POST al endpoint `special_report_boxes.php`.
 *
 * @param {number} id_correspondent - ID del corresponsal.
 * @param {string} [date] - Fecha del reporte en formato YYYY-MM-DD (opcional).
 * @returns {Promise<any>} Una promesa con los datos del reporte por cajas.
 */
export const getSpecialReportBoxes = async (
  id_correspondent: number,
  date?: string
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/special_report_boxes.php`;

    const body: Record<string, any> = {
      id_correspondent,
    };

    if (date) {
      body.date = date;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener el reporte especial por cajas:", error);
    throw error;
  }
};

export type ThirdSpecialReportOpts = {
  /** Fecha límite (<= date) YYYY-MM-DD */
  date?: string;
  /** Rango desde YYYY-MM-DD */
  dateFrom?: string;
  /** Rango hasta YYYY-MM-DD */
  dateTo?: string;
};

/**
 * Servicio: Reporte especial por corresponsal + tercero
 * GET -> /api/transactions/utils/third_special_report.php
 *
 * Ejemplos:
 *  getThirdSpecialReport(23, 20)
 *  getThirdSpecialReport(23, 20, "2025-09-27")
 *  getThirdSpecialReport(23, 20, { date: "2025-09-27" })
 *  getThirdSpecialReport(23, 20, { dateFrom: "2025-09-01", dateTo: "2025-09-27" })
 */
export type ThirdPartyReportOpts = {
  /** Fecha límite (<= date) YYYY-MM-DD */
  date?: string;
  /** Rango desde YYYY-MM-DD */
  dateFrom?: string;
  /** Rango hasta YYYY-MM-DD */
  dateTo?: string;
};

/**
 * Servicio para obtener el reporte especial de un tercero de un corresponsal.
 * Realiza una solicitud GET al endpoint `third_special_report.php`.
 *
 * @param {number} correspondentId - ID del corresponsal.
 * @param {number} thirdPartyId - ID del tercero.
 * @param {ThirdPartyReportOpts|string} [opts] - Filtros opcionales (fecha exacta o rango).
 * @returns {Promise<any>} Una promesa con los datos del reporte especial.
 */
export const getThirdPartyBalanceSheet = async (
  correspondentId: number,
  thirdPartyId: number,
  opts?: string | ThirdPartyReportOpts
): Promise<any> => {
  try {
    const qp = new URLSearchParams();
    qp.set("correspondent_id", String(correspondentId));
    qp.set("third_party_id", String(thirdPartyId));

    if (typeof opts === "string" && opts) {
      qp.set("date", opts); // fecha simple (<= date)
    } else if (opts && typeof opts === "object") {
      const { date, dateFrom, dateTo } = opts;
      if (dateFrom) qp.set("date_from", dateFrom);
      if (dateTo) qp.set("date_to", dateTo);
      if (!dateFrom && !dateTo && date) qp.set("date", date);
    }

    const url = `${baseUrl}/api/transactions/utils/third_special_report.php?${qp.toString()}`;
    console.log("➡️ GET ThirdPartyBalanceSheet URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `Error en la solicitud: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error al obtener el balance de terceros:", error);
    throw error;
  }
};
/** ===== Tipos sugeridos del payload ===== */
export interface CashCountRow {
  denom: number;
  count: number;
  subtotal?: number;
}

export interface CashBundleRow extends CashCountRow {
  units_per_bundle?: number; // default 100 en backend
}

export interface CashCountDetails {
  header?: {
    correspondent_code?: string | number;
    correspondent_name?: string;
    cash?: { id: number; name?: string };
    reported_at?: string; // ISO string
  };
  sections: {
    bills?: CashCountRow[];
    bundles?: CashBundleRow[];
    coins?: CashCountRow[];
  };
  subtotals?: {
    bills?: number;
    bundles?: number;
    coins?: number;
  };
  totals?: {
    total_effective?: number;
    current_cash?: number; // “caja actual esperada” del sistema
    balance?: number; // opcional; backend lo recalcula
    abs_diff?: number; // opcional
    message?: string; // opcional
  };
}

export interface CloseBoxRequest {
  correspondent_id: number;
  cash_id: number;
  cashier_id: number;
  details: CashCountDetails;
  balance_date?: string; // YYYY-MM-DD (opcional)
  balance_time?: string; // HH:MM:SS (opcional)
  note?: string; // ej: "Cierre turno noche"
}

export interface CloseBoxResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    diff_status: "OK" | "SOBRANTE" | "FALTANTE";
    diff_amount: number;
    total_effective: number;
    current_cash: number;
  };
}

/**
 * Servicio: Registrar cierre de caja con conteo (billetes, fajos, monedas).
 * POST -> /api/transactions/utils/close_box.php
 */
export const closeBox = async (payload: any): Promise<any> => {
  const url = `${baseUrl}/api/transactions/utils/close_box.php`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // si no es JSON, dejamos json en null
    }

    if (!response.ok) {
      // Propaga un error con status y payload del backend
      const err: any = new Error(
        json?.message ||
          `Error en la solicitud: ${response.status} ${response.statusText}`
      );
      err.isApiError = true;
      err.status = response.status;
      err.payload = json;
      throw err;
    }

    return json; // success
  } catch (error) {
    // Repropaga tal cual
    throw error;
  }
};

/** ===== Tipos para open_box ===== */
export interface OpenBoxRequest {
  id_cash: number;
}

export interface OpenBoxResponse {
  success: boolean;
  message: string;
  id_cash?: number;
}

/**
 * Servicio: Abrir caja (setea `open = 1`).
 * POST -> /api/transactions/utils/open_box.php
 */
export const openBox = async (
  payload: OpenBoxRequest
): Promise<OpenBoxResponse> => {
  const url = `${baseUrl}/api/transactions/utils/open_box.php`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Leemos texto primero para manejar respuestas no-JSON
    const text = await response.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // Si backend devolvió algo no JSON, json queda null
    }

    if (!response.ok) {
      const err: any = new Error(
        json?.message ||
          `Error en la solicitud: ${response.status} ${response.statusText}`
      );
      err.isApiError = true;
      err.status = response.status;
      err.payload = json;
      throw err;
    }

    return json as OpenBoxResponse;
  } catch (error) {
    // Repropaga para que el componente muestre el mensaje adecuado
    throw error;
  }
};

/**
 * Servicio para obtener el cuadre de caja (cash_balance) por fecha e id de caja.
 * GET -> /api/cash/utils/get_cash_balance.php?id_cash={id}&date=YYYY-MM-DD
 */

export interface CashBalanceRecord {
  id: number;
  correspondent_id: number;
  cash_id: number;
  cashier_id: number;
  balance_date: string; // YYYY-MM-DD
  balance_time: string | null; // HH:MM:SS o null
  details: string | null;
  total_bills: number;
  total_bundles: number;
  total_coins: number;
  total_effective: number;
  current_cash: number;
  diff_amount: number;
  diff_status: "OK" | "SOBRANTE" | "FALTANTE";
  note: string | null;
  created_at: string;
  updated_at: string;
}

export const getCashBalance = async (
  id_cash: number,
  date: string // YYYY-MM-DD
): Promise<{
  success: boolean;
  message: string;
  data: CashBalanceRecord | null;
  meta?: { id_cash: number; date: string; day_count?: number };
}> => {
  try {
    if (!id_cash || !date) {
      throw new Error("Se requieren 'id_cash' y 'date' (YYYY-MM-DD).");
    }

    const url = `${baseUrl}/api/transactions/utils/get_cash_balance.php?id_cash=${id_cash}&date=${encodeURIComponent(
      date
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener el cuadre de caja:", error);
    throw error;
  }
};
/** ===== Tipos de respuesta ===== */
export type RangeKey = "leq80" | "between" | "gte800";

export interface CommissionRangeRow {
  transactions: number;
  total_amount: number;
  tariff: { min: number | null; pct: string | null; cap: number | null };
  total_commission: number;
}

export interface CategorySummary {
  ranges: Record<RangeKey, CommissionRangeRow>;
  totals: { count: number; total_amount: number; total_commission: number };
}

export interface CommissionsResponse {
  success: boolean;
  filters: {
    id_cash: number | null;
    id_correspondent?: number | null;
    date: string | null;
    start_date?: string | null;
    end_date?: string | null;
  };
  tariffs: {
    Ingresos: Record<
      RangeKey,
      {
        min: number | null;
        pct: number | null;
        cap: number | null;
        label: string;
      }
    >;
    Retiros: Record<
      RangeKey,
      {
        min: number | null;
        pct: number | null;
        cap: number | null;
        label: string;
      }
    >;
  };
  summary: {
    Ingresos: CategorySummary;
    Retiros: CategorySummary;
  };
  grand_total: {
    detail: Array<{ label: string; movements: number; commission: number }>;
    totals: { movements: number; commission: number };
  };
  /** presente solo si se pidió per_correspondent=1 */
  per_correspondent?: Record<
    "Ingresos" | "Retiros",
    Record<
      string,
      { count: number; total_amount: number; total_commission: number }
    >
  >;
}

/** ===== Opciones del servicio ===== */
export type GetCommissionsOpts = {
  /**
   * Día exacto YYYY-MM-DD (tiene prioridad sobre start/end).
   * Si lo envías, el backend ignora start_date / end_date.
   */
  date?: string;
  /** Rango desde YYYY-MM-DD (opcional, usar con endDate). */
  startDate?: string;
  /** Rango hasta YYYY-MM-DD (opcional, usar con startDate). */
  endDate?: string;
  /** Si true, agrega desglose por corresponsal (opcional) */
  perCorrespondent?: boolean;
};

import { baseUrl } from "../config/server";

/**
 * Servicio: Comisiones por rangos (Ingresos/Retiros).
 * Backend: /api/transactions/utils/commissions.php
 *
 * Puedes llamar con:
 *  - getCommissions({ idCash: 24 }, { date: "2025-09-07" })
 *  - getCommissions({ idCorrespondent: 23 }, { startDate: "2025-09-01", endDate: "2025-09-07" })
 */
export const getCommissions = async (
  ids:
    | { idCash: number; idCorrespondent?: never }
    | { idCorrespondent: number; idCash?: never },
  opts: GetCommissionsOpts = {}
): Promise<CommissionsResponse> => {
  const params = new URLSearchParams();

  // Identificador requerido
  if ("idCash" in ids && typeof ids.idCash === "number") {
    params.set("id_cash", String(ids.idCash));
  } else if (
    "idCorrespondent" in ids &&
    typeof ids.idCorrespondent === "number"
  ) {
    params.set("id_correspondent", String(ids.idCorrespondent));
  } else {
    throw new Error("Debes enviar 'idCash' o 'idCorrespondent'.");
  }

  // Fechas (date tiene prioridad sobre start/end)
  if (opts.date) {
    params.set("date", opts.date);
  } else {
    if (opts.startDate) params.set("start_date", opts.startDate);
    if (opts.endDate) params.set("end_date", opts.endDate);
  }

  if (opts.perCorrespondent) params.set("per_correspondent", "1");

  const url = `${baseUrl}/api/transactions/utils/commissions.php?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // backend no devolvió JSON válido
  }

  if (!res.ok || !json?.success) {
    const message =
      json?.message || `Error en la solicitud: ${res.status} ${res.statusText}`;
    const err: any = new Error(message);
    err.isApiError = true;
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json as CommissionsResponse;
};
