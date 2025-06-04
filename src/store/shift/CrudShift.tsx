import baseUrl from "../config/server"; // Importa la configuración del servidor

/**
 * Servicio para registrar un turno.
 * Envía una solicitud POST al endpoint `create_shift.php`.
 *
 * @param {object} shiftData - Datos del turno a registrar.
 * @returns {Promise<any>} Una promesa que resuelve con la respuesta del servidor.
 */
export const createShift = async (shiftData: {
  correspondent_id: number;
  cash_id: number;
  transaction_type: string;
  amount: number;
  agreement?: string;
  reference?: string;
  full_name: string;
  document_id: string;
  phone?: string;
  email: string;
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/shifts/create_shift.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shiftData),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al registrar el turno:", error);
    throw error;
  }
};

/**
 * Servicio para obtener los turnos por corresponsal y caja.
 * Envía una solicitud POST al endpoint `list_shift.php`.
 *
 * @param {number} correspondentId - ID del corresponsal.
 * @param {number} cashId - ID de la caja.
 * @returns {Promise<any>} Promesa que resuelve con los turnos encontrados.
 */
export const listShifts = async (
  correspondentId: number,
  cashId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/shifts/list_shift.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correspondent_id: correspondentId,
        cash_id: cashId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener turnos:", error);
    throw error;
  }
};

/**
 * Servicio para confirmar un turno.
 * Envía una solicitud POST al endpoint `confirm_shift.php`.
 *
 * @param {number} shiftId - ID del turno a confirmar.
 * @returns {Promise<any>} Promesa que resuelve con el estado de la operación.
 */
export const confirmShift = async (shiftId: number): Promise<any> => {
  try {
    const url = `${baseUrl}/api/shifts/confirm_shift.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shift_id: shiftId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al confirmar el turno:", error);
    throw error;
  }
};

/**
 * Servicio para rechazar un turno.
 * Envía una solicitud POST al endpoint `reject_turn.php`.
 *
 * @param {number} shiftId - ID del turno a rechazar.
 * @returns {Promise<any>} Promesa que resuelve con el estado de la operación.
 */
export const rejectShift = async (shiftId: number): Promise<any> => {
  try {
    const url = `${baseUrl}/api/shifts/reject_turn.php`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shift_id: shiftId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al rechazar el turno:", error);
    throw error;
  }
};
