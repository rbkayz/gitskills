"use client";

import { useEffect } from "react";

type McpTextContent = { type: "text"; text: string };
type McpCallToolResult = { content: McpTextContent[]; structuredContent?: unknown };

type WebMcpTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean };
  execute: (input: any, client: any) => Promise<McpCallToolResult>;
};

type WebMcp = {
  provideContext: (ctx: { tools?: WebMcpTool[] }) => void;
};

function getWebMcp(): WebMcp | null {
  const mc = (navigator as any)?.modelContext;
  if (!mc || typeof mc.provideContext !== "function") return null;
  return mc as WebMcp;
}

function ok(structuredContent: unknown): McpCallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent
  };
}

function okText(text: string): McpCallToolResult {
  return { content: [{ type: "text", text }] };
}

function err(message: string): McpCallToolResult {
  return { content: [{ type: "text", text: `error: ${message}` }] };
}

export function WebMcpProvider() {
  useEffect(() => {
    const webmcp = getWebMcp();
    if (!webmcp) return;

    const tools: WebMcpTool[] = [
      {
        name: "search_skills",
        description: "Search the skills registry (keyword or natural language) with optional filters.",
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query (keyword or natural language)" },
            category: { type: "string" },
            tag: { type: "string" },
            compatibility: { type: "string" },
            publisher: { type: "string" },
            minTrust: { type: "number", minimum: 0, maximum: 100 },
            trusted: { type: "boolean" },
            sort: { type: "string", enum: ["downloads", "trust", "recent"] },
            page: { type: "number", minimum: 1 },
            pageSize: { type: "number", minimum: 1, maximum: 50 }
          },
          required: ["query"]
        },
        execute: async (input) => {
          try {
            const u = new URL("/api/skills", window.location.origin);
            u.searchParams.set("q", String(input?.query ?? ""));
            if (input?.category) u.searchParams.set("category", String(input.category));
            if (input?.tag) u.searchParams.set("tag", String(input.tag));
            if (input?.compatibility) u.searchParams.set("compatibility", String(input.compatibility));
            if (input?.publisher) u.searchParams.set("publisher", String(input.publisher));
            if (input?.minTrust != null) u.searchParams.set("minTrust", String(input.minTrust));
            if (input?.trusted != null) u.searchParams.set("trusted", String(Boolean(input.trusted)));
            if (input?.sort) u.searchParams.set("sort", String(input.sort));
            if (input?.page != null) u.searchParams.set("page", String(input.page));
            if (input?.pageSize != null) u.searchParams.set("pageSize", String(input.pageSize));

            const res = await fetch(u, { headers: { accept: "application/json" } });
            if (!res.ok) return err(`search failed: ${res.status} ${res.statusText}`);
            const json = await res.json();

            // Add install hints + md links to make results more actionable for agents.
            const skills = Array.isArray(json?.skills) ? json.skills : [];
            const augmented = {
              ...json,
              skills: skills.map((s: any) => ({
                ...s,
                install: `gitskills install ${s.slug}`,
                markdown: `${window.location.origin}/md/skills/${encodeURIComponent(s.slug)}.md`,
                readme: `${window.location.origin}/skills/${encodeURIComponent(s.slug)}/README.md`
              }))
            };
            return ok(augmented);
          } catch (e: any) {
            return err(e?.message ?? String(e));
          }
        }
      },
      {
        name: "get_skill",
        description: "Fetch full metadata and versions for a skill slug.",
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
        inputSchema: {
          type: "object",
          properties: { slug: { type: "string" } },
          required: ["slug"]
        },
        execute: async (input) => {
          try {
            const slug = String(input?.slug ?? "");
            const res = await fetch(`/api/skills/${encodeURIComponent(slug)}`, { headers: { accept: "application/json" } });
            if (!res.ok) return err(`get_skill failed: ${res.status} ${res.statusText}`);
            return ok(await res.json());
          } catch (e: any) {
            return err(e?.message ?? String(e));
          }
        }
      },
      {
        name: "get_skill_readme",
        description: "Fetch a skill's README as Markdown.",
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
        inputSchema: {
          type: "object",
          properties: { slug: { type: "string" } },
          required: ["slug"]
        },
        execute: async (input) => {
          try {
            const slug = String(input?.slug ?? "");
            const res = await fetch(`/skills/${encodeURIComponent(slug)}/README.md`, { headers: { accept: "text/markdown" } });
            if (!res.ok) return err(`get_skill_readme failed: ${res.status} ${res.statusText}`);
            return okText(await res.text());
          } catch (e: any) {
            return err(e?.message ?? String(e));
          }
        }
      },
      {
        name: "get_install_command",
        description: "Return a deterministic CLI install command for a skill (optionally pinned to a version).",
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
        inputSchema: {
          type: "object",
          properties: { slug: { type: "string" }, version: { type: "string" } },
          required: ["slug"]
        },
        execute: async (input) => {
          const slug = String(input?.slug ?? "");
          const version = input?.version ? String(input.version) : null;
          const cmd = version ? `gitskills install ${slug} --version ${version}` : `gitskills install ${slug}`;
          return okText(cmd);
        }
      },
      {
        name: "open_skill_page",
        description: "Navigate the current tab to a skill page in the web UI.",
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
        inputSchema: {
          type: "object",
          properties: { slug: { type: "string" } },
          required: ["slug"]
        },
        execute: async (input) => {
          const slug = String(input?.slug ?? "");
          window.location.href = `/skills/${encodeURIComponent(slug)}`;
          return okText(`navigating to /skills/${slug}`);
        }
      }
    ];

    webmcp.provideContext({ tools });
  }, []);

  return null;
}
