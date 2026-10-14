import type { LoginResult, Role, SessionInfo, UserListItem } from "@/backend";
import { RoleKind } from "@/backend";
import { LoginScreen } from "@/components/LoginScreen";
import { UsersPage } from "@/pages/UsersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Critical journey cover for the accepted create-user flow.
 *
 * The accepted requirement is that a freshly created user can sign in with the
 * username and temporary password the administrator chose. The other suites
 * pin the create dialog and the login screen separately, but each mocks the
 * other half: the create suite never logs in, and `LoginScreen.test.tsx` mocks
 * `useAuth` so it never reaches the real `AuthProvider.login` → `actor.login`
 * path. This file drives both halves through the real auth provider against a
 * single typed actor mock, so the credentials the create form sends are the
 * exact ones the login form accepts.
 *
 * The backend actor is a typed local mock; no network is involved. The real
 * canister is exercised by the PocketIC lane in `app/test/pocketic`.
 */

const listUsersPageMock = vi.fn();
const listRolesMock = vi.fn();
const createUserMock = vi.fn();
const loginMock = vi.fn();
const getSessionMock = vi.fn();
const logoutMock = vi.fn();
const useRoleMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listUsersPage: listUsersPageMock,
      listRoles: listRolesMock,
      createUser: createUserMock,
      login: loginMock,
      getSession: getSessionMock,
      logout: logoutMock,
    },
    isFetching: false,
    isReady: true,
  }),
}));

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: null, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    login: vi.fn(),
    clear: vi.fn(),
    identity: undefined,
  }),
}));

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

function session(overrides: Partial<SessionInfo> = {}): SessionInfo {
  return {
    userId: 7n,
    username: "nuevo.mec",
    name: "Nuevo Mecánico",
    roleId: 1n,
    roleName: "Mecánico",
    modules: ["inventory"],
    ...overrides,
  };
}

function userPage(items: UserListItem[], total = BigInt(items.length)) {
  return { items, total, offset: 0n, limit: 25n };
}

describe("UsersPage create-user → login journey (cover)", () => {
  beforeEach(() => {
    listUsersPageMock.mockReset();
    listRolesMock.mockReset();
    createUserMock.mockReset();
    loginMock.mockReset();
    getSessionMock.mockReset();
    logoutMock.mockReset();
    useRoleMock.mockReset();
    window.localStorage.clear();

    useRoleMock.mockReturnValue(roleState());
    listUsersPageMock.mockResolvedValue(userPage([]));
    listRolesMock.mockResolvedValue([
      role({ id: 0n, name: "Administrador", modules: [] }),
      role({ id: 1n, name: "Mecánico", modules: ["inventory"] }),
    ]);
  });

  it("lets a user created with a temporary password sign in with those credentials", async () => {
    // The create call records the credential the administrator submitted; the
    // login call only accepts that exact username/password pair, so a mismatch
    // between the two forms fails the journey.
    const created = user({
      name: "Nuevo Mecánico",
      username: "nuevo.mec",
      roleId: 1n,
      roleName: "Mecánico",
    });
    createUserMock.mockImplementation(
      async (
        _token: string | null,
        username: string,
        name: string,
        roleId: bigint,
        temporaryPassword: string,
      ): Promise<UserListItem> => {
        expect(temporaryPassword).toBe("temporal-123");
        return { ...created, username, name, roleId };
      },
    );
    loginMock.mockImplementation(
      async (username: string, password: string): Promise<LoginResult> => {
        if (username !== "nuevo.mec" || password !== "temporal-123") {
          throw new Error("Usuario o contraseña incorrectos");
        }
        return {
          token: "fresh-token",
          expiresAt: 1_700_000_000_000_000_000n,
          user: session(),
        };
      },
    );
    // The provider re-validates the issued token through `getSession`.
    getSessionMock.mockResolvedValue(session());

    // 1. The administrator creates the user from Configuración.
    const createRender = renderWithProviders(<UsersPage />);
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

    await waitFor(() => expect(createUserMock).toHaveBeenCalledTimes(1));
    // The chosen role (Mecánico = 1) reaches the backend, not Administrador.
    expect(createUserMock).toHaveBeenCalledWith(
      null,
      "nuevo.mec",
      "Nuevo Mecánico",
      1n,
      "temporal-123",
    );

    // The one-time panel hands the administrator the password to give the user.
    const panel = await screen.findByTestId("users.temp_password_panel");
    expect(
      within(panel).getByTestId("users.temp_password_value"),
    ).toHaveTextContent("temporal-123");

    // 2. The new user signs in on the login screen with those credentials.
    createRender.unmount();
    renderWithProviders(<LoginScreen />);

    await userEvent.type(
      screen.getByTestId("auth.username_input"),
      "nuevo.mec",
    );
    await userEvent.type(
      screen.getByTestId("auth.password_input"),
      "temporal-123",
    );
    await userEvent.click(screen.getByTestId("auth.submit_button"));

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
    expect(loginMock).toHaveBeenCalledWith("nuevo.mec", "temporal-123");
    // The session token is persisted and the issued session is validated.
    await waitFor(() =>
      expect(window.localStorage.getItem("hr-session-token")).toBe(
        "fresh-token",
      ),
    );
    expect(getSessionMock).toHaveBeenCalledWith("fresh-token");
    // No error is shown: the login succeeded.
    expect(screen.queryByTestId("auth.error_state")).not.toBeInTheDocument();
  });

  it("rejects the login when the temporary password does not match", async () => {
    // The backend rejects a wrong password; the login screen must surface the
    // Spanish invalid-credentials message and store no session.
    loginMock.mockRejectedValue(new Error("Usuario o contraseña incorrectos"));

    renderWithProviders(<LoginScreen />);

    await userEvent.type(
      screen.getByTestId("auth.username_input"),
      "nuevo.mec",
    );
    await userEvent.type(
      screen.getByTestId("auth.password_input"),
      "clave-equivocada",
    );
    await userEvent.click(screen.getByTestId("auth.submit_button"));

    expect(await screen.findByTestId("auth.error_state")).toHaveTextContent(
      "Usuario o contraseña incorrectos.",
    );
    expect(window.localStorage.getItem("hr-session-token")).toBeNull();
  });
});
