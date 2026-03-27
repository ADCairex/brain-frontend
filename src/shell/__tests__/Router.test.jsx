import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "@shell/Router";

describe("Router (App)", () => {
  it("renders the login page at /login route", async () => {
    // BrowserRouter uses window.location — set it to /login
    window.history.pushState({}, "", "/login");

    render(<App />);

    // Login page renders the email/password form inputs
    await waitFor(() => {
      expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0);
    });
  });
});
