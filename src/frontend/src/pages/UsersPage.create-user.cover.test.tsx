import type { Role, UserListItem } from "@/backend";
import { RoleKind } from "@/backend";
import { UsersPage } from "@/pages/UsersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted create-user flow.
 *
 * The accepted change lets an administrator create a user from Configuración
 * choosing nombre, usuario, rol and a temporary password, stores exactly the
 * chosen role, and surfaces creation errors clearly in Spanish. These tests
 * assert the accepted observable behavior that the characterization suite does
 * not already pin:
 *
 * - choosing a non-default role sends that role id and the created user is
 *   rendered with the role the backend returns;
 * - a duplicate username shows a clear Spanish message and creates nothing;
 * - an empty required field is rejected before any backend call;
 * - a successful creation reveals the temporary password once so it can be
 *   handed to the new user.
 *
 * The backend actor is a typed local mock; no network is involved. The real
 * canister is exercised by the PocketIC lane in `app/test/pocketic`.
 */

const listUsersPageMock = vi.fn();
const listRolesMock = vi.fn();
const createUserMock = vi.fn();
const useRoleMock = vi.fn();
const useAuthMock = vi.fn();
// `vi.mock` factories are hoisted above the module body, so the toast spies must
// be created with `vi.hoisted` to be initialized before the factory runs.
const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

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

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

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

async function fillCreateForm(input: {
  name?: string;
  username?: string;
  password?: string;
}) {
  if (input.name !== undefined) {
    await userEvent.type(
      screen.getByTestId("users.create_name_input"),
      input.name,
    );
  }
  if (input.username !== undefined) {
    await userEvent.type(
      screen.getByTestId("users.create_username_input"),
      input.username,
    );
  }
  if (input.password !== undefined) {
    await userEvent.type(
      screen.getByTestId("users.create_password_input"),
      input.password,
    );
  }
}

describe("UsersPage create-user flow (cover)", () => {
  beforeEach(() => {
    listUsersPageMock.mockReset();
    listRolesMock.mockReset();
    createUserMock.mockReset();
    useRoleMock.mockReset();
    useAuthMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

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

  it("creates a user with the explicitly chosen role and renders that role", async () => {
    // The administrator picks Administrador (id 0) explicitly, which is not the
    // default. The chosen role must reach the backend and be rendered back.
    const created = user({
      name: "Nuevo Admin",
      roleName: "Administrador",
      roleId: 0n,
      username: "nuevo.admin",
    });
    listUsersPageMock
      .mockResolvedValueOnce(userPage([]))
      .mockResolvedValue(userPage([created]));
    createUserMock.mockResolvedValue(created);

    renderWithProviders(<UsersPage />);
    await openCreateDialog();

    await fillCreateForm({
      name: "Nuevo Admin",
      username: "nuevo.admin",
      password: "temporal-123",
    });

    // Open the role selector and choose Administrador.
    await userEvent.click(screen.getByTestId("users.create_role_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Administrador" }),
    );

    await userEvent.click(screen.getByTestId("users.create_submit_button"));

    await waitFor(() => expect(createUserMock).toHaveBeenCalledTimes(1));
    expect(createUserMock).toHaveBeenCalledWith(
      null,
      "nuevo.admin",
      "Nuevo Admin",
      0n,
      "temporal-123",
    );

    const table = await screen.findByTestId("users.table");
    expect(within(table).getByText("Nuevo Admin")).toBeInTheDocument();
    expect(within(table).getByText("Administrador")).toBeInTheDocument();
  });

  it("shows a clear Spanish message for a duplicate username and creates nothing", async () => {
    createUserMock.mockRejectedValue(
      new Error("Ya existe un usuario con ese nombre de acceso"),
    );

    renderWithProviders(<UsersPage />);
    await openCreateDialog();

    await fillCreateForm({
      name: "Nuevo Mecánico",
      username: "nuevo.mec",
      password: "temporal-123",
    });
    await userEvent.click(screen.getByTestId("users.create_submit_button"));

    const error = await screen.findByTestId("users.create_error");
    expect(error).toHaveTextContent("Ese usuario de acceso ya existe");
    // The dialog stays open with the form intact so the administrator can fix
    // the username, and no user was added to the list.
    expect(screen.getByTestId("users.create_dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("users.table")).not.toBeInTheDocument();
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only required field before calling the backend", async () => {
    renderWithProviders(<UsersPage />);
    await openCreateDialog();

    // Whitespace passes the input's native `required` constraint but the app
    // trims it, so the form's own validation must reject it.
    await fillCreateForm({
      name: "   ",
      username: "nuevo.mec",
      password: "temporal-123",
    });
    await userEvent.click(screen.getByTestId("users.create_submit_button"));

    expect(await screen.findByTestId("users.create_error")).toHaveTextContent(
      "Completa el nombre, el usuario, el rol y la contraseña",
    );
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("reveals the temporary password once after creating the user", async () => {
    createUserMock.mockResolvedValue(user());

    renderWithProviders(<UsersPage />);
    await openCreateDialog();

    await fillCreateForm({
      name: "Nuevo Mecánico",
      username: "nuevo.mec",
      password: "temporal-123",
    });
    await userEvent.click(screen.getByTestId("users.create_submit_button"));

    // The one-time panel shows the password the administrator must hand over.
    const panel = await screen.findByTestId("users.temp_password_panel");
    expect(
      within(panel).getByTestId("users.temp_password_value"),
    ).toHaveTextContent("temporal-123");
    expect(within(panel).getByText("Nuevo Mecánico")).toBeInTheDocument();
    expect(toastSuccessMock).toHaveBeenCalledWith("Usuario creado");
  });
});
