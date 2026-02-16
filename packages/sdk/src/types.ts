export type SortMode = "downloads" | "trust" | "recent";

export type SkillSummary = {
  slug: string;
  name: string;
  summary: string;
  tags: string[];
  categories: string[];
  compatibility: string[];
  licenseSpdx: string | null;
  publisher: { handle: string; displayName: string | null };
  downloadTotal: number;
  trustScore: number;
  updatedAt: string; // ISO
};

export type ReleaseInfo = {
  version: string;
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
  category?: string;
  tag?: string;
  compatibility?: string;
  publisher?: string;
  minTrust?: number;
  sort?: SortMode;
  page?: number;
  pageSize?: number;
};

export type SearchResult = {
  query: string;
  page: number;
  pageSize: number;
  total: number;
  skills: SkillSummary[];
};
