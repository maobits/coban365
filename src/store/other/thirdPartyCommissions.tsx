// ============================================================================
//  Maobits · BITSCORE / Comisión de Terceros
//  ----------------------------------------------------------------------------
//  CRUD seguro para manejar las comisiones acumuladas entre terceros y
//  corresponsales. Incluye logging detallado para depuración.
// ============================================================================

import { baseUrl } from "../config/server";

/* =========================================================================
 * Tipos
 * ========================================================================= */

export interface ThirdPartyCommissionRecord {
  id: number;
  third_party_id: number;
  correspondent_id: number;
  total_commission: number;
  last_update: string;
}

export interface ThirdPartyCommissionAPIResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: ThirdPartyCommissionRecord;
  details?: any;
}

/* =========================================================================
 * Utils internos
 * ========================================================================= */

function buildContextError(
  baseMessage: string,
  ctx: Record<string, unknown>
): Error {
  return new Error(`${baseMessage}\nContext: ${JSON.stringify(ctx, null, 2)}`);
}

function validateIds(thirdId: number, correspondentId: number) {
  if (!thirdId || thirdId <= 0 || !Number.isFinite(thirdId)) {
    throw buildContextError("third_party_id inválido.", {
      fn: "validateIds",
      thirdId,
      correspondentId,
    });
  }
  if (
    !correspondentId ||
    correspondentId <= 0 ||
    !Number.isFinite(correspondentId)
  ) {
    throw buildContextError("correspondent_id inválido.", {
      fn: "validateIds",
      thirdId,
      correspondentId,
    });
  }
}

function validateAmount(amount: number, { canBeZero = false } = {}) {
  if (!Number.isFinite(amount)) {
    throw buildContextError("amount debe ser numérico.", {
      fn: "validateAmount",
      amount,
    });
  }
  if (canBeZero ? amount < 0 : amount <= 0) {
    throw buildContextError(`amount inválido (valor: ${amount})`, {
      fn: "validateAmount",
      amount,
    });
  }
}

// arriba, junto a otros imports (no necesita nuevas libs)
const normalizeText = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// estado para total de comisiones acumuladas del corresponsal
const [accumulatedCommissions, setAccumulatedCommissions] = useState<
  number | null
>(null);

/* =========================================================================
 * LOG UTILITY
 * ========================================================================= */
function logApi(label: string, info: any) {
  console.groupCollapsed(`🧾 [ThirdPartyCommission] ${label}`);
  console.table(info);
  console.groupEnd();
}

/* =========================================================================
 * GET (lee o crea si no existe)
 * ========================================================================= */
export const getThirdPartyCommission = async (params: {
  thirdId: number;
  correspondentId: number;
  timeoutMs?: number;
}): Promise<ThirdPartyCommissionRecord> => {
  const { thirdId, correspondentId, timeoutMs = 15000 } = params;
  validateIds(thirdId, correspondentId);

  const qs = new URLSearchParams({
    action: "get",
    third_party_id: String(thirdId),
    correspondent_id: String(correspondentId),
  });

  const url = `${baseUrl}/api/transactions/utils/third_party_commissions.php?${qs.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const payload = (await res
      .json()
      .catch(() => ({}))) as ThirdPartyCommissionAPIResponse;

    logApi("GET commission → response", { status: res.status, url, payload });

    if (!res.ok || !payload.success || !payload.data) {
      throw buildContextError(
        payload.message || payload.error || "No se pudo obtener la comisión.",
        {
          fn: "getThirdPartyCommission",
          status: res.status,
          url,
          payload,
        }
      );
    }

    return payload.data;
  } catch (err) {
    console.error("❌ Error en getThirdPartyCommission:", err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

/* =========================================================================
 * ADD (sumar comisión)
 * ========================================================================= */
export const addThirdPartyCommission = async (params: {
  thirdId: number;
  correspondentId: number;
  amount: number;
}): Promise<ThirdPartyCommissionRecord> => {
  const { thirdId, correspondentId, amount } = params;
  validateIds(thirdId, correspondentId);
  validateAmount(amount);

  const url = `${baseUrl}/api/transactions/utils/third_party_commissions.php?action=add`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        third_party_id: thirdId,
        correspondent_id: correspondentId,
        amount,
      }),
    });

    const payload = (await res
      .json()
      .catch(() => ({}))) as ThirdPartyCommissionAPIResponse;

    logApi("ADD commission → response", { status: res.status, url, payload });

    if (!res.ok || !payload.success || !payload.data) {
      throw buildContextError(
        payload.message ||
          payload.error ||
          "No se pudo incrementar la comisión.",
        {
          fn: "addThirdPartyCommission",
          status: res.status,
          url,
          payload,
        }
      );
    }

    return payload.data;
  } catch (err) {
    console.error("❌ Error en addThirdPartyCommission:", err);
    throw err;
  }
};

/* =========================================================================
 * SUBTRACT (restar comisión si hay saldo suficiente)
 * ========================================================================= */
export const subtractThirdPartyCommission = async (params: {
  thirdId: number;
  correspondentId: number;
  amount: number;
}): Promise<ThirdPartyCommissionRecord> => {
  const { thirdId, correspondentId, amount } = params;
  validateIds(thirdId, correspondentId);
  validateAmount(amount);

  const url = `${baseUrl}/api/transactions/utils/third_party_commissions.php?action=subtract`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        third_party_id: thirdId,
        correspondent_id: correspondentId,
        amount,
      }),
    });

    const text = await res.text();
    let payload: ThirdPartyCommissionAPIResponse | null = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }

    logApi("SUBTRACT commission → response", {
      status: res.status,
      url,
      payload,
    });

    if (!res.ok) {
      console.warn(
        "⚠️ No se pudo descontar comisión (posibles fondos insuficientes)."
      );
      throw buildContextError("Error al restar comisión.", {
        fn: "subtractThirdPartyCommission",
        status: res.status,
        body: text,
        url,
        params,
      });
    }

    if (!payload || !payload.success || !payload.data) {
      throw buildContextError(
        payload?.message ||
          payload?.error ||
          "No se pudo descontar la comisión.",
        {
          fn: "subtractThirdPartyCommission",
          url,
          payload,
        }
      );
    }

    return payload.data;
  } catch (err) {
    console.error("❌ Error en subtractThirdPartyCommission:", err);
    throw err;
  }
};

/* =========================================================================
 * SET (forzar valor exacto)
 * ========================================================================= */
export const setThirdPartyCommission = async (params: {
  thirdId: number;
  correspondentId: number;
  amount: number;
}): Promise<ThirdPartyCommissionRecord> => {
  const { thirdId, correspondentId, amount } = params;
  validateIds(thirdId, correspondentId);
  validateAmount(amount, { canBeZero: true });

  const url = `${baseUrl}/api/transactions/utils/third_party_commissions.php?action=set`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        third_party_id: thirdId,
        correspondent_id: correspondentId,
        amount,
      }),
    });

    const payload = (await res
      .json()
      .catch(() => ({}))) as ThirdPartyCommissionAPIResponse;

    logApi("SET commission → response", { status: res.status, url, payload });

    if (!res.ok || !payload.success || !payload.data) {
      throw buildContextError(
        payload.message ||
          payload.error ||
          "No se pudo actualizar la comisión.",
        {
          fn: "setThirdPartyCommission",
          status: res.status,
          url,
          payload,
        }
      );
    }

    return payload.data;
  } catch (err) {
    console.error("❌ Error en setThirdPartyCommission:", err);
    throw err;
  }
};

/* =========================================================================
 * DELETE (eliminar relación)
 * ========================================================================= */
export const deleteThirdPartyCommission = async (params: {
  thirdId: number;
  correspondentId: number;
}): Promise<{ success: boolean; message?: string }> => {
  const { thirdId, correspondentId } = params;
  validateIds(thirdId, correspondentId);

  const url = `${baseUrl}/api/transactions/utils/third_party_commissions.php?action=delete`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        third_party_id: thirdId,
        correspondent_id: correspondentId,
      }),
    });

    const payload = (await res
      .json()
      .catch(() => ({}))) as ThirdPartyCommissionAPIResponse;
    logApi("DELETE commission → response", {
      status: res.status,
      url,
      payload,
    });

    if (!res.ok || !payload.success) {
      throw buildContextError(
        payload.message || payload.error || "No se pudo eliminar la comisión.",
        {
          fn: "deleteThirdPartyCommission",
          status: res.status,
          url,
          payload,
        }
      );
    }

    return { success: true, message: payload.message };
  } catch (err) {
    console.error("❌ Error en deleteThirdPartyCommission:", err);
    throw err;
  }
};
