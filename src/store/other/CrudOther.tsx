// src/store/other/CrudOther.ts
import { baseUrl } from "../config/server";

/* =========================================================================
 * CRUD BÁSICO DE TERCEROS (OTHERS)
 * ========================================================================= */

export const listOthersByCorrespondent = async (
  correspondentId: number
): Promise<any> => {
  const url = `${baseUrl}/api/other/list_other_correspondent_id.php?correspondent_id=${correspondentId}`;
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Error en la solicitud: ${response.statusText}\nContext: { url: "${url}", correspondentId: ${correspondentId} }`
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error al obtener los terceros:", error);
    // re-lanzamos agregando contexto
    throw new Error(
      `${
        error?.message || error
      }\nContext: { fn: "listOthersByCorrespondent", correspondentId: ${correspondentId}, url: "${url}" }`
    );
  }
};

export const createOther = async (otherData: {
  correspondent_id: number;
  name: string;
  credit: number;
  balance: number;
  negative_balance: boolean;
  id_type?: string;
  id_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  state?: number;
}): Promise<any> => {
  const url = `${baseUrl}/api/other/create_other.php`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(otherData),
    });

    if (!response.ok) {
      throw new Error(
        `Error al crear el tercero: ${
          response.statusText
        }\nContext: { url: "${url}", payload: ${JSON.stringify(otherData)} }`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        `${
          data.message || "No se pudo registrar el tercero."
        }\nContext: { url: "${url}", payload: ${JSON.stringify(otherData)} }`
      );
    }

    return data;
  } catch (error: any) {
    console.error("❌ Error al crear tercero:", error);
    throw new Error(
      `${
        error?.message || error
      }\nContext: { fn: "createOther", url: "${url}", payload: ${JSON.stringify(
        otherData
      )} }`
    );
  }
};

export const updateOther = async (otherData: {
  id: number;
  correspondent_id: number;
  name: string;
  credit: number;
  balance: number;
  state: number;
  negative_balance: boolean;
  id_type?: string;
  id_number?: string;
  email?: string;
  phone?: string;
  address?: string;
}): Promise<any> => {
  const url = `${baseUrl}/api/other/update_other.php`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(otherData),
    });

    if (!response.ok) {
      throw new Error(
        `Error al actualizar tercero: ${
          response.statusText
        }\nContext: { url: "${url}", payload: ${JSON.stringify(otherData)} }`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        `${
          data.message || "No se pudo actualizar el tercero."
        }\nContext: { url: "${url}", payload: ${JSON.stringify(otherData)} }`
      );
    }

    return data;
  } catch (error: any) {
    console.error("❌ Error al actualizar tercero:", error);
    throw new Error(
      `${
        error?.message || error
      }\nContext: { fn: "updateOther", url: "${url}", payload: ${JSON.stringify(
        otherData
      )} }`
    );
  }
};

export const deleteOther = async (id: number): Promise<any> => {
  const url = `${baseUrl}/api/other/delete_other.php`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(
        `Error al eliminar tercero: ${response.statusText}\nContext: { url: "${url}", id: ${id} }`
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error al eliminar tercero:", error);
    throw new Error(
      `${
        error?.message || error
      }\nContext: { fn: "deleteOther", url: "${url}", id: ${id} }`
    );
  }
};

export const updateOtherState = async (
  id: number,
  state: number
): Promise<any> => {
  const url = `${baseUrl}/api/other/update_other_state.php`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, state }),
    });

    if (!response.ok) {
      throw new Error(
        `Error al actualizar estado: ${response.statusText}\nContext: { url: "${url}", id: ${id}, state: ${state} }`
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error al actualizar estado del tercero:", error);
    throw new Error(
      `${
        error?.message || error
      }\nContext: { fn: "updateOtherState", url: "${url}", id: ${id}, state: ${state} }`
    );
  }
};

export const listOtherAccountStatement = async (
  correspondentId: number
): Promise<any> => {
  const url = `${baseUrl}/api/other/utils/other_account_statement.php?correspondent_id=${correspondentId}`;
  if (!correspondentId || correspondentId <= 0) {
    throw new Error(
      `ID del corresponsal inválido.\nContext: { fn: "listOtherAccountStatement", correspondentId: ${correspondentId} }`
    );
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Error en la solicitud: ${response.statusText}\nContext: { url: "${url}", correspondentId: ${correspondentId} }`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        `${
          data.message || "Error desconocido al obtener la información."
        }\nContext: { url: "${url}", correspondentId: ${correspondentId} }`
      );
    }

    return data.data;
  } catch (error: any) {
    console.error("❌ Error al obtener estados de cuenta de terceros:", error);
    throw new Error(
      `${
        error?.message || error
      }\nContext: { fn: "listOtherAccountStatement", url: "${url}", correspondentId: ${correspondentId} }`
    );
  }
};

// ===============================
// Info detallada de UN tercero
// ===============================

export interface ThirdPartyInfoResponse {
  success: boolean;
  data: {
    third: {
      id: number;
      correspondent_id: number;
      name: string;
      id_type: string | null;
      id_number: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      credit: number;
      balance_local: number;
      negative_balance: number;
      state: number;
      created_at: string | null;
      updated_at: string | null;
    };
    statement_totals: {
      total_receivable: number;
      total_to_pay: number;
      balance: number;
    };
    movements: Array<{
      id: number;
      id_third: number;
      account_receivable: number;
      account_to_pay: number;
      description: string | null;
      created_at: string;
      state: number;
    }>;
    filters: {
      by: "third_id" | "id_number";
      third_id: number;
      id_number: string | null;
      date_from: string | null;
      date_to: string | null;
      limit: number;
    };
  };
}

type GetThirdPartyInfoParams = {
  thirdId?: number;
  idNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  timeoutMs?: number;
};

export const getThirdPartyInfo = async (
  params: GetThirdPartyInfoParams
): Promise<ThirdPartyInfoResponse["data"]> => {
  const {
    thirdId,
    idNumber,
    dateFrom,
    dateTo,
    limit,
    timeoutMs = 20000,
  } = params;

  if (!thirdId && !idNumber) {
    throw new Error(
      `Debes enviar thirdId o idNumber.\nContext: ${JSON.stringify(params)}`
    );
  }

  const isValidDate = (d?: string) => !d || /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (!isValidDate(dateFrom) || !isValidDate(dateTo)) {
    throw new Error(`Formato de fecha inválido. Use YYYY-MM-DD.`);
  }

  const qs = new URLSearchParams();
  if (thirdId) qs.set("third_id", String(thirdId));
  if (!thirdId && idNumber) qs.set("id_number", idNumber.trim());
  if (dateFrom) qs.set("date_from", dateFrom);
  if (dateTo) qs.set("date_to", dateTo);
  if (typeof limit === "number") qs.set("limit", String(Math.max(1, limit)));

  const url = `${baseUrl}/api/other/utils/third_party_info.php?${qs.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      let body: any;
      try {
        body = await res.json();
      } catch {
        body = await res.text().catch(() => undefined);
      }
      throw new Error(
        `HTTP ${res.status} ${res.statusText}\nBody: ${JSON.stringify(
          body
        )}\nURL: ${url}`
      );
    }
    const payload = (await res.json()) as ThirdPartyInfoResponse;
    if (!payload?.success) {
      const msg = (payload as any)?.message || "Error desconocido";
      const received = (payload as any)?.received;
      throw new Error(
        `${msg}\nReceived: ${JSON.stringify(received)}\nURL: ${url}`
      );
    }
    return payload.data;
  } finally {
    clearTimeout(timer);
  }
};
