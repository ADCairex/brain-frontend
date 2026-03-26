import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Layout from "@shell/Layout";

function renderLayout(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={
            <Layout>
              <div>child content</div>
            </Layout>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("Layout", () => {
  it("renders children", () => {
    renderLayout("/");
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("hides back button on home path (/)", () => {
    renderLayout("/");
    expect(
      screen.queryByRole("link", { name: /volver al inicio/i })
    ).not.toBeInTheDocument();
  });

  it("shows back button on non-home path (/finance)", () => {
    renderLayout("/finance");
    expect(
      screen.getByRole("link", { name: /volver al inicio/i })
    ).toBeInTheDocument();
  });

  it("back button links to /", () => {
    renderLayout("/finance");
    const link = screen.getByRole("link", { name: /volver al inicio/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
