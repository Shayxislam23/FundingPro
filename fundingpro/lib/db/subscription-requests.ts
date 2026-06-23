import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createPaymentRequest } from "@/lib/payments";

export type SubscriptionRequestInput = {
  userId: string;
  email: string | null;
  planId: string;
  planName: string;
  amountUsd: number;
};

export async function createSubscriptionRequest(input: SubscriptionRequestInput) {
  const subscriptionId = crypto.randomUUID();
  const paymentId = crypto.randomUUID();
  const idempotencyKey = `sub-req-${input.userId}-${input.planId}-${Date.now()}`;
  const ticketSubject = `Запрос тарифа: ${input.planName}`;
  const ticketMessage = [
    `План: ${input.planName} (${input.planId})`,
    `Сумма: $${input.amountUsd}/мес`,
    `Email: ${input.email ?? "—"}`,
    "",
    "Статус оплаты: pending_integration — онлайн-оплата пока недоступна.",
    "Подписка НЕ активирована автоматически.",
  ].join("\n");

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO subscriptions (id, user_id, plan_id, status)
       VALUES ($1::uuid, $2::uuid, $3, 'PENDING')`,
      [subscriptionId, input.userId, input.planId]
    );
    await pool.query(
      `INSERT INTO payments (id, user_id, subscription_id, amount_usd, status, provider, idempotency_key, service_type, metadata)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'PENDING', 'payment_provider', $5, 'subscription', $6::jsonb)`,
      [
        paymentId,
        input.userId,
        subscriptionId,
        input.amountUsd,
        idempotencyKey,
        JSON.stringify({ planId: input.planId, planName: input.planName, integrationStatus: "pending_integration" }),
      ]
    );
    await pool.query(
      `INSERT INTO support_tickets (user_id, subject, message, status, priority)
       VALUES ($1::uuid, $2, $3, 'open', 'normal')`,
      [input.userId, ticketSubject, ticketMessage]
    );
  } else {
    const supabase = createSupabaseAdmin();
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
      status: "PENDING",
      provider: "payment_provider",
      idempotency_key: idempotencyKey,
      service_type: "subscription",
      metadata: { planId: input.planId, planName: input.planName, integrationStatus: "pending_integration" },
    });
    await supabase.from("support_tickets").insert({
      user_id: input.userId,
      subject: ticketSubject,
      message: ticketMessage,
      status: "open",
      priority: "normal",
    });
  }

  const payment = createPaymentRequest({
    userId: input.userId,
    amountUsd: input.amountUsd,
    serviceType: "subscription",
    idempotencyKey,
  });

  return {
    subscriptionRequestId: subscriptionId,
    paymentId,
    status: "PENDING",
    payment,
  };
}

export async function getPlanPriceUsd(planId: string): Promise<number | null> {
  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();
    const result = await pool.query(`SELECT price_usd FROM plans WHERE id = $1`, [planId]);
    if (!result.rows[0]) return null;
    return Number(result.rows[0].price_usd);
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("plans").select("price_usd").eq("id", planId).single();
  if (error || !data) return null;
  return Number(data.price_usd);
}
