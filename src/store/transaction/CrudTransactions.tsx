import { baseUrl } from "../config/server"; // Importa la configuración del servidor

/**
 * Obtiene todas las transacciones registradas.
 */
export const getTransactions = async (id_cashier?: number): Promise<any> => {
  try {
    const url = id_cashier
      ? `${baseUrl}/api/transactions/utils/get_transactions.php?id_cashier=${id_cashier}`
      : `${baseUrl}/api/transactions/utils/get_transactions.php`;

    const res = await fetch(url);
    return await res.json();
  } catch (error) {
    console.error("❌ Error al obtener transacciones:", error);
    return { success: false, message: "Error en el servidor." };
  }
};

export const getTransactionsByCash = async (
  id_cash: number,
  page: number = 1,
  perPage: number = 10,
  category: string = "",
  date: string = ""
): Promise<any> => {
  try {
    const categoryParam = category
      ? `&category=${encodeURIComponent(category)}`
      : "";
    const dateParam = date ? `&date=${encodeURIComponent(date)}` : "";

    const url = `${baseUrl}/api/transactions/utils/get_transactions_by_cash.php?id_cash=${id_cash}&page=${page}&per_page=${perPage}${categoryParam}${dateParam}`;

    console.log("📤 URL enviada al backend:", url);

    const res = await fetch(url);
    const data = await res.json();

    console.log("📥 Respuesta del backend:", data);

    return data;
  } catch (error) {
    console.error("❌ Error al obtener transacciones por caja:", error);
    return { success: false, message: "Error en el servidor." };
  }
};

/**
 * Crea una nueva transacción.
 * @param payload - Objeto con los datos de la transacción.
 */
export const createTransaction = async (payload: any): Promise<any> => {
  try {
    const res = await fetch(
      `${baseUrl}/api/transactions/utils/new_transaction.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return await res.json();
  } catch (error) {
    console.error("❌ Error al crear transacción:", error);
    return { success: false, message: "Error al crear transacción." };
  }
};

/**
 * Actualiza una transacción existente.
 * @param payload - Objeto con los campos a actualizar, incluyendo el `id`.
 */
export const updateTransaction = async (payload: any): Promise<any> => {
  try {
    const res = await fetch(
      `${baseUrl}/api/transactions/utils/update_transaction.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return await res.json();
  } catch (error) {
    console.error("❌ Error al actualizar transacción:", error);
    return { success: false, message: "Error al actualizar transacción." };
  }
};

/**
 * Genera una nota crédito o débito sobre una transacción.
 * @param originalTransactionId - ID de la transacción original.
 * @param type - Tipo de nota: "credit" o "debit".
 * @param newValue - Nuevo valor para la transacción ajustada.
 * @param observation - Observación escrita por el usuario.
 * @returns Una promesa que resuelve con el estado de la operación.
 */
export const createTransactionNote = async (
  originalTransactionId: number,
  type: "credit" | "debit",
  newValue: number,
  observation: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${baseUrl}/api/transactions/create_transaction_note.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original_transaction_id: originalTransactionId,
          type,
          new_value: newValue,
          observation,
        }),
      }
    );

    return await response.json();
  } catch (error) {
    console.error("❌ Error al crear nota crédito/débito:", error);
    return { success: false, message: "Error al crear nota." };
  }
};

/**
 * Servicio para obtener los tipos de transacciones permitidos para un corresponsal y tipo de movimiento.
 *
 * @param {number} correspondentId - ID del corresponsal.
 * @param {string} movementType - Tipo de movimiento (e.g., "deposits").
 * @returns {Promise<any>} Promesa con los tipos de transacciones válidas.
 */
export const getTransactionTypesByCorrespondent = async (
  correspondentId: number,
  movementType: string
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/types_correspondent_transactions.php?correspondent_id=${correspondentId}&movement_type=${movementType}`;
    console.log(
      "📡 Consultando tipos de transacción para el corresponsal:",
      correspondentId
    );

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Tipos de transacciones recibidas:", data);
    return data;
  } catch (error) {
    console.error(
      "❌ Error al obtener tipos de transacción por corresponsal:",
      error
    );
    return {
      success: false,
      message: "No se pudieron cargar los tipos de transacción.",
    };
  }
};

/**
 * Servicio para obtener la lista de ingresos activos de una caja.
 *
 * @param {number} cashId - ID de la caja.
 * @returns {Promise<any>} Promesa con los ingresos y total acumulado.
 */

export const getCashIncomes = async (cashId: number): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/get_cash_incomes.php?id_cash=${cashId}`;
    console.log("📡 Consultando ingresos de la caja:", cashId);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Ingresos de caja recibidos:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al obtener ingresos de caja:", error);
    return {
      success: false,
      message: "No se pudieron cargar los ingresos de la caja.",
    };
  }
};

/**
 * Servicio para obtener la lista de retiros activos de una caja.
 *
 * @param {number} cashId - ID de la caja.
 * @returns {Promise<any>} Promesa con los retiros y total acumulado.
 */

export const getCashWithdrawals = async (cashId: number): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/get_cashouts.php?id_cash=${cashId}`;
    console.log("📡 Consultando retiros de la caja:", cashId);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Retiros de caja recibidos:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al obtener retiros de caja:", error);
    return {
      success: false,
      message: "No se pudieron cargar los retiros de la caja.",
    };
  }
};

/**
 * Servicio para obtener el monto inicial configurado de una caja.
 *
 * @param {number} cashId - ID de la caja a consultar.
 * @returns {Promise<any>} Promesa con la respuesta del servidor.
 */
export const getInitialCashConfiguration = async (
  cashId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/get_initial_box_configuration.php?id_cash=${cashId}`;
    console.log("📡 Consultando configuración inicial de la caja:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Monto inicial recibido:", data);

    return data;
  } catch (error) {
    console.error("❌ Error al obtener configuración inicial de caja:", error);
    return {
      success: false,
      message: "No se pudo obtener el monto inicial de la caja.",
    };
  }
};

/**
 * Servicio para consultar la deuda del corresponsal con el banco.
 *
 * @param {number} correspondentId - ID del corresponsal.
 * @returns {Promise<any>} Objeto con ingresos, egresos, neto y detalle de cajas.
 */

export const getDebtToBankByCorrespondent = async (
  correspondentId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/debt_correspondent_bank.php?correspondent_id=${correspondentId}`;
    console.log("📡 Consultando deuda bancaria del corresponsal:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Deuda bancaria recibida:", data);

    return data;
  } catch (error) {
    console.error(
      "❌ Error al obtener deuda bancaria del corresponsal:",
      error
    );
    return {
      success: false,
      message: "No se pudo obtener la deuda bancaria del corresponsal.",
    };
  }
};

/**
 * Consulta el balance financiero entre un corresponsal y un tercero.
 * Incluye: deuda, cobros, préstamos realizados y recibidos.
 *
 * @param {number} correspondentId - ID del corresponsal
 * @param {number} thirdPartyId - ID del tercero
 * @returns {Promise<any>} Respuesta con el resumen financiero
 */
export const getThirdPartyBalance = async (
  correspondentId: number,
  thirdPartyId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/third_party_balance_sheet.php?correspondent_id=${correspondentId}&third_party_id=${thirdPartyId}`;
    console.log("📡 Consultando movimientos con el tercero:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Movimientos del tercero recibidos:", data);

    return data;
  } catch (error) {
    console.error("❌ Error al obtener movimientos del tercero:", error);
    return {
      success: false,
      message: "No se pudo obtener el balance financiero del tercero.",
    };
  }
};

/**
 * Registra una transacción entre un corresponsal y un tercero.
 *
 * @param {Object} payload - Datos necesarios para la transacción.
 * @param {number} payload.id_cashier - ID del cajero.
 * @param {number} payload.id_cash - ID de la caja.
 * @param {number} payload.id_correspondent - ID del corresponsal.
 * @param {number} payload.transaction_type_id - ID del tipo de transacción.
 * @param {boolean} payload.polarity - True para ingreso, false para egreso.
 * @param {number} payload.cost - Monto de la transacción.
 * @param {number|string} payload.client_reference - ID del tercero asociado.
 * @param {string} payload.third_party_note - Código especial de transacción (ej. "debt-to-third-party").
 * @param {number} [payload.utility] - Utilidad opcional.
 * @returns {Promise<any>} Resultado de la operación.
 */
export const createThirdPartyTransaction = async (payload: {
  id_cashier: number;
  id_cash: number;
  id_correspondent: number;
  transaction_type_id: number;
  polarity: boolean;
  cost: number;
  client_reference: number | string;
  third_party_note: string;
  utility?: number;
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/new-third-party-transaction.php`;
    console.log("📡 Registrando transacción con tercero:", payload);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("✅ Resultado del registro:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al registrar transacción con tercero:", error);
    return {
      success: false,
      message: "Error al registrar la transacción con el tercero.",
    };
  }
};

/**
 * Registra una transacción de compensación ("clearing") entre un corresponsal y su caja.
 *
 * @param {Object} payload - Datos necesarios para la transacción.
 * @param {number} payload.id_cashier - ID del cajero.
 * @param {number} payload.id_cash - ID de la caja.
 * @param {number} payload.id_correspondent - ID del corresponsal.
 * @param {number} payload.transaction_type_id - ID del tipo de transacción.
 * @param {boolean} payload.polarity - True para ingreso, false para egreso.
 * @param {number} payload.cost - Monto de la transacción.
 * @param {number} [payload.utility] - Utilidad opcional.
 * @returns {Promise<any>} Resultado de la operación.
 */

export const createClearingTransaction = async (payload: {
  id_cashier: number;
  id_cash: number;
  id_correspondent: number;
  transaction_type_id: number;
  polarity: boolean;
  cost: number;
  utility?: number;
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/new_clearing_transaction.php`;
    console.log("📡 Registrando transacción de compensación:", payload);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("✅ Resultado de la compensación:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al registrar transacción de compensación:", error);
    return {
      success: false,
      message: "Error al registrar la transacción de compensación.",
    };
  }
};

/**
 * Registra una transacción de transferencia entre cajas.
 *
 * @param {Object} payload - Datos requeridos para la transferencia.
 * @param {number} payload.id_cashier - ID del cajero.
 * @param {number} payload.id_cash - ID de la caja actual (receptora).
 * @param {number} payload.id_correspondent - ID del corresponsal.
 * @param {number} payload.transaction_type_id - ID del tipo de transacción.
 * @param {boolean} payload.polarity - True para ingreso, false para egreso.
 * @param {number} payload.cost - Monto de la transacción.
 * @param {number} payload.box_reference - ID de la caja que envía la transferencia.
 * @param {boolean} [payload.utility] - Utilidad opcional.
 * @param {boolean} [payload.is_transfer] - Indica si es una transferencia (default: true).
 * @param {boolean} [payload.transfer_status] - Estado de la transferencia (false por defecto).
 * @returns {Promise<any>} Resultado del registro.
 */

export const createTransferTransaction = async (payload: {
  id_cashier: number;
  id_cash: number; // caja ORIGEN
  id_correspondent: number;
  transaction_type_id: number;
  polarity: boolean; // en transfer de salida, suele ser false
  cost: number;
  box_reference: number; // caja DESTINO
  utility?: number;
  is_transfer?: boolean;
  transfer_status?: boolean;
  cash_tag?: number; // 👈 NUEVO: saldo resultante de la caja ORIGEN
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/new_transfer_transaction.php`;
    console.log("📦 Registrando transferencia entre cajas:", payload);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        is_transfer: true, // forzado como antes
        transfer_status: false, // forzado como antes
        // cash_tag va incluido si vino en payload
      }),
    });

    const data = await response.json();
    console.log("✅ Resultado de la transferencia:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al registrar transferencia entre cajas:", error);
    return {
      success: false,
      message: "Error al registrar la transferencia entre cajas.",
    };
  }
};

/**
 * Acepta una transferencia pendiente desde otra caja.
 *
 * @param {number} transaction_id - ID de la transacción de transferencia a aceptar.
 * @returns {Promise<any>} Resultado de la operación.
 */
export const acceptTransferFromAnotherBank = async (
  transaction_id: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/accept_transfer_from_another_bank.php`;
    console.log("📥 Aceptando transferencia entrante:", transaction_id);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction_id }), // ← clave correcta
    });

    const data = await response.json();
    console.log("✅ Resultado de la aceptación:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al aceptar la transferencia:", error);
    return {
      success: false,
      message: "Error al aceptar la transferencia desde otra caja.",
    };
  }
};

/**
 * Cancela una transacción activa y guarda una nota de cancelación.
 *
 * @param {number} transaction_id - ID de la transacción a cancelar.
 * @param {string} cancellation_note - Nota personalizada para justificar la cancelación.
 * @returns {Promise<any>} Resultado de la operación.
 */
export const cancelTransactionById = async (
  transaction_id: number,
  cancellation_note: string
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/cancel_transfer.php`;
    console.log(
      "🛑 Cancelando transacción:",
      transaction_id,
      cancellation_note
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction_id,
        cancellation_note,
      }),
    });

    const data = await response.json();
    console.log("✅ Resultado de la cancelación:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al cancelar la transacción:", error);
    return {
      success: false,
      message: "Error al cancelar la transacción.",
    };
  }
};
