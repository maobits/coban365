import { baseUrl } from "../config/server";

export const getTransactionTypes = async (): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/list_transaction.php`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener los tipos de transacciones:", error);
    throw error;
  }
};

export const createTransactionType = async (transactionTypeData: {
  name: string;
  category: string;
  polarity: boolean;
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/create_transaction.php`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionTypeData),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al crear tipo de transacción:", error);
    throw error;
  }
};

export const updateTransactionType = async (transactionTypeData: {
  id: number;
  name: string;
  category: string;
  polarity: boolean;
}): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/update_transaction.php`;
    console.log("URL de actualización:", url);
    console.log("Datos enviados:", transactionTypeData);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionTypeData),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al actualizar tipo de transacción:", error);
    throw error;
  }
};

export const deleteTransactionType = async (
  transactionTypeId: number
): Promise<any> => {
  try {
    const url = `${baseUrl}/api/transactions/delete_transaction.php`;
    console.log("URL de eliminación:", url);
    console.log("ID a eliminar:", transactionTypeId);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: transactionTypeId }),
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al eliminar tipo de transacción:", error);
    throw error;
  }
};
