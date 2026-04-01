import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { useEvents } from "@calendar/hooks/useEvents";

const CALENDAR = "http://localhost:8000/calendar/api";

const MOCK_EVENTS = [
  {
    id: 1,
    title: "Test Event",
    occurrence_start: "2026-04-15T10:00:00Z",
    occurrence_end: "2026-04-15T11:00:00Z",
  },
];

describe("useEvents", () => {
  beforeEach(() => {
    server.use(
      http.get(`${CALENDAR}/events`, () => HttpResponse.json(MOCK_EVENTS))
    );
  });

  it("fetches events on mount", async () => {
    const { result } = renderHook(() => useEvents(2026, 3));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual(MOCK_EVENTS);
    expect(result.current.error).toBeNull();
  });

  it("exposes reload function", async () => {
    const { result } = renderHook(() => useEvents(2026, 3));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.events).toEqual(MOCK_EVENTS);
  });

  it("create calls API and reloads", async () => {
    server.use(
      http.post(`${CALENDAR}/events`, () =>
        HttpResponse.json({ id: 2 }, { status: 201 })
      )
    );
    const { result } = renderHook(() => useEvents(2026, 3));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.create({ title: "New" });
    });
    expect(result.current.events).toEqual(MOCK_EVENTS);
  });

  it("update calls API and reloads", async () => {
    server.use(
      http.put(`${CALENDAR}/events/1`, () =>
        HttpResponse.json({ id: 1, title: "Updated" })
      )
    );
    const { result } = renderHook(() => useEvents(2026, 3));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.update(1, { title: "Updated" }, "all", null);
    });
    expect(result.current.events).toEqual(MOCK_EVENTS);
  });

  it("remove calls API and reloads", async () => {
    server.use(
      http.delete(
        `${CALENDAR}/events/1`,
        () => new HttpResponse(null, { status: 204 })
      )
    );
    const { result } = renderHook(() => useEvents(2026, 3));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.remove(1, "all", null);
    });
    expect(result.current.events).toEqual(MOCK_EVENTS);
  });

  it("sets error on fetch failure", async () => {
    server.use(
      http.get(`${CALENDAR}/events`, () =>
        HttpResponse.json({ detail: "Server error" }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useEvents(2026, 3));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Server error");
    expect(result.current.events).toEqual([]);
  });
});
