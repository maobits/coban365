// ============================================================================
//  BITSCORE · Servicio de descuento de comisión acumulada
//  ----------------------------------------------------------------------------
//  Este servicio llama al endpoint:
//    POST /api/transactions/utils/third_party_paymentcommission_table.php
//
//  Caso de uso:
//   - El tercero hace un pago ("charge_to_third_party").
//   - Ese pago cubre capital + parte (o toda) la comisión acumulada.
//   - Entonces restamos esa parte de la tabla third_party_commissions.
//
//  Autor: Mauricio Chara / Maobits
// ============================================================================

import { baseUrl } from "../config/server";

export interface PaymentCommissionPayload {
  third_party_id: number; // ID del tercero
  correspondent_id: number; // ID del corresponsal
  amount: number; // cuánto queremos descontar de las comisiones acumuladas
}

export interface PaymentCommissionSuccessData {
  third_party_id: number;
  correspondent_id: number;
  previous_total: number;
  discounted: number;
  new_total: number;
  timestamp: string;
}

export interface PaymentCommissionResponse {
  success: boolean;
  message: string;
  data?: PaymentCommissionSuccessData;
}

// Helper para armar errores con contexto útil
function contextualError(baseMessage: string, ctx: Record<string, unknown>) {
  return new Error(`${baseMessage}\nContext: ${JSON.stringify(ctx, null, 2)}`);
}

// Validaciones rápidas antes de ir al backend
function validateInput({
  third_party_id,
  correspondent_id,
  amount,
}: PaymentCommissionPayload) {
  if (
    !third_party_id ||
    third_party_id <= 0 ||
    !Number.isFinite(third_party_id)
  ) {
    throw contextualError("third_party_id inválido.", {
      third_party_id,
      correspondent_id,
      amount,
    });
  }

  if (
    !correspondent_id ||
    correspondent_id <= 0 ||
    !Number.isFinite(correspondent_id)
  ) {
    throw contextualError("correspondent_id inválido.", {
      third_party_id,
      correspondent_id,
      amount,
    });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw contextualError("amount inválido. Debe ser > 0.", {
      third_party_id,
      correspondent_id,
      amount,
    });
  }
}

// Logger pequeño y ordenado para debugging
function logCall(label: string, info: any) {
  // no rompas prod si console.groupCollapsed no existe en algún entorno raro
  if (console && console.groupCollapsed) {
    console.groupCollapsed(`💸 [CommissionPayment] ${label}`);
    console.table(info);
    console.groupEnd();
  } else {
    console.log(`💸 [CommissionPayment] ${label}`, info);
  }
}

/**
 * discountThirdPartyCommission
 * ------------------------------------------------------------------
 * Llama al endpoint PHP y descuenta (resta) parte de la comisión
 * acumulada en 'third_party_commissions' si hay saldo suficiente.
 *
 * Devuelve:
 *  {
 *    success: true,
 *    message: "...",
 *    data: {
 *      third_party_id,
 *      correspondent_id,
 *      previous_total,
 *      discounted,
 *      new_total,
 *      timestamp
 *    }
 *  }
 *
 * Lanza Error si:
 *  - IDs inválidos
 *  - amount <= 0
 *  - backend responde success = false
 *  - backend responde HTTP !200
 */
export async function discountThirdPartyCommission(
  payload: PaymentCommissionPayload,
  timeoutMs: number = 15000
): Promise<PaymentCommissionSuccessData> {
  validateInput(payload);

  const url = `${baseUrl}/api/transactions/utils/third_party_paymentcommission_table.php`;

  // AbortController para evitar fetch colgado
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    logCall("REQUEST → discountThirdPartyCommission", {
      url,
      body: payload,
    });

    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    let json: PaymentCommissionResponse | null = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    logCall("RESPONSE ← discountThirdPartyCommission", {
      status: res.status,
      raw: text,
      parsed: json,
    });

    // HTTP error tipo 400/500
    if (!res.ok) {
      throw contextualError("El servidor respondió con error HTTP.", {
        status: res.status,
        body: text,
        url,
        payload,
      });
    }

    // Backend respondió pero sin success
    if (!json || !json.success) {
      throw contextualError(
        json?.message || "El backend no pudo descontar la comisión acumulada.",
        {
          status: res.status,
          url,
          payload,
          backend: json,
        }
      );
    }

    // Éxito pero sin data estructurada
    if (!json.data) {
      throw contextualError(
        "Respuesta sin data. No se recibió el estado actualizado.",
        {
          status: res.status,
          url,
          payload,
          backend: json,
        }
      );
    }

    return json.data;
  } catch (err) {
    console.error("❌ discountThirdPartyCommission error:", err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
