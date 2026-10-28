import { createHistoryClient, parseRetryAfter } from './historyRequests.js';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

export async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  let payload;
  try { payload = await response.json(); }
  catch {
    if (response.ok) throw new Error('The API returned an invalid response.');
    payload = {};
  }
  if (!response.ok) {
    const message = response.status === 429
      ? 'Too many requests were made. Please wait a moment before trying again.'
      : response.status === 403
        ? 'You do not have permission to access this resource.'
        : payload?.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.retryAfterMs = parseRetryAfter(response.headers?.get?.('Retry-After'));
    throw error;
  }
  return payload;
}

const historyClient = createHistoryClient((token, offset) => request(`/assessments?offset=${offset}`, { token }));

export const authApi = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: (token) => request('/auth/me', { token })
};
export const assessmentApi = {
  create: async (token, body) => {
    const response = await request('/assessments', { token, method: 'POST', body: JSON.stringify(body) });
    historyClient.invalidate(token);
    return response;
  },
  history: (token, offset = 0, options) => historyClient.get(token, offset, options),
  clearHistory: (token) => historyClient.invalidate(token),
  get: (token, id) => request(`/assessments/${encodeURIComponent(id)}`, { token }),
  progress: (token, id) => request(`/assessments/${id}/progress`, { token }),
  updateProgress: (token, id, completedTasks) => request(`/assessments/${id}/progress`, { token, method: 'PUT', body: JSON.stringify({ completedTasks }) })
};
export const profileApi = {
  get: (token) => request('/profiles', { token }),
  update: (token, body) => request('/profiles', { token, method: 'PATCH', body: JSON.stringify(body) })
};
