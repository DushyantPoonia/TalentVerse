const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload;
}

export const authApi = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: (token) => request('/auth/me', { token })
};
export const assessmentApi = {
  create: (token, body) => request('/assessments', { token, method: 'POST', body: JSON.stringify(body) }),
  history: (token) => request('/assessments', { token }),
  progress: (token, id) => request(`/assessments/${id}/progress`, { token }),
  updateProgress: (token, id, completedTasks) => request(`/assessments/${id}/progress`, { token, method: 'PUT', body: JSON.stringify({ completedTasks }) })
};
export const profileApi = {
  get: (token) => request('/profiles', { token }),
  update: (token, body) => request('/profiles', { token, method: 'PATCH', body: JSON.stringify(body) })
};
