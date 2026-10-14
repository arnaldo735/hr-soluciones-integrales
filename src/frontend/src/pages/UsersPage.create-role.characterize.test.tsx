import type { Role, UserListItem } from "@/backend";
import { RoleKind } from "@/backend";
import { UsersPage } from "@/pages/UsersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the create-user role contract.
 *
 * The accepted change makes an administrator create a user with a chosen role
 * and a temporary password, and the chosen role must be the one the created
 * user carries. These tests protect the working frontend behavior around that
 * change without asserting the reported defect:
 *
 * - the create dialog defaults to Mecánico (id 1), never to Administrador
 *   (id 0), so a new user is not silently promoted;
 * - submitting without touching the role selector sends the default role id;
 * - the role the backend returns for the created user is what the list renders;
 * - a too-short temporary password is rejected before any backend call.
 *
 * The backend actor is a typed local mock; no network is involved.
 */

const listUsersPageMock = vi.fn();
const listRolesMock = vi.fn();
const createUserMock = vi.fn();
const useRoleMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listUsersPage: listUsersPageMock,
      listRoles: listRolesMock,
      createUser: createUserMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return { ...actual, useAuth: () => useAuthMock() };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function roleState() {
  return {
    role: "admin",
    isAdmin: true,
    isLoading: false,
    isError: false,
    modules: null,
    roleName: "Administrador",
    refetch: vi.fn(),
  };
}

function user(overrides: Partial<UserListItem> = {}): UserListItem {
  return {
    id: 7n,
    roleName: "Mecánico",
    active: true,
    username: "nuevo.mec",
    name: "Nuevo Mecánico",
    createdAt: 1_700_000_000_000_000_000n,
    roleId: 1n,
    ...overrides,
  };
}

function role(overrides: Partial<Role> = {}): Role {
  return {
    id: 1n,
    kind: RoleKind.builtin,
    name: "Mecánico",
    createdAt: 1_700_000_000_000_000_000n,
    modules: ["inventory"],
    ...overrides,
  };
}

function userPage(items: UserListItem[], total = BigInt(items.length)) {
  return { items, total, offset: 0n, limit: 25n };
}

async function openCreateDialog() {
  await screen.findByTestId("users.page");
  await userEvent.click(screen.getByTestId("users.create_button"));
  await screen.findByTestId("users.create_dialog");
}

describe("UsersPage create-user role (characterization)", () => {
  beforeEach(() => {
    listUsersPageMock.mockReset();
    listRolesMock.mockReset();
    createUserMock.mockReset();
    useRoleMock.mockReset();
    useAuthMock.mockReset();

    useRoleMock.mockReturnValue(roleState());
    useAuthMock.mockReturnValue({
      token: null,
      user: null,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });
    listUsersPageMock.mockResolvedValue(userPage([]));
    // Administrador is id 0 and Mecánico is id 1, so a default that picked the
    // first role by id would wrongly select Administrador.
    listRolesMock.mockResolvedValue([
      role({ id: 0n, name: "Administrador", modules: [] }),
      role({ id: 1n, name: "Mecánico", modules: ["inventory"] }),
    ]);
  });

  it("defaults the create dialog's role to Mecánico, not Administrador", async () => {
    renderWithProviders(<UsersPage />);
    await openCreateDialog();

    // The trigger shows the selected role's label; the default must be Mecánico.
    const trigger = screen.getByTestId("users.create_role_select");
    expect(within(trigger).getByText("Mecánico")).toBeInTheDocument();
    expect(
      within(trigger).queryByText("Administrador"),
    ).not.toBeInTheDocument();
  });

  it("sends the default Mecánico role id when the selector is left untouched", async () => {
    createUserMock.mockResolvedValue(user());
    renderWithProviders(<UsersPage />);
    await openCreateDialog();

    await userEvent.type(
      screen.getByTestId("users.create_name_input"),
      "Nuevo Mecánico",
    );
    await userEvent.type(
      screen.getByTestId("users.create_username_input"),
      "nuevo.mec",
    );
    await userEvent.type(
      screen.getByTestId("users.create_password_input"),
      "temporal-123",
    );
    await userEvent.click(screen.getByTestId("users.create_submit_button"));

    await waitFor(() => expect(createUserMock).toHaveBeenCalledTimes(1));
    // The default role id (Mecánico = 1) reaches the backend, not 0.
    expect(createUserMock).toHaveBeenCalledWith(
      null,
      "nuevo.mec",
      "Nuevo Mecánico",
      1n,
      "temporal-123",
    );
  });

  it("renders the role the backend returns for the created user", async () => {
    // The list is empty until the create succeeds, then the refetch returns the
    // new user with the role the backend assigned.
    listUsersPageMock
      .mockResolvedValueOnce(userPage([]))
      .mockResolvedValue(
        userPage([user({ roleName: "Mecánico", roleId: 1n })]),
      );
    createUserMock.mockResolvedValue(
      user({ roleName: "Mecánico", roleId: 1n }),
    );
    renderWithProviders(<UsersPage />);
    await openCreateDialog();

    await userEvent.type(
      screen.getByTestId("users.create_name_input"),
      "Nuevo Mecánico",
    );
    await userEvent.type(
      screen.getByTestId("users.create_username_input"),
      "nuevo.mec",
    );
    await userEvent.type(
      screen.getByTestId("users.create_password_input"),
      "temporal-123",
    );
    await userEvent.click(screen.getByTestId("users.create_submit_button"));

    const table = await screen.findByTestId("users.table");
    expect(within(table).getByText("Nuevo Mecánico")).toBeInTheDocument();
    expect(within(table).getByText("Mecánico")).toBeInTheDocument();
    expect(within(table).queryByText("Administrador")).not.toBeInTheDocument();
  });

  it("rejects a temporary password shorter than six characters before calling the backend", async () => {
    renderWithProviders(<UsersPage />);
    await openCreateDialog();

    await userEvent.type(
      screen.getByTestId("users.create_name_input"),
      "Nuevo Mecánico",
    );
    await userEvent.type(
      screen.getByTestId("users.create_username_input"),
      "nuevo.mec",
    );
    await userEvent.type(
      screen.getByTestId("users.create_password_input"),
      "corta",
    );
    await userEvent.click(screen.getByTestId("users.create_submit_button"));

    expect(await screen.findByTestId("users.create_error")).toHaveTextContent(
      "al menos 6 caracteres",
    );
    expect(createUserMock).not.toHaveBeenCalled();
  });
});
