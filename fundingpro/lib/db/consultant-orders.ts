import { withDatabase } from "@/lib/db/runtime";
import { ensureInternalUser } from "@/lib/db/users";

export type ConsultantOrderInput = {
  userId: string;
  email: string | null;
  consultantId: string;
  packageName: string;
  amountUsd: number;
  notes?: string;
};

export async function createConsultantOrder(input: ConsultantOrderInput) {
  const orderId = crypto.randomUUID();

  await withDatabase(
    async (pool) => {
      await pool.query(
        `INSERT INTO consultant_orders (id, client_user_id, consultant_id, package_name, amount_usd, status, notes)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, 'PENDING', $6)`,
        [orderId, input.userId, input.consultantId, input.packageName, input.amountUsd, input.notes ?? null]
      );
    },
    async (supabase) => {
      const { error } = await supabase.from("consultant_orders").insert({
        id: orderId,
        client_user_id: input.userId,
        consultant_id: input.consultantId,
        package_name: input.packageName,
        amount_usd: input.amountUsd,
        status: "PENDING",
        notes: input.notes ?? null,
      });
      if (error && error.code !== "42P01") throw new Error(error.message);
    }
  );

  // Notify admin via support ticket
  const ticketSubject = `Заказ консультации: ${input.packageName}`;
  const ticketMessage = [
    `Консультант ID: ${input.consultantId}`,
    `Пакет: ${input.packageName}`,
    `Сумма: $${input.amountUsd}`,
    input.notes ? `Комментарий: ${input.notes}` : "",
    "",
    "Статус оплаты: pending_integration — онлайн-оплата пока недоступна.",
  ]
    .filter(Boolean)
    .join("\n");

  await withDatabase(
    async (pool) => {
      await pool.query(
        `INSERT INTO support_tickets (user_id, subject, message, status, priority)
         VALUES ($1::uuid, $2, $3, 'open', 'normal')`,
        [input.userId, ticketSubject, ticketMessage]
      );
    },
    async (supabase) => {
      await supabase.from("support_tickets").insert({
        user_id: input.userId,
        subject: ticketSubject,
        message: ticketMessage,
        status: "open",
        priority: "normal",
      });
    }
  );

  return {
    orderId,
    status: "PENDING",
    payment: {
      integrationStatus: "pending_integration",
      paymentsEnabled: false,
      message:
        "Онлайн-оплата временно недоступна. Запрос отправлен — команда FundingPro свяжется с вами для подтверждения.",
    },
  };
}

export async function listUserConsultantOrders(userId: string) {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT o.id, o.package_name, o.amount_usd, o.status, o.created_at,
                c.full_name AS consultant_name
         FROM consultant_orders o
         JOIN consultant_profiles c ON c.id = o.consultant_id
         WHERE o.client_user_id = $1::uuid
         ORDER BY o.created_at DESC
         LIMIT 20`,
        [userId]
      );
      return result.rows.map((r) => ({
        id: String(r.id),
        packageName: String(r.package_name),
        amountUsd: Number(r.amount_usd),
        status: String(r.status),
        consultantName: String(r.consultant_name),
        createdAt: new Date(String(r.created_at)).toISOString(),
      }));
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("consultant_orders")
        .select("id, package_name, amount_usd, status, created_at, consultant:consultant_profiles ( full_name )")
        .eq("client_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        if (error.code === "42P01") return [];
        throw new Error(error.message);
      }

      return (data ?? []).map((o) => {
        const consultant = o.consultant as unknown as { full_name: string } | null;
        return {
          id: o.id,
          packageName: o.package_name,
          amountUsd: o.amount_usd,
          status: o.status,
          consultantName: consultant?.full_name ?? "—",
          createdAt: o.created_at,
        };
      });
    }
  );
}

export async function ensureUserForOrder(supabaseId: string, email: string | null) {
  return ensureInternalUser({ supabaseId, email, provider: "supabase_email" });
}

export async function listAdminConsultantOrders(limit = 50) {
  return withDatabase(
    async (pool) => {
      const result = await pool.query(
        `SELECT o.id, o.package_name, o.amount_usd, o.status, o.notes, o.created_at,
                u.email AS client_email, c.full_name AS consultant_name
         FROM consultant_orders o
         JOIN users u ON u.id = o.client_user_id
         JOIN consultant_profiles c ON c.id = o.consultant_id
         ORDER BY o.created_at DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows.map((r) => ({
        id: String(r.id),
        packageName: String(r.package_name),
        amountUsd: Number(r.amount_usd),
        status: String(r.status),
        notes: r.notes ? String(r.notes) : null,
        clientEmail: r.client_email ? String(r.client_email) : null,
        consultantName: String(r.consultant_name),
        createdAt: new Date(String(r.created_at)).toISOString(),
      }));
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("consultant_orders")
        .select("id, package_name, amount_usd, status, notes, created_at, client_user_id, consultant:consultant_profiles ( full_name )")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        if (error.code === "42P01") return [];
        throw new Error(error.message);
      }
      return (data ?? []).map((o) => {
        const consultant = o.consultant as unknown as { full_name: string } | null;
        return {
          id: o.id,
          packageName: o.package_name,
          amountUsd: o.amount_usd,
          status: o.status,
          notes: o.notes,
          clientEmail: null,
          consultantName: consultant?.full_name ?? "—",
          createdAt: o.created_at,
        };
      });
    }
  );
}

export async function updateConsultantOrderStatus(orderId: string, status: string) {
  return withDatabase(
    async (pool) => {
      await pool.query(`UPDATE consultant_orders SET status = $2, updated_at = now() WHERE id = $1::uuid`, [orderId, status]);
    },
    async (supabase) => {
      const { error } = await supabase.from("consultant_orders").update({ status }).eq("id", orderId);
      if (error) throw new Error(error.message);
    }
  );
}
