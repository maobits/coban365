// Ajusta baseUrl si lo tienes en otro archivo
import { baseUrl } from "../config/server";

export async function fetchTotalCommissionByCorrespondent(
  correspondentId: number,
  timeoutMs = 15000
): Promise<number> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // GET /api/transactions/utils/third_party_commissions.php?action=sum_total&correspondent_id=ID
    const url = `${baseUrl}/api/transactions/utils/third_party_commissions.php?action=sum_total&correspondent_id=${correspondentId}`;
    const res = await fetch(url, { signal: controller.signal });
    const payload = await res.json().catch(() => ({} as any));

    if (!res.ok || !payload?.success) {
      throw new Error(
        payload?.message || "No se pudo obtener el total de comisiones."
      );
    }

    const total = Number(payload?.data?.total_commission ?? 0);
    if (!Number.isFinite(total))
      throw new Error("Respuesta inválida del servicio de comisiones.");
    return total;
  } finally {
    clearTimeout(t);
  }
}
