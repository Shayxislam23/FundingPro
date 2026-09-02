export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import {
  currentYearMonth,
  DEFAULT_REVENUE_SHARE_TIERS,
  resolveRevenueShare,
} from "@/lib/partners/revenue-share";
import { convexInternalQuery, internal } from "@/lib/convex-server";
import { listActivePartnerChannels } from "@/lib/partners/channels";

export const GET = withAdmin(async () => {
  const channels = listActivePartnerChannels();
  const yearMonth = currentYearMonth();

  const rows = await Promise.all(
    channels.map(async (channel) => {
      const count = await convexInternalQuery(
        internal.partnersInternal.getMonthlyCompletedCount,
        { channelSlug: channel.slug, yearMonth }
      );
      const split = resolveRevenueShare(count);
      return {
        channel: channel.slug,
        displayName: channel.displayNameRu,
        yearMonth,
        completedTransactions: count,
        partnerSharePercent: split.partnerPercent,
        fundingProSharePercent: split.fundingProPercent,
        tierLabel: split.tierLabel,
      };
    })
  );

  return apiSuccess({
    yearMonth,
    tiers: DEFAULT_REVENUE_SHARE_TIERS,
    channels: rows,
  });
});
