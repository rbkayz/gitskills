import OpenAI from "openai";

const model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

let _client: OpenAI | null | undefined;
function client(): OpenAI | null {
  if (_client !== undefined) return _client;
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    _client = null;
    return _client;
  }
  _client = new OpenAI({ apiKey: key });
  return _client;
}

export async function embedText(input: string): Promise<number[] | null> {
  const c = client();
  if (!c) return null;
  const txt = input.trim();
  if (!txt) return null;
  try {
    const out = await c.embeddings.create({
      model,
      input: txt.slice(0, 7000)
    });
    const emb = out.data?.[0]?.embedding;
    if (!emb || !Array.isArray(emb)) return null;
    return emb.map((x) => Number(x));
  } catch {
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let an = 0;
  let bn = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    an += a[i] * a[i];
    bn += b[i] * b[i];
  }
  if (an === 0 || bn === 0) return 0;
  return dot / (Math.sqrt(an) * Math.sqrt(bn));
}

