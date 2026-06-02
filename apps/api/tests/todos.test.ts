import "reflect-metadata";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { closeORM, getORM, initORM } from "../src/db";
import { Todo } from "../src/entities/Todo";

let app: Express;

beforeAll(async () => {
  const orm = await initORM();
  // Drop + recreate the schema from entities for a clean slate.
  await orm.schema.refreshDatabase();
  app = createApp();
});

afterAll(async () => {
  await closeORM();
});

beforeEach(async () => {
  const em = getORM().em.fork();
  await em.nativeDelete(Todo, {});
  em.create(Todo, { text: "Seed task", priority: "high", category: "work" });
  await em.flush();
});

describe("GET /api/todos", () => {
  it("returns todos, categories and stats", async () => {
    const res = await request(app).get("/api/todos");
    expect(res.status).toBe(200);
    expect(res.body.todos).toHaveLength(1);
    expect(res.body.categories.length).toBeGreaterThan(0);
    expect(res.body.stats).toMatchObject({ total: 1, active: 1, completed: 0 });
  });

  it("filters by status=completed", async () => {
    const res = await request(app).get("/api/todos?status=completed");
    expect(res.status).toBe(200);
    expect(res.body.todos).toHaveLength(0);
  });

  it("rejects an invalid filter value with 400", async () => {
    const res = await request(app).get("/api/todos?priority=bogus");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/todos", () => {
  it("creates a todo and returns 201", async () => {
    const res = await request(app)
      .post("/api/todos")
      .send({ text: "Write tests", priority: "low" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ text: "Write tests", priority: "low", done: false });
    expect(res.body.id).toBeGreaterThan(0);
  });

  it("rejects empty text with 400", async () => {
    const res = await request(app).post("/api/todos").send({ text: "  " });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/todos/:id", () => {
  it("toggles done and sets completedAt", async () => {
    const { body: created } = await request(app)
      .post("/api/todos")
      .send({ text: "Toggle me" });

    const res = await request(app)
      .patch(`/api/todos/${created.id}`)
      .send({ done: true });

    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
    expect(res.body.completedAt).toBeTruthy();
  });

  it("returns 404 for a missing todo", async () => {
    const res = await request(app).patch("/api/todos/999999").send({ text: "x" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for a non-numeric id", async () => {
    const res = await request(app).patch("/api/todos/abc").send({ text: "x" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/todos/:id", () => {
  it("deletes a todo and returns 204", async () => {
    const { body: created } = await request(app)
      .post("/api/todos")
      .send({ text: "Delete me" });

    const res = await request(app).delete(`/api/todos/${created.id}`);
    expect(res.status).toBe(204);

    const after = await request(app).get("/api/todos");
    expect(after.body.todos.find((t: { id: number }) => t.id === created.id)).toBeUndefined();
  });

  it("returns 404 when deleting a missing todo", async () => {
    const res = await request(app).delete("/api/todos/999999");
    expect(res.status).toBe(404);
  });
});
