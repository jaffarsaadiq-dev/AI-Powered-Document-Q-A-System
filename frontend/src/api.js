const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error("Cannot reach the backend. Make sure FastAPI is running on port 8000.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail || `Request failed (${response.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

export const api = {
  health: () => request("/api/health"),
  documents: () => request("/api/documents"),
  upload: (file) => {
    const body = new FormData();
    body.append("file", file);
    return request("/api/documents", { method: "POST", body });
  },
  ask: (document_id, question) => request("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id, question })
  }),
  deleteDocument: (id) => request(`/api/documents/${encodeURIComponent(id)}`, {
    method: "DELETE"
  })
};
