const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
const TODOS_URL = `${BASE_URL}/api/todos`
const JSON_HEADERS = { "Content-Type": "application/json" }

/** fetch wrapper that throws on non-2xx so React Query can surface errors. */
async function request(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return res
}

/** Thin client for the Express todos API. Keeps the base URL in one place. */
export const todosApi = {
  list: (query: string) =>
    request(`${TODOS_URL}?${query}`).then((res) => res.json()),

  create: (body: unknown) =>
    request(TODOS_URL, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  update: (id: number, body: unknown) =>
    request(`${TODOS_URL}/${id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  remove: (id: number) =>
    request(`${TODOS_URL}/${id}`, { method: "DELETE" }),
}
