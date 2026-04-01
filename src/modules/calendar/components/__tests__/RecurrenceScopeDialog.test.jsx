import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import RecurrenceScopeDialog from "@calendar/components/RecurrenceScopeDialog";

describe("RecurrenceScopeDialog", () => {
  const baseProps = {
    open: true,
    action: "delete",
    onSelect: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders delete title", () => {
    render(<RecurrenceScopeDialog {...baseProps} />);
    expect(
      screen.getByText("¿Qué eventos quieres eliminar?")
    ).toBeInTheDocument();
  });

  it("renders edit title", () => {
    render(<RecurrenceScopeDialog {...baseProps} action="edit" />);
    expect(
      screen.getByText("¿Qué eventos quieres editar?")
    ).toBeInTheDocument();
  });

  it("renders all three scope options", () => {
    render(<RecurrenceScopeDialog {...baseProps} />);
    expect(screen.getByText("Solo este evento")).toBeInTheDocument();
    expect(screen.getByText("Este y los siguientes")).toBeInTheDocument();
    expect(screen.getByText("Todos los eventos")).toBeInTheDocument();
  });

  it("calls onSelect with 'single' when clicking first option", async () => {
    const onSelect = vi.fn();
    render(<RecurrenceScopeDialog {...baseProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByText("Solo este evento"));
    expect(onSelect).toHaveBeenCalledWith("single");
  });

  it("calls onSelect with 'future'", async () => {
    const onSelect = vi.fn();
    render(<RecurrenceScopeDialog {...baseProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByText("Este y los siguientes"));
    expect(onSelect).toHaveBeenCalledWith("future");
  });

  it("calls onSelect with 'all'", async () => {
    const onSelect = vi.fn();
    render(<RecurrenceScopeDialog {...baseProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByText("Todos los eventos"));
    expect(onSelect).toHaveBeenCalledWith("all");
  });
});
