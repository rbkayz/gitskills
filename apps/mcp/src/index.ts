#!/usr/bin/env node
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { Request, Response } from "express";
import * as z from "zod/v4";

import { RegistryClient } from "@gitskills/sdk";

const registryUrl = (process.env.REGISTRY_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const transportMode = (process.env.MCP_TRANSPORT ?? "stdio").toLowerCase();

function buildServer(): McpServer {
  const client = new RegistryClient(registryUrl);
  const server = new McpServer({
    name: "gitskills",
    version: "0.0.0"
  });

  server.registerTool(
    "search_skills",
    {
      description: "Search the gitskills registry (keyword or natural language) with optional filters.",
      inputSchema: {
        query: z.string().describe("Search query (keyword or natural language)"),
        mode: z.enum(["keyword", "hybrid"]).optional(),
        category: z.string().optional(),
        tag: z.string().optional(),
        compatibility: z.string().optional(),
        publisher: z.string().optional(),
        minTrust: z.number().int().min(0).max(100).optional(),
        trusted: z.boolean().optional(),
        sort: z.enum(["downloads", "trust", "recent"]).optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(50).optional()
      },
      outputSchema: {
        query: z.string(),
        total: z.number().int(),
        page: z.number().int(),
        pageSize: z.number().int(),
        skills: z.array(
          z.object({
            slug: z.string(),
            name: z.string(),
            summary: z.string(),
            trustScore: z.number().int(),
            trusted: z.boolean(),
            trustTier: z.string().nullable(),
            downloadTotal: z.number().int(),
            publisher: z.object({ handle: z.string() }),
            install: z.string()
          })
        )
      }
    },
    async (args) => {
      const res = await client.searchSkills(args.query, {
        mode: args.mode,
        category: args.category,
        tag: args.tag,
        compatibility: args.compatibility,
        publisher: args.publisher,
        minTrust: args.minTrust,
        trusted: args.trusted,
        sort: args.sort,
        page: args.page,
        pageSize: args.pageSize
      });

      const structuredContent = {
        query: res.query,
        total: res.total,
        page: res.page,
        pageSize: res.pageSize,
        skills: res.skills.map((s) => ({
          slug: s.slug,
          name: s.name,
          summary: s.summary,
          trustScore: s.trustScore,
          trusted: s.trusted,
          trustTier: s.trustTier,
          downloadTotal: s.downloadTotal,
          publisher: { handle: s.publisher.handle },
          install: `gitskills install ${s.slug}`
        }))
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(structuredContent, null, 2)
          }
        ],
        structuredContent
      };
    }
  );

  server.registerTool(
    "get_skill",
    {
      description: "Fetch a skill's full metadata and versions.",
      inputSchema: {
        slug: z.string().describe("Skill slug (e.g., git-commit-helper)")
      }
    },
    async ({ slug }) => {
      const skill = await client.getSkill(slug);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(skill, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_skill_readme",
    {
      description: "Fetch a skill's README as Markdown.",
      inputSchema: {
        slug: z.string().describe("Skill slug")
      }
    },
    async ({ slug }) => {
      const md = await client.getSkillReadme(slug);
      return {
        content: [
          {
            type: "text",
            text: md
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_install_command",
    {
      description: "Get a deterministic CLI install command for a skill (optionally pinned to a version).",
      inputSchema: {
        slug: z.string(),
        version: z.string().optional()
      }
    },
    async ({ slug, version }) => {
      const cmd = version ? `gitskills install ${slug} --version ${version}` : `gitskills install ${slug}`;
      return {
        content: [
          {
            type: "text",
            text: cmd
          }
        ]
      };
    }
  );

  server.registerResource(
    "gitskills-index",
    "gitskills://index",
    { mimeType: "text/markdown", description: "Agent-readable registry index (markdown)." },
    async () => {
      const res = await fetch(`${registryUrl}/.well-known/gitskills/index.md`);
      const text = await res.text();
      return { contents: [{ uri: "gitskills://index", text }] };
    }
  );

  server.registerResource(
    "gitskills-skill-md",
    new ResourceTemplate("gitskills://skills/{slug}.md", {
      list: undefined,
      complete: {
        slug: async () => {
          const res = await client.searchSkills("", { sort: "downloads", pageSize: 20 });
          return res.skills.map((s) => s.slug);
        }
      }
    }),
    { mimeType: "text/markdown", description: "Agent-readable skill card (markdown)." },
    async (_uri, vars) => {
      const slug = String(vars.slug ?? "");
      const res = await fetch(`${registryUrl}/md/skills/${encodeURIComponent(slug)}.md`);
      const text = await res.text();
      return { contents: [{ uri: `gitskills://skills/${slug}.md`, text }] };
    }
  );

  return server;
}

async function runStdio() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`gitskills MCP server running on stdio (REGISTRY_URL=${registryUrl})`);
}

async function runHttp() {
  const port = Number(process.env.PORT ?? 8788);
  const app = createMcpExpressApp();
  const authToken = process.env.MCP_HTTP_TOKEN;

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ ok: true, transport: "http", registryUrl });
  });

  app.post("/mcp", async (req: Request, res: Response) => {
    if (authToken && req.headers["x-mcp-token"] !== authToken) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on("close", () => {
        transport.close();
        server.close();
      });
    } catch (error) {
      console.error("HTTP MCP request error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null
        });
      }
    }
  });

  app.listen(port, () => {
    console.error(
      `gitskills MCP server running on http://localhost:${port}/mcp (REGISTRY_URL=${registryUrl})`
    );
  });
}

async function main() {
  if (transportMode === "http") {
    await runHttp();
    return;
  }
  await runStdio();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
