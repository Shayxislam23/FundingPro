export type GrantListItem = {
  id: string;
  title: string;
  title_ru: string | null;
  description: string | null;
  sectors: string[];
  country_scope: string[];
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  donor: { id: string; name: string; name_ru: string | null };
};

export type GrantDetail = GrantListItem & {
  description_ru: string | null;
  grant_requirements: {
    id: string;
    requirement_type: string;
    text: string;
    required: boolean;
  }[];
  donor: { id: string; name: string; name_ru: string | null; website: string | null };
};

export type GrantListParams = ListGrantsParams;

export type ListGrantsParams = {
  search?: string;
  sector?: string;
  country?: string;
  donorId?: string;
  deadlineBefore?: string;
  deadlineAfter?: string;
  activeOnly?: boolean;
  featured?: boolean;
  today?: number;
  page: number;
  limit: number;
};

export type ListGrantsResult = {
  grants: GrantListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};
