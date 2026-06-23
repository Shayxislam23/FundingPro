import { withDatabase } from "@/lib/db/runtime";
import type { UzumTransactionState } from "@/lib/payments/types";

export type PaymentRecord = {
  id: string;
  userId: string;
  subscriptionId: string | null;
  amountUsd: number;
  amountTiyin: number;
  currency: string;
  status: string;
  provider: string;
  providerRefId: string | null;
  idempotencyKey: string;
  serviceType: string;
  metadata: Record<string, unknown>;
};

export type UzumTransactionRecord = {
  transId: string;
  paymentId: string;
  serviceId: string;
  state: UzumTransactionState;
  amountTiyin: number;
  createTime: string | null;
  confirmTime: string | null;
  reverseTime: string | null;
};

function mapPayment(row: Record<string, unknown>): PaymentRecord {
  const meta = row.metadata;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
    amountUsd: Number(row.amount_usd),
    amountTiyin: Number((meta as Record<string, unknown>)?.amountTiyin ?? 0),
    currency: String(row.currency ?? "USD"),
    status: String(row.status),
    provider: String(row.provider),
    providerRefId: row.provider_ref_id ? String(row.provider_ref_id) : null,
    idempotencyKey: String(row.idempotency_key),
    serviceType: String(row.service_type),
    metadata: (meta && typeof meta === "object" ? meta : {}) as Record<string, unknown>,
  };
}

export async function getPlanPricing(planId: string): Promise<{
  priceUsd: number;
  priceUzs: number;
  nameRu: string;
} | null> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT price_usd, price_uzs, name_ru FROM plans WHERE id = $1 AND is_active = true`,
        [planId]
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        priceUsd: Number(row.price_usd),
        priceUzs: Number(row.price_uzs ?? 0),
        nameRu: String(row.name_ru ?? row.name ?? planId),
      };
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("plans")
        .select("price_usd, price_uzs, name_ru, name")
        .eq("id", planId)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) return null;
      return {
        priceUsd: Number(data.price_usd),
        priceUzs: Number(data.price_uzs ?? 0),
        nameRu: String(data.name_ru ?? data.name ?? planId),
      };
    }
  );
}

export async function createPaymentIntent(input: {
  userId: string;
  planId: string;
  planName: string;
  amountUsd: number;
  amountUzs: number;
  amountTiyin: number;
}): Promise<{ paymentId: string; subscriptionId: string }> {
  const paymentId = crypto.randomUUID();
  const subscriptionId = crypto.randomUUID();
  const idempotencyKey = `intent-${input.userId}-${input.planId}-${Date.now()}`;
  const metadata = {
    planId: input.planId,
    planName: input.planName,
    amountUzs: input.amountUzs,
    amountTiyin: input.amountTiyin,
  };

  return withDatabase(
    async (pool) => {
      await pool.query(
        `INSERT INTO subscriptions (id, user_id, plan_id, status)
         VALUES ($1::uuid, $2::uuid, $3, 'PENDING')`,
        [subscriptionId, input.userId, input.planId]
      );
      await pool.query(
        `INSERT INTO payments (id, user_id, subscription_id, amount_usd, currency, status, provider, idempotency_key, service_type, metadata)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'UZS', 'PENDING', 'uzum', $5, 'subscription', $6::jsonb)`,
        [
          paymentId,
          input.userId,
          subscriptionId,
          input.amountUsd,
          idempotencyKey,
          JSON.stringify(metadata),
        ]
      );
      return { paymentId, subscriptionId };
    },
    async (supabase) => {
      await supabase.from("subscriptions").insert({
        id: subscriptionId,
        user_id: input.userId,
        plan_id: input.planId,
        status: "PENDING",
      });
      await supabase.from("payments").insert({
        id: paymentId,
        user_id: input.userId,
        subscription_id: subscriptionId,
        amount_usd: input.amountUsd,
        currency: "UZS",
        status: "PENDING",
        provider: "uzum",
        idempotency_key: idempotencyKey,
        service_type: "subscription",
        metadata,
      });

      return { paymentId, subscriptionId };
    }
  );
}

export async function getPaymentById(paymentId: string): Promise<PaymentRecord | null> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(`SELECT * FROM payments WHERE id = $1::uuid`, [paymentId]);
      if (!result.rows[0]) return null;
      return mapPayment(result.rows[0] as Record<string, unknown>);
    },
    async (supabase) => {
      const { data } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
      if (!data) return null;
      return mapPayment(data as Record<string, unknown>);
    }
  );
}

export function resolvePaymentIdFromParams(params?: {
  account?: string | number;
  orderId?: string | number;
  order_id?: string | number;
}): string | null {
  if (!params) return null;
  const raw = params.account ?? params.orderId ?? params.order_id;
  if (raw === undefined || raw === null) return null;
  return String(raw);
}

export async function insertPaymentEvent(
  paymentId: string,
  eventType: string,
  payload: Record<string, unknown>,
  source = "uzum_webhook"
): Promise<void> {
  return withDatabase(
    async (pool) => {
      await pool.query(
        `INSERT INTO payment_events (payment_id, event_type, payload, source)
         VALUES ($1::uuid, $2, $3::jsonb, $4)`,
        [paymentId, eventType, JSON.stringify(payload), source]
      );
    },
    async (supabase) => {
      await supabase.from("payment_events").insert({
        payment_id: paymentId,
        event_type: eventType,
        payload,
        source,
      });
    }
  );
}

export async function getUzumTransaction(transId: string): Promise<UzumTransactionRecord | null> {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(`SELECT * FROM uzum_transactions WHERE trans_id = $1`, [transId]);
      const row = result.rows[0];
      if (!row) return null;
      return {
        transId: String(row.trans_id),
        paymentId: String(row.payment_id),
        serviceId: String(row.service_id),
        state: String(row.state) as UzumTransactionState,
        amountTiyin: Number(row.amount_tiyin),
        createTime: row.create_time ? String(row.create_time) : null,
        confirmTime: row.confirm_time ? String(row.confirm_time) : null,
        reverseTime: row.reverse_time ? String(row.reverse_time) : null,
      };
    },
    async (supabase) => {
      const { data } = await supabase.from("uzum_transactions").select("*").eq("trans_id", transId).maybeSingle();
      if (!data) return null;
      return {
        transId: String(data.trans_id),
        paymentId: String(data.payment_id),
        serviceId: String(data.service_id),
        state: String(data.state) as UzumTransactionState,
        amountTiyin: Number(data.amount_tiyin),
        createTime: data.create_time ? String(data.create_time) : null,
        confirmTime: data.confirm_time ? String(data.confirm_time) : null,
        reverseTime: data.reverse_time ? String(data.reverse_time) : null,
      };
    }
  );
}

export async function upsertUzumTransaction(input: {
  transId: string;
  paymentId: string;
  serviceId: string;
  state: UzumTransactionState;
  amountTiyin: number;
  createTime?: string;
  confirmTime?: string;
  reverseTime?: string;
}): Promise<void> {
  return withDatabase(
    async (pool) => {
      await pool.query(
        `INSERT INTO uzum_transactions (trans_id, payment_id, service_id, state, amount_tiyin, create_time, confirm_time, reverse_time)
         VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (trans_id) DO UPDATE SET
           state = EXCLUDED.state,
           confirm_time = COALESCE(EXCLUDED.confirm_time, uzum_transactions.confirm_time),
           reverse_time = COALESCE(EXCLUDED.reverse_time, uzum_transactions.reverse_time),
           updated_at = now()`,
        [
          input.transId,
          input.paymentId,
          input.serviceId,
          input.state,
          input.amountTiyin,
          input.createTime ?? null,
          input.confirmTime ?? null,
          input.reverseTime ?? null,
        ]
      );
    },
    async (supabase) => {
      await supabase.from("uzum_transactions").upsert({
        trans_id: input.transId,
        payment_id: input.paymentId,
        service_id: input.serviceId,
        state: input.state,
        amount_tiyin: input.amountTiyin,
        create_time: input.createTime ?? null,
        confirm_time: input.confirmTime ?? null,
        reverse_time: input.reverseTime ?? null,
        updated_at: new Date().toISOString(),
      });
    }
  );
}

export async function updatePaymentProviderRef(
  paymentId: string,
  providerRefId: string,
  extraMetadata?: Record<string, unknown>
): Promise<void> {
  return withDatabase(
    async (pool) => {
      if (extraMetadata) {
        await pool.query(
          `UPDATE payments SET provider_ref_id = $2, metadata = metadata || $3::jsonb, updated_at = now()
           WHERE id = $1::uuid`,
          [paymentId, providerRefId, JSON.stringify(extraMetadata)]
        );
      } else {
        await pool.query(
          `UPDATE payments SET provider_ref_id = $2, updated_at = now() WHERE id = $1::uuid`,
          [paymentId, providerRefId]
        );
      }
    },
    async (supabase) => {
      const { data: existing } = await supabase.from("payments").select("metadata").eq("id", paymentId).single();
      const metadata = {
        ...((existing?.metadata as Record<string, unknown>) ?? {}),
        ...(extraMetadata ?? {}),
      };
      await supabase
        .from("payments")
        .update({ provider_ref_id: providerRefId, metadata, updated_at: new Date().toISOString() })
        .eq("id", paymentId);
    }
  );
}

export async function setPaymentStatus(
  paymentId: string,
  status: string,
  activatedAt?: Date
): Promise<void> {
  return withDatabase(
    async (pool) => {
      await pool.query(
        `UPDATE payments SET status = $2, activated_at = COALESCE($3, activated_at), updated_at = now()
         WHERE id = $1::uuid`,
        [paymentId, status, activatedAt?.toISOString() ?? null]
      );
    },
    async (supabase) => {
      await supabase
        .from("payments")
        .update({
          status,
          activated_at: activatedAt?.toISOString() ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);
    }
  );
}

export async function activateSubscriptionForPayment(paymentId: string): Promise<void> {
  const payment = await getPaymentById(paymentId);
  if (!payment?.subscriptionId) return;

  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);

  return withDatabase(
    async (pool) => {
      await pool.query(
        `UPDATE subscriptions SET status = 'ACTIVE', start_date = $2, end_date = $3, updated_at = now()
         WHERE id = $1::uuid`,
        [payment.subscriptionId, now.toISOString(), end.toISOString()]
      );
      await pool.query(
        `UPDATE payments SET status = 'SUCCESS', activated_at = $2, updated_at = now() WHERE id = $1::uuid`,
        [paymentId, now.toISOString()]
      );
    },
    async (supabase) => {
      await supabase
        .from("subscriptions")
        .update({
          status: "ACTIVE",
          start_date: now.toISOString(),
          end_date: end.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", payment.subscriptionId);
      await supabase
        .from("payments")
        .update({ status: "SUCCESS", activated_at: now.toISOString(), updated_at: now.toISOString() })
        .eq("id", paymentId);
    }
  );
}

export async function reverseSubscriptionForPayment(paymentId: string): Promise<void> {
  const payment = await getPaymentById(paymentId);
  if (!payment?.subscriptionId) return;

  return withDatabase(
    async (pool) => {
      await pool.query(
        `UPDATE subscriptions SET status = 'CANCELLED', cancelled_at = now(), updated_at = now()
         WHERE id = $1::uuid`,
        [payment.subscriptionId]
      );
      await pool.query(
        `UPDATE payments SET status = 'REVERSED', updated_at = now() WHERE id = $1::uuid`,
        [paymentId]
      );
    },
    async (supabase) => {
      await supabase
        .from("subscriptions")
        .update({ status: "CANCELLED", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", payment.subscriptionId);
      await supabase.from("payments").update({ status: "REVERSED", updated_at: new Date().toISOString() }).eq("id", paymentId);
    }
  );
}
