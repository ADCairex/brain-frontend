import { useState, useEffect, useCallback } from "react";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@calendar/api/api";

export function useEvents(year, month) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const data = await fetchEvents(start, end);
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data) => {
    await createEvent(data);
    await load();
  };

  const update = async (id, data, scope, occurrenceDate) => {
    await updateEvent(id, data, scope, occurrenceDate);
    await load();
  };

  const remove = async (id, scope, occurrenceDate) => {
    await deleteEvent(id, scope, occurrenceDate);
    await load();
  };

  return { events, loading, error, reload: load, create, update, remove };
}
