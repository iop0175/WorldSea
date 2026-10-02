import type { HealthResponse } from '@worldsea/shared';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/health`, { signal });
  if (!res.ok) throw new Error(`health ${res.status}`);
  return (await res.json()) as HealthResponse;
}
