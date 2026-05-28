const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type Role = 'ADMIN' | 'PRODUSEN' | 'KURIR';

export type ApiUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
};

type ApiEnvelope<T> = {
  ok: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: ApiUser;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('electra_token');
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem('electra_user');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: ApiUser) {
  localStorage.setItem('electra_token', token);
  localStorage.setItem('electra_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('electra_token');
  localStorage.removeItem('electra_user');
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new ApiError(payload.message || 'Request API gagal.', response.status);
  }

  return payload;
}

export async function loginUser(username: string, password: string, role: Role) {
  const payload = await apiRequest<never>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
  });

  if (!payload.token || !payload.user) {
    throw new ApiError('Response login tidak lengkap.', 500);
  }

  saveSession(payload.token, payload.user);
  return payload.user;
}
