const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const BASE = `${API_URL}/auth`;

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

export function login(email, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(email, password) {
  return request("/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return request("/logout", { method: "POST" });
}

export function getMe() {
  return request("/me");
}
