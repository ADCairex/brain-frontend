import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import TransactionItem from "@finance/components/TransactionItem";
import { CategoryProvider } from "@finance/context/CategoryContext";

const baseProps = {
  description: "Supermercado",
  amount: 150,
  category: "comida",
  date: "2025-06-15",
  isIncome: false,
};

function renderItem(props = {}) {
  return render(
    <CategoryProvider>
      <TransactionItem {...baseProps} {...props} />
    </CategoryProvider>
  );
}

describe("TransactionItem", () => {
  it("renders description and category", () => {
    renderItem();
    expect(screen.getByText("Supermercado")).toBeInTheDocument();
    expect(screen.getByText(/comida/i)).toBeInTheDocument();
  });

  it("renders expense with minus sign", () => {
    renderItem({ isIncome: false });
    expect(screen.getByText(/-150/)).toBeInTheDocument();
  });

  it("renders income with plus sign", () => {
    renderItem({ isIncome: true, amount: 3000 });
    expect(screen.getByText(/^\+3/)).toBeInTheDocument();
  });

  it("hides amount when hideAmount is true", () => {
    renderItem({ hideAmount: true });
    expect(screen.getByText("****** €")).toBeInTheDocument();
    expect(screen.queryByText(/-150/)).not.toBeInTheDocument();
  });

  it("does not render delete button when onDelete is not provided", () => {
    renderItem();
    expect(
      screen.queryByLabelText(/eliminar supermercado/i)
    ).not.toBeInTheDocument();
  });

  it("shows confirm buttons after first delete click", async () => {
    const user = userEvent.setup();
    renderItem({ onDelete: vi.fn() });

    await user.click(screen.getByLabelText(/eliminar supermercado/i));

    expect(screen.getByLabelText(/confirmar eliminación/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Cancelar eliminación")).toBeInTheDocument();
  });

  it("calls onDelete after confirming", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderItem({ onDelete });

    await user.click(screen.getByLabelText(/eliminar supermercado/i));
    await user.click(screen.getByLabelText(/confirmar eliminación/i));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("cancels delete confirmation on cancel click", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderItem({ onDelete });

    await user.click(screen.getByLabelText(/eliminar supermercado/i));
    await user.click(screen.getByLabelText("Cancelar eliminación"));

    expect(onDelete).not.toHaveBeenCalled();
    expect(
      screen.queryByLabelText(/confirmar eliminación/i)
    ).not.toBeInTheDocument();
  });
});
