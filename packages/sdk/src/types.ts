export type SortMode = "downloads" | "trust" | "recent";
export type TrustTier = "community" | "bronze" | "silver" | "gold";

export type SkillSummary = {
  slug: string;
  name: string;
  summary: string;
  status: "active" | "hidden" | "blocked";
  tags: string[];
  categories: string[];
  compatibility: string[];
  licenseSpdx: string | null;
  publisher: { handle: string; displayName: string | null };
  downloadTotal: number;
  trustScore: number;
  trusted: boolean;
  trustTier: TrustTier | null;
  updatedAt: string; // ISO
};

export type ReleaseInfo = {
  version: string;
  status: "active" | "hidden" | "blocked";
  downloadUrl: string; // absolute URL
  sha256: string;
  sizeBytes: number;
  downloadTotal: number;
  createdAt: string; // ISO
};

export type SkillDetail = SkillSummary & {
  readmeMd: string;
  homepageUrl: string | null;
  repoUrl: string | null;
  releases: ReleaseInfo[];
  trustBreakdown: Record<string, unknown>;
};

export type SearchFilters = {
  mode?: "keyword" | "hybrid";
  category?: string;
  tag?: string;
  compatibility?: string;
  publisher?: string;
  minTrust?: number;
  trusted?: boolean;
  sort?: SortMode;
  page?: number;
  pageSize?: number;
};

export type SearchResult = {
  query: string;
  mode?: "keyword" | "hybrid" | string;
  page: number;
  pageSize: number;
  total: number;
  skills: SkillSummary[];
};
