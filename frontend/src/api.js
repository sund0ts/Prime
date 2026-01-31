const API = '/api';

function getToken() {
  return localStorage.getItem('token');
}

export async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Ошибка запроса');
  return data;
}

const API_BASE = '';

export const authApi = {
  login: (nickname, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ nickname, password }) }),
  register: (nickname, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ nickname, password }) }),
  createUser: (nickname, password) => request('/auth/create', { method: 'POST', body: JSON.stringify({ nickname, password }) }),
};

export function avatarUrl(filename) {
  if (!filename) return null;
  return `${API_BASE}/uploads/avatars/${filename}`;
}

export const usersApi = {
  me: () => request('/users/me'),
  get: (id) => request(`/users/${id}`),
  listAll: () => request('/users/list/all'),
  updateMe: (data) => request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  uploadAvatar: (file) => {
    const token = localStorage.getItem('token');
    const form = new FormData();
    form.append('avatar', file);
    return fetch(`${API_BASE}/api/users/me/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then((r) => r.json()).then((data) => { if (data.error) throw new Error(data.error); return data; });
  },
  updateNickname: (id, nickname) => request(`/users/${id}/nickname`, { method: 'PATCH', body: JSON.stringify({ nickname }) }),
  updateProfile: (id, data) => request(`/users/${id}/profile`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const staffApi = {
  list: () => request('/staff'),
  add: (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
};

export const punishmentsApi = {
  byStaff: (staffId) => request(`/punishments/staff/${staffId}`),
  issue: (staffId, type, reason) => request('/punishments', { method: 'POST', body: JSON.stringify({ staff_id: staffId, type, reason }) }),
  remove: (id, reason) => request(`/punishments/${id}/remove`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

export const inactivesApi = {
  list: () => request('/inactives'),
  create: (start_date, end_date, reason) => request('/inactives', { method: 'POST', body: JSON.stringify({ start_date, end_date, reason }) }),
  approve: (id) => request(`/inactives/${id}/approve`, { method: 'POST' }),
  reject: (id, reject_reason) => request(`/inactives/${id}/reject`, { method: 'POST', body: JSON.stringify({ reject_reason }) }),
};

export const logsApi = {
  list: (limit = 100, offset = 0) => request(`/logs?limit=${limit}&offset=${offset}`),
};

export const applicationsApi = {
  submit: (data) =>
    fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()).then((d) => { if (d.error) throw new Error(d.error || d.errors?.[0]?.msg); return d; }),
  list: () => request('/applications'),
};

export const leadershipApi = {
  list: () => fetch('/api/leadership').then((r) => r.json()),
  add: (data) => request('/leadership', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/leadership/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/leadership/${id}`, { method: 'DELETE' }),
  uploadAvatar: (id, file) => {
    const token = localStorage.getItem('token');
    const form = new FormData();
    form.append('avatar', file);
    return fetch(`/api/leadership/${id}/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then((r) => r.json()).then((d) => { if (d.error) throw new Error(d.error); return d; });
  },
};

export function leadershipAvatarUrl(filename) {
  if (!filename) return null;
  return `/uploads/leadership/${filename}`;
}
