const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
const JSON_HEADERS = { "Content-Type": "application/json" }

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`Request failed with status ${status}`)
  }
}

/** fetch wrapper: sends the auth cookie and throws on non-2xx. */
async function request(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...init,
  })
  if (!res.ok) {
    throw new ApiError(res.status)
  }
  return res
}

const jsonBody = (body: unknown): RequestInit => ({
  headers: JSON_HEADERS,
  body: JSON.stringify(body),
})

export const todosApi = {
  list: (query: string) =>
    request(`/api/todos?${query}`).then((res) => res.json()),

  create: (body: unknown) =>
    request("/api/todos", { method: "POST", ...jsonBody(body) }).then((res) =>
      res.json(),
    ),

  update: (id: number, body: unknown) =>
    request(`/api/todos/${id}`, { method: "PATCH", ...jsonBody(body) }).then(
      (res) => res.json(),
    ),

  remove: (id: number) => request(`/api/todos/${id}`, { method: "DELETE" }),
}

export interface AuthUser {
  id: number
  email: string
}

type Credentials = { email: string; password: string }

export const authApi = {
  me: () => request("/api/auth/me").then((res) => res.json() as Promise<AuthUser>),

  register: (body: Credentials) =>
    request("/api/auth/register", { method: "POST", ...jsonBody(body) }).then(
      (res) => res.json() as Promise<AuthUser>,
    ),

  login: (body: Credentials) =>
    request("/api/auth/login", { method: "POST", ...jsonBody(body) }).then(
      (res) => res.json() as Promise<AuthUser>,
    ),

  logout: () => request("/api/auth/logout", { method: "POST" }),
}
