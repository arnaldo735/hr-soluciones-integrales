import type { Role, UserListItem } from "@/backend";
import { RoleKind } from "@/backend";
import { UsersPage } from "@/pages/UsersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Contract coverage for the Usuarios management screen.
 *
 * The accepted change introduces password-based accounts: an administrator
 * creates a user with a username, a role and a temporary password, edits the
 * role, activates or deactivates the account, resets the password (revealed
 * once) and deletes users. These tests exercise the real page against a typed
 * local actor mock, so they pin the observable contract the backend must honor:
 * the list read, the create payload, the role update, the activation toggle,
 * the one-time password reveal and the delete confirmation.
 */

const listUsersPageMock = vi.fn();
const listRolesMock = vi.fn();
const createUserMock = vi.fn();
const updateUserRoleMock = vi.fn();
const setUserActiveMock = vi.fn();
const resetUserPasswordMock = vi.fn();
const deleteUserMock = vi.fn();
const useRoleMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listUsersPage: listUsersPageMock,
      listRoles: listRolesMock,
      createUser: createUserMock,
      updateUserRole: updateUserRoleMock,
      setUserActive: setUserActiveMock,
      resetUserPassword: resetUserPasswordMock,
      deleteUser: deleteUserMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

// The page reads the session token and the caller's own user id from the auth
// context. Mocking only `useAuth` (keeping the real `AuthProvider` that
// `renderWithProviders` mounts) keeps the tests on the page's contract instead
// of the login flow, and lets the self-delete guard be exercised.
vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return { ...actual, useAuth: () => useAuthMock() };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function roleState(isAdmin: boolean) {
  return {
    role: isAdmin ? "admin" : "user",
    isAdmin,
    isLoading: false,
    isError: false,
    modules: null,
    roleName: isAdmin ? "Administrador" : "Mecánico",
    refetch: vi.fn(),
  };
}

function user(overrides: Partial<UserListItem> = {}): UserListItem {
  return {
    id: 1n,
    roleName: "Mecánico",
    active: true,
    username: "juan.perez",
    name: "Juan Pérez",
    createdAt: 1_700_000_000_000_000_000n,
    roleId: 2n,
    ...overrides,
  };
}

function role(overrides: Partial<Role> = {}): Role {
  return {
    id: 2n,
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

describe("UsersPage", () => {
  beforeEach(() => {
    listUsersPageMock.mockReset();
    listRolesMock.mockReset();
    createUserMock.mockReset();
    updateUserRoleMock.mockReset();
    setUserActiveMock.mockReset();
    resetUserPasswordMock.mockReset();
    deleteUserMock.mockReset();
    useRoleMock.mockReset();
    useAuthMock.mockReset();

    useRoleMock.mockReturnValue(roleState(true));
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
    listRolesMock.mockResolvedValue([
      role({ id: 1n, name: "Administrador", modules: [] }),
      role({ id: 2n, name: "Mecánico", modules: ["inventory"] }),
    ]);
  });

  it("lists users with their username, role and active state", async () => {
    listUsersPageMock.mockResolvedValue(
      userPage([
        user(),
        user({
          id: 2n,
          name: "Ana Gómez",
          username: "ana.gomez",
          roleName: "Administrador",
          roleId: 1n,
          active: false,
        }),
      ]),
    );
    renderWithProviders(<UsersPage />);

    const table = await screen.findByTestId("users.table");
    expect(within(table).getByText("Juan Pérez")).toBeInTheDocument();
    expect(within(table).getByText("juan.perez")).toBeInTheDocument();
    expect(within(table).getByText("Ana Gómez")).toBeInTheDocument();
    expect(within(table).getByText("ana.gomez")).toBeInTheDocument();
    expect(within(table).getByText("Activo")).toBeInTheDocument();
    expect(within(table).getByText("Inactivo")).toBeInTheDocument();
  });

  it("shows an empty state when there are no users", async () => {
    listUsersPageMock.mockResolvedValue(userPage([]));
    renderWithProviders(<UsersPage />);

    expect(await screen.findByTestId("users.empty_state")).toBeInTheDocument();
    expect(screen.getByText("Aún no hay usuarios")).toBeInTheDocument();
  });

  it("creates a user with the username, role and temporary password", async () => {
    createUserMock.mockResolvedValue(
      user({ id: 7n, name: "Nuevo Mecánico", username: "nuevo.mec" }),
    );
    renderWithProviders(<UsersPage />);

    await screen.findByTestId("users.page");
    await userEvent.click(screen.getByTestId("users.create_button"));

    await screen.findByTestId("users.create_dialog");
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
    await userEvent.click(screen.getByTestId("users.create_role_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Mecánico" }),
    );
    await userEvent.click(screen.getByTestId("users.create_submit_button"));

    await waitFor(() => expect(createUserMock).toHaveBeenCalledTimes(1));
    // The session token is null on the Internet Identity admin path.
    expect(createUserMock).toHaveBeenCalledWith(
      null,
      "nuevo.mec",
      "Nuevo Mecánico",
      2n,
      "temporal-123",
    );
  });

  it("shows the temporary password once after creating a user", async () => {
    createUserMock.mockResolvedValue(
      user({ id: 7n, name: "Nuevo Mecánico", username: "nuevo.mec" }),
    );
    renderWithProviders(<UsersPage />);

    await screen.findByTestId("users.page");
    await userEvent.click(screen.getByTestId("users.create_button"));
    await screen.findByTestId("users.create_dialog");
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

    const panel = await screen.findByTestId("users.temp_password_panel");
    expect(
      within(panel).getByTestId("users.temp_password_value"),
    ).toHaveTextContent("temporal-123");
    // The panel can be dismissed, and the password is not shown anywhere else.
    await userEvent.click(
      screen.getByTestId("users.temp_password_close_button"),
    );
    expect(
      screen.queryByTestId("users.temp_password_panel"),
    ).not.toBeInTheDocument();
  });

  it("reports a duplicate username instead of creating the user", async () => {
    createUserMock.mockRejectedValue(new Error("DuplicateUsername"));
    renderWithProviders(<UsersPage />);

    await screen.findByTestId("users.page");
    await userEvent.click(screen.getByTestId("users.create_button"));
    await screen.findByTestId("users.create_dialog");
    await userEvent.type(
      screen.getByTestId("users.create_name_input"),
      "Repetido",
    );
    await userEvent.type(
      screen.getByTestId("users.create_username_input"),
      "juan.perez",
    );
    await userEvent.type(
      screen.getByTestId("users.create_password_input"),
      "temporal-123",
    );
    await userEvent.click(screen.getByTestId("users.create_submit_button"));

    expect(await screen.findByTestId("users.create_error")).toHaveTextContent(
      "Ese usuario de acceso ya existe",
    );
  });

  it("changes a user's role through the role dialog", async () => {
    listUsersPageMock.mockResolvedValue(userPage([user()]));
    updateUserRoleMock.mockResolvedValue(user({ roleId: 1n }));
    renderWithProviders(<UsersPage />);

    await screen.findByTestId("users.table");
    await userEvent.click(screen.getByTestId("users.edit_button.1"));

    await screen.findByTestId("users.role_dialog");
    await userEvent.click(screen.getByTestId("users.role_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Administrador" }),
    );
    await userEvent.click(screen.getByTestId("users.role_submit_button"));

    await waitFor(() => expect(updateUserRoleMock).toHaveBeenCalledTimes(1));
    expect(updateUserRoleMock).toHaveBeenCalledWith(null, 1n, 1n);
  });

  it("toggles a user's active state", async () => {
    listUsersPageMock.mockResolvedValue(userPage([user({ active: true })]));
    setUserActiveMock.mockResolvedValue(user({ active: false }));
    renderWithProviders(<UsersPage />);

    await screen.findByTestId("users.table");
    await userEvent.click(screen.getByTestId("users.cancel_button.1"));

    await waitFor(() => expect(setUserActiveMock).toHaveBeenCalledTimes(1));
    expect(setUserActiveMock).toHaveBeenCalledWith(null, 1n, false);
  });

  it("resets a user's password and reveals the new temporary one", async () => {
    listUsersPageMock.mockResolvedValue(userPage([user()]));
    resetUserPasswordMock.mockResolvedValue({
      userId: 1n,
      temporaryPassword: "reset-456",
    });
    renderWithProviders(<UsersPage />);

    await screen.findByTestId("users.table");
    await userEvent.click(screen.getByTestId("users.save_button.1"));

    await waitFor(() => expect(resetUserPasswordMock).toHaveBeenCalledTimes(1));
    expect(resetUserPasswordMock).toHaveBeenCalledWith(null, 1n);
    const panel = await screen.findByTestId("users.temp_password_panel");
    expect(
      within(panel).getByTestId("users.temp_password_value"),
    ).toHaveTextContent("reset-456");
  });

  it("deletes a user after the confirmation", async () => {
    listUsersPageMock.mockResolvedValue(userPage([user()]));
    deleteUserMock.mockResolvedValue(true);
    renderWithProviders(<UsersPage />);

    await screen.findByTestId("users.table");
    // The shared table asks for confirmation first, then the page's own dialog.
    await userEvent.click(screen.getByTestId("users.delete_button.1"));
    await userEvent.click(await screen.findByTestId("users.confirm_button"));
    await userEvent.click(
      await screen.findByTestId("users.delete_confirm_button"),
    );

    await waitFor(() => expect(deleteUserMock).toHaveBeenCalledTimes(1));
    expect(deleteUserMock).toHaveBeenCalledWith(null, 1n);
  });

  it("refuses to delete the caller's own admin account", async () => {
    // The session user is the caller; the page must block the self-delete
    // before it ever reaches the backend.
    useAuthMock.mockReturnValue({
      token: null,
      user: {
        userId: 1n,
        username: "juan.perez",
        name: "Juan Pérez",
        roleId: 1n,
        roleName: "Administrador",
        modules: [],
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });
    listUsersPageMock.mockResolvedValue(userPage([user({ id: 1n })]));
    renderWithProviders(<UsersPage />);

    await screen.findByTestId("users.table");
    await userEvent.click(screen.getByTestId("users.delete_button.1"));
    await userEvent.click(await screen.findByTestId("users.confirm_button"));
    await userEvent.click(
      await screen.findByTestId("users.delete_confirm_button"),
    );

    expect(await screen.findByTestId("users.delete_error")).toHaveTextContent(
      "No puedes eliminar tu propia cuenta",
    );
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("searches users by name or username", async () => {
    listUsersPageMock.mockResolvedValue(userPage([user()]));
    renderWithProviders(<UsersPage />);

    await screen.findByTestId("users.table");
    await userEvent.type(screen.getByTestId("users.search_input"), "ana");

    await waitFor(() =>
      expect(listUsersPageMock).toHaveBeenCalledWith("ana", 0n, 25n),
    );
  });

  it("shows the roles error when the role list fails to load", async () => {
    listRolesMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<UsersPage />);

    expect(await screen.findByTestId("users.roles_error")).toBeInTheDocument();
  });
});
