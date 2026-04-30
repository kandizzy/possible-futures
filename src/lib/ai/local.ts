// Adapter for OpenAI-compatible local model servers (LM Studio, Ollama, etc.).
// Sends a chat-completions request and returns the assistant text.
//
// Why an adapter instead of using the OpenAI SDK: we only need one method
// (chat.completions.create), and a tiny fetch keeps the dependency surface
// small. If we ever want streaming or richer error semantics this can grow
// into the SDK without changing call sites.

interface LocalCallOpts {
  baseUrl: string;
  model: string;
  apiKey: string | null;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export async function callLocalChat(opts: LocalCallOpts): Promise<string> {
  if (!opts.model) {
    throw new Error('Local model name is empty. Set it in Settings → AI Backend → Local.');
  }

  const url = `${opts.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.apiKey) headers['Authorization'] = `Bearer ${opts.apiKey}`;

  const body = {
    model: opts.model,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content: opts.userPrompt },
    ],
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 4096,
    stream: false,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 300_000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `Local model timed out after ${(opts.timeoutMs ?? 300_000) / 1000}s. ` +
        'Smaller models or shorter prompts respond faster.',
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not reach local model at ${opts.baseUrl}. Is the server running? (${msg})`,
    );
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (/n_ctx|context length|context window|maximum context/i.test(text)) {
      throw new Error(
        "The prompt is longer than the model's context window. Reload the model in LM Studio with a larger context length (32K or higher), or pick a model with a bigger default context.",
      );
    }
    // Try to pull a human-readable message out of the JSON error body before falling back
    let detail = '';
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } | string };
      detail = typeof parsed.error === 'string' ? parsed.error : parsed.error?.message ?? '';
    } catch {
      detail = text.slice(0, 200);
    }
    throw new Error(
      `Local model returned ${response.status} ${response.statusText}.${detail ? ' ' + detail : ''}`,
    );
  }

  let json: {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  try {
    json = await response.json();
  } catch {
    throw new Error('Local model returned a non-JSON response.');
  }

  if (json.error) {
    throw new Error(`Local model error: ${json.error.message ?? 'unknown error'}`);
  }

  const content = json.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error('Local model returned empty content.');
  }

  return content.trim();
}

interface ListModelsResponse {
  data?: Array<{ id: string }>;
}

export async function listLocalModels(baseUrl: string, apiKey: string | null): Promise<string[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/models`;
  const headers: Record<string, string> = {};
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Could not list models (${response.status} ${response.statusText}).`);
  }
  const json = (await response.json()) as ListModelsResponse;
  return (json.data ?? []).map((m) => m.id);
}
