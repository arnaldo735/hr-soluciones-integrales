import type { Role } from "@/backend";
import { RoleKind } from "@/backend";
import { RolesPage } from "@/pages/RolesPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Contract coverage for the Roles management screen.
 *
 * The accepted change introduces editable roles: the three built-in roles stay
 * read-only, while custom roles can be created with a name and a set of allowed
 * modules, renamed/re-scoped, and deleted when no user is assigned. These tests
 * pin the observable contract against a typed local actor mock: the list read,
 * the create payload, the update payload, the delete call and the Spanish
 * translation of the backend's `roleInUse` refusal.
 */

const listRolesMock = vi.fn();
const createRoleMock = vi.fn();
const updateRoleMock = vi.fn();
const deleteRoleMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listRoles: listRolesMock,
      createRole: createRoleMock,
      updateRole: updateRoleMock,
      deleteRole: deleteRoleMock,
    },
    isFetching: false,
  }),
}));

// Keep the real `AuthProvider` that `renderWithProviders` mounts; only the
// token read is stubbed so the write payloads are deterministic.
vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return { ...actual, useAuth: () => useAuthMock() };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function role(overrides: Partial<Role> = {}): Role {
  return {
    id: 10n,
    kind: RoleKind.custom,
    name: "Jefe de taller",
    createdAt: 1_700_000_000_000_000_000n,
    modules: ["workshop", "inventory"],
    ...overrides,
  };
}

function builtinRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 1n,
    kind: RoleKind.builtin,
    name: "Administrador",
    createdAt: 1_700_000_000_000_000_000n,
    modules: [],
    ...overrides,
  };
}

describe("RolesPage", () => {
  beforeEach(() => {
    listRolesMock.mockReset();
    createRoleMock.mockReset();
    updateRoleMock.mockReset();
    deleteRoleMock.mockReset();
    useAuthMock.mockReset();

    useAuthMock.mockReturnValue({
      token: null,
      user: null,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });
    listRolesMock.mockResolvedValue([]);
  });

  it("separates built-in roles from custom roles", async () => {
    listRolesMock.mockResolvedValue([
      builtinRole(),
      builtinRole({ id: 2n, name: "Mecánico", modules: ["workshop"] }),
      role(),
    ]);
    renderWithProviders(<RolesPage />);

    const builtinList = await screen.findByTestId("roles.builtin_list");
    expect(
      within(builtinList).getByRole("heading", { name: "Administrador" }),
    ).toBeInTheDocument();
    expect(
      within(builtinList).getByRole("heading", { name: "Mecánico" }),
    ).toBeInTheDocument();

    const customList = screen.getByTestId("roles.custom_list");
    expect(
      within(customList).getByRole("heading", { name: "Jefe de taller" }),
    ).toBeInTheDocument();
    // The custom role shows its allowed modules by their Spanish labels.
    expect(
      within(customList).getByText("Órdenes de taller"),
    ).toBeInTheDocument();
    expect(within(customList).getByText("Inventario")).toBeInTheDocument();
  });

  it("keeps built-in roles read-only", async () => {
    listRolesMock.mockResolvedValue([builtinRole()]);
    renderWithProviders(<RolesPage />);

    await screen.findByTestId("roles.builtin_list");
    expect(screen.queryByTestId("roles.edit_button.1")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("roles.delete_button.1"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Rol integrado del sistema: no se puede renombrar ni eliminar.",
      ),
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no roles", async () => {
    listRolesMock.mockResolvedValue([]);
    renderWithProviders(<RolesPage />);

    expect(await screen.findByTestId("roles.empty_state")).toBeInTheDocument();
    expect(
      screen.getByText("Aún no hay roles configurados"),
    ).toBeInTheDocument();
  });

  it("creates a custom role with its name and selected modules", async () => {
    createRoleMock.mockResolvedValue(role());
    renderWithProviders(<RolesPage />);

    await screen.findByTestId("roles.page");
    await userEvent.click(screen.getByTestId("roles.create_button"));

    await screen.findByTestId("roles.form_dialog");
    await userEvent.type(
      screen.getByTestId("roles.name_input"),
      "Jefe de taller",
    );
    await userEvent.click(screen.getByTestId("roles.module_checkbox.workshop"));
    await userEvent.click(
      screen.getByTestId("roles.module_checkbox.inventory"),
    );
    await userEvent.click(screen.getByTestId("roles.submit_button"));

    await waitFor(() => expect(createRoleMock).toHaveBeenCalledTimes(1));
    // The session token is null on the Internet Identity admin path.
    expect(createRoleMock).toHaveBeenCalledWith(null, {
      name: "Jefe de taller",
      modules: ["workshop", "inventory"],
    });
  });

  it("refuses to create a role without any module", async () => {
    renderWithProviders(<RolesPage />);

    await screen.findByTestId("roles.page");
    await userEvent.click(screen.getByTestId("roles.create_button"));
    await screen.findByTestId("roles.form_dialog");
    await userEvent.type(screen.getByTestId("roles.name_input"), "Sin módulos");
    await userEvent.click(screen.getByTestId("roles.submit_button"));

    expect(await screen.findByTestId("roles.form_error")).toHaveTextContent(
      "Selecciona al menos un módulo permitido.",
    );
    expect(createRoleMock).not.toHaveBeenCalled();
  });

  it("edits a custom role's name and modules", async () => {
    listRolesMock.mockResolvedValue([role()]);
    updateRoleMock.mockResolvedValue(role({ name: "Jefe de patio" }));
    renderWithProviders(<RolesPage />);

    await screen.findByTestId("roles.custom_list");
    await userEvent.click(screen.getByTestId("roles.edit_button.10"));

    await screen.findByTestId("roles.form_dialog");
    const name = screen.getByTestId("roles.name_input");
    await userEvent.clear(name);
    await userEvent.type(name, "Jefe de patio");
    await userEvent.click(screen.getByTestId("roles.submit_button"));

    await waitFor(() => expect(updateRoleMock).toHaveBeenCalledTimes(1));
    expect(updateRoleMock).toHaveBeenCalledWith(null, 10n, {
      name: "Jefe de patio",
      modules: ["workshop", "inventory"],
    });
  });

  it("deletes a custom role after the confirmation", async () => {
    listRolesMock.mockResolvedValue([role()]);
    deleteRoleMock.mockResolvedValue(true);
    renderWithProviders(<RolesPage />);

    await screen.findByTestId("roles.custom_list");
    await userEvent.click(screen.getByTestId("roles.delete_button.10"));
    await userEvent.click(
      await screen.findByTestId("roles.delete_confirm_button"),
    );

    await waitFor(() => expect(deleteRoleMock).toHaveBeenCalledTimes(1));
    expect(deleteRoleMock).toHaveBeenCalledWith(null, 10n);
  });

  it("explains a roleInUse refusal when deleting an assigned role", async () => {
    listRolesMock.mockResolvedValue([role()]);
    deleteRoleMock.mockRejectedValue(new Error("roleInUse"));
    renderWithProviders(<RolesPage />);

    await screen.findByTestId("roles.custom_list");
    await userEvent.click(screen.getByTestId("roles.delete_button.10"));
    await userEvent.click(
      await screen.findByTestId("roles.delete_confirm_button"),
    );

    expect(await screen.findByTestId("roles.delete_error")).toHaveTextContent(
      "hay usuarios asignados a este rol",
    );
  });

  it("shows an error state when the role list fails to load", async () => {
    listRolesMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<RolesPage />);

    expect(await screen.findByTestId("roles.error_state")).toBeInTheDocument();
    expect(
      screen.getByText("No se pudieron cargar los roles."),
    ).toBeInTheDocument();
  });
});
