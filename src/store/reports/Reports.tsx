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
 * @returns {Promise<any>} Una promesa con los datos del reporte especial.
 */

export const getSpecialReport = async (
  id_cash: number,
  id_correspondent: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/special_reports.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_cash, id_correspondent }),
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
