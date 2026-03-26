import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "@shell/HomePage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders module headings", () => {
    renderHomePage();
    expect(screen.getByText("Módulo de Finanzas")).toBeInTheDocument();
    expect(screen.getByText("Notas")).toBeInTheDocument();
    expect(screen.getByText("Tareas")).toBeInTheDocument();
  });

  it("renders Finanzas module as active", () => {
    renderHomePage();
    const btn = screen.getByRole("button", {
      name: /ir a módulo de finanzas/i,
    });
    expect(btn).not.toBeDisabled();
  });

  it("renders Notas and Tareas as disabled", () => {
    renderHomePage();
    const notasBtn = screen.getByRole("button", {
      name: /notas — próximamente/i,
    });
    const tareasBtn = screen.getByRole("button", {
      name: /tareas — próximamente/i,
    });
    expect(notasBtn).toBeDisabled();
    expect(tareasBtn).toBeDisabled();
  });

  it("navigates to /finance when Finanzas is clicked", async () => {
    const user = userEvent.setup();
    renderHomePage();
    const btn = screen.getByRole("button", {
      name: /ir a módulo de finanzas/i,
    });
    await user.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith("/finance");
  });

  it("does not navigate when inactive module is clicked", async () => {
    const user = userEvent.setup();
    renderHomePage();
    const notasBtn = screen.getByRole("button", {
      name: /notas — próximamente/i,
    });
    await user.click(notasBtn);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
