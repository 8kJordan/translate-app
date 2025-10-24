export const API_BASE = (import.meta.env.VITE_API_BASE as string) || '';

/** Helper that wraps fetch with JSON + credentials for cookie-based auth */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
    ...options,
    body: options.body
  });
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : (await res.text());
  if (!res.ok) {
    const err = typeof data === 'string' ? { message: data } : data;
    throw Object.assign(new Error(err?.message || 'Request failed'), { status: res.status, data: err });
  }
  return data as T;
}

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { email: string; password: string; phone?: string; firstName?: string; lastName?: string };
