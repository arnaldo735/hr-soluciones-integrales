import { AuthProvider, useAuth } from "@/hooks/use-auth";
import type { SessionInfo } from "@/lib/types";
import { createTestQueryClient } from "@/test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the password-session lifecycle in `AuthProvider`.
 *
 * The accepted change persists the session token in `localStorage` and
 * re-validates it with `getSession` on startup. These tests pin that contract:
 * a stored token is validated and its user exposed, an invalid/expired token is
 * discarded, a successful login stores the token and exposes the user, and
 * logout clears both the stored token and the in-memory session.
 *
 * The backend actor is a typed local mock; no network is involved.
 */

const SESSION_TOKEN_KEY = "hr-session-token";

const getSessionMock = vi.fn();
const loginMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getSession: getSessionMock,
      login: loginMock,
      logout: logoutMock,
    },
    isFetching: false,
    isReady: true,
  }),
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

function session(overrides: Partial<SessionInfo> = {}): SessionInfo {
  return {
    userId: 1n,
    username: "juan.perez",
    name: "Juan Pérez",
    roleId: 2n,
    roleName: "Mecánico",
    modules: ["inventory"],
    ...overrides,
  };
}

/** Probe that surfaces the auth context and drives login/logout. */
function AuthProbe() {
  const auth = useAuth();
  return (
    <div>
      <span data-ocid="probe.user">{auth.user?.username ?? "none"}</span>
      <span data-ocid="probe.token">{auth.token ?? "none"}</span>
      <span data-ocid="probe.role">{auth.roleName}</span>
      <span data-ocid="probe.modules">
        {auth.modules === null ? "null" : auth.modules.join(",")}
      </span>
      <span data-ocid="probe.authenticated">
        {auth.isAuthenticated ? "yes" : "no"}
      </span>
      <button
        type="button"
        data-ocid="probe.login"
        onClick={() => void auth.login("juan.perez", "secreta-123")}
      >
        login
      </button>
      <button type="button" data-ocid="probe.logout" onClick={auth.logout}>
        logout
      </button>
    </div>
  );
}

function renderAuth() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("AuthProvider session lifecycle", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    loginMock.mockReset();
    logoutMock.mockReset();
    window.localStorage.clear();
  });

  it("validates a stored token and exposes its user", async () => {
    window.localStorage.setItem(SESSION_TOKEN_KEY, "stored-token");
    getSessionMock.mockResolvedValue(session());
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId("probe.user")).toHaveTextContent("juan.perez"),
    );
    expect(getSessionMock).toHaveBeenCalledWith("stored-token");
    expect(screen.getByTestId("probe.token")).toHaveTextContent("stored-token");
    expect(screen.getByTestId("probe.role")).toHaveTextContent("Mecánico");
    expect(screen.getByTestId("probe.modules")).toHaveTextContent("inventory");
    expect(screen.getByTestId("probe.authenticated")).toHaveTextContent("yes");
  });

  it("discards a stored token the backend no longer accepts", async () => {
    window.localStorage.setItem(SESSION_TOKEN_KEY, "expired-token");
    getSessionMock.mockResolvedValue(null);
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId("probe.token")).toHaveTextContent("none"),
    );
    expect(window.localStorage.getItem(SESSION_TOKEN_KEY)).toBeNull();
    expect(screen.getByTestId("probe.user")).toHaveTextContent("none");
    expect(screen.getByTestId("probe.authenticated")).toHaveTextContent("no");
  });

  it("stores the token and exposes the user after a successful login", async () => {
    loginMock.mockResolvedValue({
      token: "fresh-token",
      expiresAt: 0n,
      user: session(),
    });
    // The provider seeds the session from the login result and re-validates it
    // through `getSession`; both must agree for the session to be exposed.
    getSessionMock.mockResolvedValue(session());
    renderAuth();

    await userEvent.click(screen.getByTestId("probe.login"));

    await waitFor(() =>
      expect(screen.getByTestId("probe.user")).toHaveTextContent("juan.perez"),
    );
    expect(loginMock).toHaveBeenCalledWith("juan.perez", "secreta-123");
    expect(window.localStorage.getItem(SESSION_TOKEN_KEY)).toBe("fresh-token");
    expect(screen.getByTestId("probe.token")).toHaveTextContent("fresh-token");
    expect(screen.getByTestId("probe.authenticated")).toHaveTextContent("yes");
  });

  it("clears the stored token and the session on logout", async () => {
    window.localStorage.setItem(SESSION_TOKEN_KEY, "stored-token");
    getSessionMock.mockResolvedValue(session());
    logoutMock.mockResolvedValue(true);
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId("probe.user")).toHaveTextContent("juan.perez"),
    );
    await userEvent.click(screen.getByTestId("probe.logout"));

    await waitFor(() =>
      expect(screen.getByTestId("probe.token")).toHaveTextContent("none"),
    );
    expect(window.localStorage.getItem(SESSION_TOKEN_KEY)).toBeNull();
    expect(screen.getByTestId("probe.authenticated")).toHaveTextContent("no");
    expect(logoutMock).toHaveBeenCalledWith("stored-token");
  });

  it("starts with no session when nothing is stored", async () => {
    renderAuth();

    expect(screen.getByTestId("probe.user")).toHaveTextContent("none");
    expect(screen.getByTestId("probe.token")).toHaveTextContent("none");
    expect(screen.getByTestId("probe.authenticated")).toHaveTextContent("no");
    expect(getSessionMock).not.toHaveBeenCalled();
  });
});
