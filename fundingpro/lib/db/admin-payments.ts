import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getPgPool, isLocalDatabaseEnabled } from "@/lib/pg-pool";
import {
  getPaymentIntegrationStatus,
  isPaymentsEnabled,
  isUzumCheckoutConfigured,
  isUzumMerchantConfigured,
} from "@/lib/payments";

export type AdminPaymentRow = {
  id: string;
  userEmail: string | null;
  planName: string | null;
  amountUsd: number;
  platformShareUsd: number | null;
  createdAt: string;
  status: string;
  serviceType: string;
  provider: string;
  providerRefId: string | null;
};

export type AdminPaymentsReport = {
  integrationStatus: string;
  paymentsEnabled: boolean;
  message: string;
  stats: {
    totalPayments: number;
    pendingPayments: number;
    subscriptionRequests: number;
  };
  commissionTiers: { range: string; platform: number; current?: boolean }[];
  payments: AdminPaymentRow[];
  subscriptionRequests: {
    id: string;
    subject: string;
    userEmail: string | null;
    status: string;
    createdAt: string;
  }[];
};

const COMMISSION_TIERS = [
  { range: "0–500", platform: 70 },
  { range: "500–1,500", platform: 72, current: true },
  { range: "1,500–5,000", platform: 75 },
  { range: "5,000–10,000", platform: 78 },
  { range: "10,000+", platform: 80 },
];

function platformShare(amount: number, pct = 72): number {
  return Math.round(amount * (pct / 100) * 100) / 100;
}

export async function getAdminPaymentsReport(): Promise<AdminPaymentsReport> {
  const integrationStatus = getPaymentIntegrationStatus();
  const paymentsEnabled = isPaymentsEnabled();
  const message = paymentsEnabled
    ? `Uzum Bank: Merchant ${isUzumMerchantConfigured() ? "✓" : "—"}, Checkout ${isUzumCheckoutConfigured() ? "✓" : "—"}.`
    : "Онлайн-оплата временно недоступна. Пользователи могут отправить запрос на подключение тарифа.";

  if (isLocalDatabaseEnabled()) {
    const pool = getPgPool();

    const paymentsResult = await pool.query(
      `SELECT p.id, p.amount_usd, p.status, p.service_type, p.created_at, p.metadata,
              p.provider, p.provider_ref_id,
              u.email AS user_email,
              pl.name_ru AS plan_name
       FROM payments p
       LEFT JOIN users u ON u.id = p.user_id
       LEFT JOIN subscriptions s ON s.id = p.subscription_id
       LEFT JOIN plans pl ON pl.id = s.plan_id
       ORDER BY p.created_at DESC
       LIMIT 50`
    );

    const requestsResult = await pool.query(
      `SELECT t.id, t.subject, t.status, t.created_at, u.email AS user_email
       FROM support_tickets t
       LEFT JOIN users u ON u.id = t.user_id
       WHERE t.subject ILIKE 'Запрос тарифа:%'
       ORDER BY t.created_at DESC
       LIMIT 30`
    );

    const countResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending
       FROM payments`
    );

    const payments = paymentsResult.rows.map((r) => {
      const amount = Number(r.amount_usd);
      return {
        id: String(r.id),
        userEmail: r.user_email ? String(r.user_email) : null,
        planName: r.plan_name ? String(r.plan_name) : null,
        amountUsd: amount,
        platformShareUsd: platformShare(amount),
        createdAt: new Date(String(r.created_at)).toISOString(),
        status: String(r.status),
        serviceType: String(r.service_type),
        provider: String(r.provider ?? "uzum"),
        providerRefId: r.provider_ref_id ? String(r.provider_ref_id) : null,
      };
    });

    const subscriptionRequests = requestsResult.rows.map((r) => ({
      id: String(r.id),
      subject: String(r.subject),
      userEmail: r.user_email ? String(r.user_email) : null,
      status: String(r.status),
      createdAt: new Date(String(r.created_at)).toISOString(),
    }));

    const stats = countResult.rows[0] ?? { total: 0, pending: 0 };

    return {
      integrationStatus,
      paymentsEnabled,
      message,
      stats: {
        totalPayments: Number(stats.total),
        pendingPayments: Number(stats.pending),
        subscriptionRequests: subscriptionRequests.length,
      },
      commissionTiers: COMMISSION_TIERS,
      payments,
      subscriptionRequests,
    };
  }

  const supabase = createSupabaseAdmin();
  const { data: paymentsData } = await supabase
    .from("payments")
    .select("id, amount_usd, status, service_type, created_at, metadata, provider, provider_ref_id, user:users ( email ), subscription:subscriptions ( plan:plans ( name_ru ) )")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: requestsData } = await supabase
    .from("support_tickets")
    .select("id, subject, status, created_at, user:users ( email )")
    .ilike("subject", "Запрос тарифа:%")
    .order("created_at", { ascending: false })
    .limit(30);

  const { count: totalPayments } = await supabase.from("payments").select("*", { count: "exact", head: true });
  const { count: pendingPayments } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING");

  const payments: AdminPaymentRow[] = (paymentsData ?? []).map((p) => {
    const user = p.user as unknown as { email: string | null } | null;
    const sub = p.subscription as unknown as { plan: { name_ru: string } | null } | null;
    const amount = Number(p.amount_usd);
    return {
      id: p.id,
      userEmail: user?.email ?? null,
      planName: sub?.plan?.name_ru ?? null,
      amountUsd: amount,
      platformShareUsd: platformShare(amount),
      createdAt: p.created_at,
      status: p.status,
      serviceType: p.service_type,
      provider: String(p.provider ?? "uzum"),
      providerRefId: p.provider_ref_id ?? null,
    };
  });

  const subscriptionRequests = (requestsData ?? []).map((t) => {
    const user = t.user as unknown as { email: string | null } | null;
    return {
      id: t.id,
      subject: t.subject,
      userEmail: user?.email ?? null,
      status: t.status,
      createdAt: t.created_at,
    };
  });

  return {
    integrationStatus,
    paymentsEnabled,
    message,
    stats: {
      totalPayments: totalPayments ?? 0,
      pendingPayments: pendingPayments ?? 0,
      subscriptionRequests: subscriptionRequests.length,
    },
    commissionTiers: COMMISSION_TIERS,
    payments,
    subscriptionRequests,
  };
}
