const apiBaseUrl =
  process.env.OPENSWARM_API_BASE_URL ?? "http://127.0.0.1:3001/api";

async function sendToBackend<T>(
  method: "POST" | "PUT",
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Backend ${method} ${path} failed: ${response.status} ${detail}`);
  }

  return (await response.json()) as T;
}

export async function postToBackend<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  return sendToBackend("POST", path, body);
}

export async function putToBackend<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  return sendToBackend("PUT", path, body);
}
