import "reflect-metadata";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { closeORM, getORM, initORM } from "../src/db";
import { Todo } from "../src/entities/Todo";
import { User } from "../src/entities/User";

let app: Express;
let agent: ReturnType<typeof request.agent>;
let userId: number;

/** Registers a fresh user and returns an authenticated supertest agent. */
async function authenticate(email: string): Promise<{
  agent: ReturnType<typeof request.agent>;
  id: number;
}> {
  const a = request.agent(app);
  const res = await a
    .post("/api/auth/register")
    .send({ email, password: "password123" });
  return { agent: a, id: res.body.id };
}

beforeAll(async () => {
  const orm = await initORM();
  await orm.schema.refreshDatabase();
  app = createApp();
});

afterAll(async () => {
  await closeORM();
});

beforeEach(async () => {
  const em = getORM().em.fork();
  await em.nativeDelete(Todo, {});
  await em.nativeDelete(User, {});

  const auth = await authenticate("user@test.dev");
  agent = auth.agent;
  userId = auth.id;

  const em2 = getORM().em.fork();
  em2.create(Todo, {
    text: "Seed task",
    priority: "high",
    category: "work",
    user: em2.getReference(User, userId),
  });
  await em2.flush();
});

describe("auth", () => {
  it("registers a user and sets an auth cookie", async () => {
    const fresh = request.agent(app);
    const res = await fresh
      .post("/api/auth/register")
      .send({ email: "new@test.dev", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: "new@test.dev" });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/token=/);
  });

  it("rejects duplicate email with 409", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "user@test.dev", password: "password123" });
    expect(res.status).toBe(409);
  });

  it("logs in with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.dev", password: "password123" });
    expect(res.status).toBe(200);
  });

  it("rejects wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.dev", password: "wrong" });
    expect(res.status).toBe(401);
  });
});

describe("todos require authentication", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/todos");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/todos", () => {
  it("returns the user's todos, categories and stats", async () => {
    const res = await agent.get("/api/todos");
    expect(res.status).toBe(200);
    expect(res.body.todos).toHaveLength(1);
    expect(res.body.categories.length).toBeGreaterThan(0);
    expect(res.body.stats).toMatchObject({ total: 1, active: 1, completed: 0 });
  });

  it("filters by status=completed", async () => {
    const res = await agent.get("/api/todos?status=completed");
    expect(res.body.todos).toHaveLength(0);
  });

  it("rejects an invalid filter value with 400", async () => {
    const res = await agent.get("/api/todos?priority=bogus");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/todos", () => {
  it("creates a todo and returns 201", async () => {
    const res = await agent
      .post("/api/todos")
      .send({ text: "Write tests", priority: "low" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ text: "Write tests", done: false });
  });

  it("rejects empty text with 400", async () => {
    const res = await agent.post("/api/todos").send({ text: "  " });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/todos/:id", () => {
  it("toggles done and sets completedAt", async () => {
    const { body: created } = await agent
      .post("/api/todos")
      .send({ text: "Toggle me" });
    const res = await agent
      .patch(`/api/todos/${created.id}`)
      .send({ done: true });
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
    expect(res.body.completedAt).toBeTruthy();
  });

  it("returns 404 for a missing todo", async () => {
    const res = await agent.patch("/api/todos/999999").send({ text: "x" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/todos/:id", () => {
  it("deletes a todo and returns 204", async () => {
    const { body: created } = await agent
      .post("/api/todos")
      .send({ text: "Delete me" });
    const res = await agent.delete(`/api/todos/${created.id}`);
    expect(res.status).toBe(204);
  });
});

describe("user isolation", () => {
  it("cannot touch another user's todo", async () => {
    const { body: mine } = await agent
      .post("/api/todos")
      .send({ text: "Private" });

    const other = await authenticate("other@test.dev");

    expect((await other.agent.get("/api/todos")).body.todos).toHaveLength(0);
    expect((await other.agent.patch(`/api/todos/${mine.id}`).send({ done: true })).status).toBe(404);
    expect((await other.agent.delete(`/api/todos/${mine.id}`)).status).toBe(404);
  });
});
