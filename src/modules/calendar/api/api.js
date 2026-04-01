const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const BASE = `${API_URL}/calendar/api`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── Events ───────────────────────────────────────────────────────────────────

export function fetchEvents(start, end) {
  const params = new URLSearchParams({ start, end });
  return request(`/events?${params}`);
}

export function fetchEvent(id) {
  return request(`/events/${id}`);
}

export function createEvent(data) {
  return request("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEvent(id, data, scope = "all", occurrenceDate = null) {
  const params = new URLSearchParams({ scope });
  if (occurrenceDate) params.set("occurrence_date", occurrenceDate);
  return request(`/events/${id}?${params}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteEvent(id, scope = "all", occurrenceDate = null) {
  const params = new URLSearchParams({ scope });
  if (occurrenceDate) params.set("occurrence_date", occurrenceDate);
  return request(`/events/${id}?${params}`, { method: "DELETE" });
}

export function fetchUpcomingEvents(limit = 10) {
  return request(`/events/upcoming?limit=${limit}`);
}
