const DEFAULT_TIMEOUT_MS = 20_000;

async function fetchResponse(url: string, attempts: number, accept: string, init: RequestInit = {}): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: { Accept: accept, "User-Agent": "RelocateJobs/0.1 (+job-indexer)", ...init.headers },
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}

export async function fetchJson(url: string, attempts = 3): Promise<unknown> {
  return (await fetchResponse(url, attempts, "application/json")).json();
}

export async function fetchText(url: string, attempts = 3, accept = "text/plain"): Promise<string> {
  return (await fetchResponse(url, attempts, accept)).text();
}

export async function postJson(url: string, body: unknown, attempts = 3): Promise<unknown> {
  const response = await fetchResponse(url, attempts, "application/json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}
