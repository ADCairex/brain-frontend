import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { CategoryProvider } from "@finance/context/CategoryContext";
import CategoryManager from "@finance/components/CategoryManager";

const onClose = vi.fn();

function renderManager(open = true) {
  render(
    <CategoryProvider>
      <CategoryManager open={open} onClose={onClose} />
    </CategoryProvider>
  );
}

describe("CategoryManager", () => {
  it("renders the title", async () => {
    renderManager();
    expect(await screen.findByText("Categorías")).toBeInTheDocument();
  });

  it("shows default categories from API", async () => {
    renderManager();
    expect(await screen.findByText("Comida")).toBeInTheDocument();
    expect(await screen.findByText("Transporte")).toBeInTheDocument();
    expect(await screen.findByText("Casa")).toBeInTheDocument();
    expect(await screen.findByText("Otros")).toBeInTheDocument();
  });

  it("shows Nueva categoría button", async () => {
    renderManager();
    expect(
      await screen.findByRole("button", { name: /nueva categoría/i })
    ).toBeInTheDocument();
  });

  it("opens add form when Nueva categoría is clicked", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      await screen.findByRole("button", { name: /nueva categoría/i })
    );

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Emoji")).toBeInTheDocument();
    expect(screen.getByLabelText("Color")).toBeInTheDocument();
  });

  it("shows validation error when name is empty", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      await screen.findByRole("button", { name: /nueva categoría/i })
    );
    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(
      await screen.findByText("Ingresá un nombre válido")
    ).toBeInTheDocument();
  });

  it("shows validation error when emoji is empty", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      await screen.findByRole("button", { name: /nueva categoría/i })
    );
    await user.type(screen.getByLabelText("Nombre"), "Mascotas");
    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(await screen.findByText("Elegí un emoji")).toBeInTheDocument();
  });

  it("creates a category successfully", async () => {
    server.use(
      http.post("http://localhost:8000/finance/api/categories", () =>
        HttpResponse.json(
          {
            id: 10,
            user_id: 1,
            name: "mascotas",
            label: "Mascotas",
            emoji: "🐶",
            color: "#ff9900",
            is_default: false,
            is_deletable: true,
            sort_order: 10,
          },
          { status: 201 }
        )
      )
    );

    const user = userEvent.setup();
    renderManager();

    await user.click(
      await screen.findByRole("button", { name: /nueva categoría/i })
    );
    await user.type(screen.getByLabelText("Nombre"), "Mascotas");
    await user.type(screen.getByLabelText("Emoji"), "🐶");
    await user.click(screen.getByRole("button", { name: /crear/i }));

    // Form should close after successful create
    await waitFor(() => {
      expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
    });
  });

  it("shows slug preview while typing", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      await screen.findByRole("button", { name: /nueva categoría/i })
    );
    await user.type(screen.getByLabelText("Nombre"), "Educación Extra");

    expect(screen.getByText(/educacion-extra/)).toBeInTheDocument();
  });

  it("hides form when Cancelar is clicked", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      await screen.findByRole("button", { name: /nueva categoría/i })
    );
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
  });

  it("shows edit buttons for each category", async () => {
    renderManager();
    const editButtons = await screen.findAllByLabelText(/editar/i);
    expect(editButtons.length).toBeGreaterThanOrEqual(9);
  });

  it("opens edit form when edit button is clicked", async () => {
    const user = userEvent.setup();
    renderManager();

    const editBtn = (await screen.findAllByLabelText(/editar comida/i))[0];
    await user.click(editBtn);

    expect(screen.getByText("Editar categoría")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Comida");
  });

  it("updates a category successfully", async () => {
    server.use(
      http.put("http://localhost:8000/finance/api/categories/:id", () =>
        HttpResponse.json({
          id: 1,
          user_id: 1,
          name: "comida",
          label: "Comida Actualizada",
          emoji: "🍕",
          color: "#f97316",
          is_default: true,
          is_deletable: true,
          sort_order: 1,
        })
      )
    );

    const user = userEvent.setup();
    renderManager();

    const editBtn = (await screen.findAllByLabelText(/editar comida/i))[0];
    await user.click(editBtn);

    const nameInput = screen.getByLabelText("Nombre");
    await user.clear(nameInput);
    await user.type(nameInput, "Comida Actualizada");
    await user.click(screen.getByRole("button", { name: /actualizar/i }));

    await waitFor(() => {
      expect(screen.queryByText("Editar categoría")).not.toBeInTheDocument();
    });
  });

  it("does not show delete button for otros", async () => {
    renderManager();
    await screen.findByText("Otros");

    // otros should not have a delete button
    expect(screen.queryByLabelText("Eliminar Otros")).not.toBeInTheDocument();
  });

  it("shows delete confirmation when delete is clicked", async () => {
    const user = userEvent.setup();
    renderManager();

    const deleteBtn = (await screen.findAllByLabelText(/eliminar comida/i))[0];
    await user.click(deleteBtn);

    expect(
      screen.getByLabelText(/confirmar eliminar comida/i)
    ).toBeInTheDocument();
  });

  it("cancels delete when X is clicked", async () => {
    const user = userEvent.setup();
    renderManager();

    const deleteBtn = (await screen.findAllByLabelText(/eliminar comida/i))[0];
    await user.click(deleteBtn);

    await user.click(screen.getByLabelText("Cancelar"));

    expect(
      screen.queryByLabelText(/confirmar eliminar/i)
    ).not.toBeInTheDocument();
  });

  it("deletes a category after confirmation", async () => {
    server.use(
      http.delete(
        "http://localhost:8000/finance/api/categories/:id",
        () => new HttpResponse(null, { status: 204 })
      )
    );

    const user = userEvent.setup();
    renderManager();

    const deleteBtn = (await screen.findAllByLabelText(/eliminar comida/i))[0];
    await user.click(deleteBtn);
    await user.click(screen.getByLabelText(/confirmar eliminar comida/i));

    // After delete, refresh is called — confirmation disappears
    await waitFor(() => {
      expect(
        screen.queryByLabelText(/confirmar eliminar/i)
      ).not.toBeInTheDocument();
    });
  });

  it("shows API error on failed create", async () => {
    server.use(
      http.post("http://localhost:8000/finance/api/categories", () =>
        HttpResponse.json(
          { detail: "Ya existe una categoría con ese nombre" },
          { status: 409 }
        )
      )
    );

    const user = userEvent.setup();
    renderManager();

    await user.click(
      await screen.findByRole("button", { name: /nueva categoría/i })
    );
    await user.type(screen.getByLabelText("Nombre"), "comida");
    await user.type(screen.getByLabelText("Emoji"), "🍔");
    await user.click(screen.getByRole("button", { name: /crear/i }));

    expect(
      await screen.findByText("Ya existe una categoría con ese nombre")
    ).toBeInTheDocument();
  });
});
