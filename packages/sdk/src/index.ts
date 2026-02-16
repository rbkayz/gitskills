import type { SearchFilters, SearchResult, SkillDetail } from "./types.js";

export * from "./types.js";

export class RegistryClient {
  readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async searchSkills(query: string, filters: SearchFilters = {}): Promise<SearchResult> {
    const u = new URL(this.baseUrl + "/api/skills");
    u.searchParams.set("q", query);
    if (filters.category) u.searchParams.set("category", filters.category);
    if (filters.tag) u.searchParams.set("tag", filters.tag);
    if (filters.compatibility) u.searchParams.set("compatibility", filters.compatibility);
    if (filters.publisher) u.searchParams.set("publisher", filters.publisher);
    if (filters.minTrust != null) u.searchParams.set("minTrust", String(filters.minTrust));
    if (filters.trusted != null) u.searchParams.set("trusted", String(filters.trusted));
    if (filters.sort) u.searchParams.set("sort", filters.sort);
    if (filters.page != null) u.searchParams.set("page", String(filters.page));
    if (filters.pageSize != null) u.searchParams.set("pageSize", String(filters.pageSize));

    const res = await fetch(u);
    if (!res.ok) throw new Error(`search failed: ${res.status} ${res.statusText}`);
    return (await res.json()) as SearchResult;
  }

  async getSkill(slug: string): Promise<SkillDetail> {
    const res = await fetch(this.baseUrl + `/api/skills/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`get skill failed: ${res.status} ${res.statusText}`);
    return (await res.json()) as SkillDetail;
  }

  async getSkillReadme(slug: string): Promise<string> {
    const res = await fetch(this.baseUrl + `/skills/${encodeURIComponent(slug)}/README.md`);
    if (!res.ok) throw new Error(`get readme failed: ${res.status} ${res.statusText}`);
    return await res.text();
  }
}
