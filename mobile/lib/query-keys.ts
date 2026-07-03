import type { GrantsListParams } from "./api/client";

export type GrantsQueryKeyParams = GrantsListParams & {
  tab?: boolean;
  home?: boolean;
  public?: boolean;
  landing?: boolean;
  stats?: boolean;
  eligibility?: boolean;
  aiWriter?: boolean;
};

export const queryKeys = {
  health: ["health"] as const,
  me: ["me"] as const,
  consentStatus: ["consent-status"] as const,
  onboarding: ["onboarding"] as const,
  labJourney: ["lab-journey"] as const,
  grants: (params?: GrantsQueryKeyParams) => ["grants", params] as const,
  grant: (id: string) => ["grant", id] as const,
  applications: (params?: Record<string, unknown>) => ["applications", params] as const,
  application: (id: string) => ["application", id] as const,
  organization: ["organization"] as const,
  consultants: ["consultants"] as const,
  consultantOrders: ["consultant-orders"] as const,
  documents: ["documents"] as const,
  aiProposals: ["ai-proposals"] as const,
  matchGrants: (orgId?: string) => ["match-grants", orgId] as const,
  plans: ["plans"] as const,
  subscription: ["subscription"] as const,
  planUsage: ["plan-usage"] as const,
  paymentStatus: ["payment-status"] as const,
  supportTickets: ["support-tickets"] as const,
  donors: ["donors"] as const,
  stories: ["stories"] as const,
};
