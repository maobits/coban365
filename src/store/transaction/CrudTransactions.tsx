import baseUrl from "../config/server"; // Importa la configuración del servidor

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
 * Elimina una transacción por ID.
 * @param transactionId - ID de la transacción a eliminar.
 */
export const deleteTransaction = async (
  transactionId: number
): Promise<any> => {
  try {
    const res = await fetch(
      `${baseUrl}/api/transactions/utils/delete_transaction.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: transactionId }),
      }
    );
    return await res.json();
  } catch (error) {
    console.error("❌ Error al eliminar transacción:", error);
    return { success: false, message: "Error al eliminar transacción." };
  }
};

/**
 * Servicio para obtener los tipos de transacciones permitidos para un corresponsal.
 *
 * @param {number} correspondentId - ID del corresponsal.
 * @returns {Promise<any>} Promesa que resuelve con los tipos de transacciones permitidas.
 */
export const getTransactionTypesByCorrespondent = async (
  correspondentId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/utils/types_correspondent_transactions.php?correspondent_id=${correspondentId}`;
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
