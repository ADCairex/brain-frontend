import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import TransfersModal from "@finance/components/TransfersModal";
import { server } from "@/test/msw/server";

const FINANCE = "http://localhost:8000/finance/api";

const accounts = [
  { id: 1, name: "Cuenta A", initial_balance: 1000 },
  { id: 2, name: "Cuenta B", initial_balance: 500 },
];

const onClose = vi.fn();

function renderModal(open = true) {
  render(<TransfersModal open={open} onClose={onClose} accounts={accounts} />);
}

describe("TransfersModal", () => {
  it("renders the title", async () => {
    renderModal();
    expect(await screen.findByText("Transferencias")).toBeInTheDocument();
  });

  it("shows empty state when no transfers", async () => {
    renderModal();
    expect(
      await screen.findByText("No hay transferencias registradas")
    ).toBeInTheDocument();
  });

  it("renders existing transfers from API", async () => {
    server.use(
      http.get(`${FINANCE}/transfers`, () =>
        HttpResponse.json([
          {
            id: 1,
            from_account_id: 1,
            to_account_id: 2,
            amount: 300,
            date: "2025-06-01",
            description: "Pago cuota",
          },
        ])
      )
    );

    renderModal();

    expect(await screen.findByText("Cuenta A")).toBeInTheDocument();
    expect(await screen.findByText("Cuenta B")).toBeInTheDocument();
    expect(await screen.findByText(/Pago cuota/)).toBeInTheDocument();
  });

  it("shows the form when Nueva transferencia is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByText("Nueva transferencia"));

    expect(screen.getByText("Desde")).toBeInTheDocument();
    expect(screen.getByText("Hacia")).toBeInTheDocument();
    expect(screen.getByText("Monto")).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByText("Nueva transferencia"));
    await user.click(screen.getByText("Guardar"));

    expect(
      await screen.findByText("Seleccioná la cuenta origen")
    ).toBeInTheDocument();
    expect(screen.getByText("Ingresá un monto válido")).toBeInTheDocument();
  });

  it("hides form on Cancelar click", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByText("Nueva transferencia"));
    expect(screen.getByText("Desde")).toBeInTheDocument();

    await user.click(screen.getByText("Cancelar"));
    expect(screen.queryByText("Desde")).not.toBeInTheDocument();
  });

  it("creates a transfer and refreshes the list", async () => {
    let listCalls = 0;
    server.use(
      http.get(`${FINANCE}/transfers`, () => {
        listCalls++;
        return HttpResponse.json([]);
      }),
      http.post(`${FINANCE}/transfers`, () =>
        HttpResponse.json(
          {
            id: 99,
            from_account_id: 1,
            to_account_id: 2,
            amount: 150,
            date: "2025-07-01",
            description: null,
          },
          { status: 201 }
        )
      )
    );

    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByText("Nueva transferencia"));

    // Select from account
    const selects = screen.getAllByRole("combobox");
    await user.click(selects[0]);
    await user.click(await screen.findByText("Cuenta A"));

    // Select to account
    await user.click(selects[1]);
    await user.click(await screen.findByText("Cuenta B"));

    // Fill amount
    await user.type(screen.getByRole("spinbutton"), "150");

    await user.click(screen.getByText("Guardar"));

    await waitFor(() => expect(listCalls).toBeGreaterThan(1));
  });

  it("deletes a transfer after confirmation", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    server.use(
      http.get(`${FINANCE}/transfers`, () =>
        HttpResponse.json([
          {
            id: 5,
            from_account_id: 1,
            to_account_id: 2,
            amount: 200,
            date: "2025-05-01",
            description: null,
          },
        ])
      ),
      http.delete(
        `${FINANCE}/transfers/5`,
        () => new HttpResponse(null, { status: 204 })
      )
    );

    const user = userEvent.setup();
    renderModal();

    const deleteBtn = await screen.findByRole("button", { name: "" });
    await user.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
  });

  it("does not delete when confirm is cancelled", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));

    server.use(
      http.get(`${FINANCE}/transfers`, () =>
        HttpResponse.json([
          {
            id: 6,
            from_account_id: 1,
            to_account_id: 2,
            amount: 100,
            date: "2025-04-01",
            description: null,
          },
        ])
      )
    );

    const user = userEvent.setup();
    renderModal();

    const deleteBtn = await screen.findByRole("button", { name: "" });
    await user.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    // transfer still visible
    expect(screen.queryByText("100 €")).not.toBeNull();
  });
});
