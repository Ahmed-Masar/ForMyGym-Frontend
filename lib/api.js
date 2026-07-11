const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  exercises: {
    list: () => req('/api/exercises'),
    create: (data) => req('/api/exercises', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => req(`/api/exercises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => req(`/api/exercises/${id}`, { method: 'DELETE' }),
  },
  sessions: {
    list: () => req('/api/sessions'),
    prs: () => req('/api/sessions/prs'),
    exercise: (id) => req(`/api/sessions/exercise/${id}`),
    get: (id) => req(`/api/sessions/${id}`),
    create: (data) => req('/api/sessions', { method: 'POST', body: JSON.stringify(data) }),
    log: (data) => req('/api/sessions/log', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => req(`/api/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => req(`/api/sessions/${id}`, { method: 'DELETE' }),
  },
  forearm: {
    list: () => req('/api/forearm'),
    streak: () => req('/api/forearm/streak'),
    byDate: (date) => req(`/api/forearm/date/${date}`),
    save: (data) => req('/api/forearm', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id) => req(`/api/forearm/${id}`, { method: 'DELETE' }),
  },
  bodyweight: {
    list: () => req('/api/bodyweight'),
    save: (data) => req('/api/bodyweight', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id) => req(`/api/bodyweight/${id}`, { method: 'DELETE' }),
  },
};
