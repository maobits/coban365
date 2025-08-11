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

/**
 * Servicio para obtener el balance general de todos los terceros de un corresponsal,
 * agrupados como si cada tercero fuera una caja.
 * Realiza una solicitud GET al endpoint `third_party_balance_sheet.php`.
 *
 * @param {number} correspondentId - ID del corresponsal.
 * @param {string} [date] - (Opcional) Fecha en formato YYYY-MM-DD para filtrar las transacciones.
 * @returns {Promise<any>} Una promesa con los datos del balance por terceros.
 */
export const getThirdPartyBalanceSheet = async (
  correspondentId: number,
  date?: string
): Promise<any> => {
  try {
    let url = `${baseUrl}/api/transactions/utils/third_special_report.php?correspondent_id=${correspondentId}`;

    if (date) {
      url += `&date=${date}`;
    }

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
