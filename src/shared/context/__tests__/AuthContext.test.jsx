import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { AuthProvider, useAuth } from "@shared/context/AuthContext";
import { server } from "@/test/msw/server";

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthProvider", () => {
  it("starts with user undefined (loading state)", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeUndefined();
  });

  it("sets user after successful getMe", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeUndefined();

    await waitFor(() => expect(result.current.user).not.toBeUndefined());

    expect(result.current.user).toEqual({ id: 1, email: "user@example.com" });
  });

  it("sets user to null when getMe fails", async () => {
    server.use(
      http.get("http://localhost:8000/auth/me", () =>
        HttpResponse.json({}, { status: 401 })
      )
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).not.toBeUndefined());

    expect(result.current.user).toBeNull();
  });

  it("logout sets user to null", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() =>
      expect(result.current.user).toEqual({ id: 1, email: "user@example.com" })
    );

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  it("provides setUser to children", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() =>
      expect(result.current.user).toEqual({ id: 1, email: "user@example.com" })
    );

    act(() => {
      result.current.setUser({ id: 2, email: "other@example.com" });
    });

    expect(result.current.user).toEqual({ id: 2, email: "other@example.com" });
  });
});
