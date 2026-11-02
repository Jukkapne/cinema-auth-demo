export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const response = await fetch(path, {
    // STEP 7 — The browser sends matching same-origin cookies; JS does not read HttpOnly values.
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new ApiError(response.status, data.message ?? "The request failed.");
  return data;
}
