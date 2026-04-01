import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  fetchEvents,
  fetchEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchUpcomingEvents,
} from "@calendar/api/api";

const CALENDAR = "http://localhost:8000/calendar/api";

describe("calendar api", () => {
  it("fetchEvents calls GET /events with date range", async () => {
    const mock = [{ id: 1, title: "Test" }];
    server.use(http.get(`${CALENDAR}/events`, () => HttpResponse.json(mock)));
    const result = await fetchEvents("2026-04-01", "2026-04-30");
    expect(result).toEqual(mock);
  });

  it("fetchEvent calls GET /events/:id", async () => {
    const mock = { id: 5, title: "Dentista" };
    server.use(http.get(`${CALENDAR}/events/5`, () => HttpResponse.json(mock)));
    const result = await fetchEvent(5);
    expect(result).toEqual(mock);
  });

  it("createEvent calls POST /events", async () => {
    const payload = { title: "Nuevo", start_at: "2026-04-15T10:00:00Z" };
    const mock = { id: 10, ...payload };
    server.use(
      http.post(`${CALENDAR}/events`, () =>
        HttpResponse.json(mock, { status: 201 })
      )
    );
    const result = await createEvent(payload);
    expect(result).toEqual(mock);
  });

  it("updateEvent calls PUT /events/:id with scope params", async () => {
    const payload = { title: "Updated" };
    const mock = { id: 3, ...payload };
    server.use(http.put(`${CALENDAR}/events/3`, () => HttpResponse.json(mock)));
    const result = await updateEvent(3, payload, "single", "2026-04-13");
    expect(result).toEqual(mock);
  });

  it("deleteEvent calls DELETE /events/:id and returns null", async () => {
    server.use(
      http.delete(
        `${CALENDAR}/events/7`,
        () => new HttpResponse(null, { status: 204 })
      )
    );
    const result = await deleteEvent(7, "all");
    expect(result).toBeNull();
  });

  it("fetchUpcomingEvents calls GET /events/upcoming", async () => {
    const mock = [{ id: 1, title: "Soon" }];
    server.use(
      http.get(`${CALENDAR}/events/upcoming`, () => HttpResponse.json(mock))
    );
    const result = await fetchUpcomingEvents(5);
    expect(result).toEqual(mock);
  });

  it("throws on error response", async () => {
    server.use(
      http.get(`${CALENDAR}/events`, () =>
        HttpResponse.json({ detail: "Bad request" }, { status: 400 })
      )
    );
    await expect(fetchEvents("a", "b")).rejects.toThrow("Bad request");
  });
});
