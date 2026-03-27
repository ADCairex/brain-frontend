import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { register } from "@auth/api/api";

describe("auth api – uncovered functions", () => {
  it("register calls POST /auth/register", async () => {
    let postBody = null;
    server.use(
      http.post("http://localhost:8000/auth/register", async ({ request }) => {
        postBody = await request.json();
        return HttpResponse.json({ ok: true });
      })
    );

    const result = await register("user@example.com", "password123");
    expect(result).toMatchObject({ ok: true });
    expect(postBody).toMatchObject({
      email: "user@example.com",
      password: "password123",
    });
  });
});
