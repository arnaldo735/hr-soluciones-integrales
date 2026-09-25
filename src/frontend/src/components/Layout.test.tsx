import { Layout } from "@/components/Layout";
import { UserRole } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the layout's auth gate and shell.
 *
 * The brand heading shown on the login gate is intentionally changing, so this
 * file asserts the gate's structure and controls rather than its exact copy.
 */

const loginMock = vi.fn();
const useRoleMock = vi.fn();
const identityState = {
  isAuthenticated: true,
  isInitializing: false,
  isLoggingIn: false,
};

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: {}, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: identityState.isAuthenticated,
    isInitializing: identityState.isInitializing,
    isLoggingIn: identityState.isLoggingIn,
    login: loginMock,
    clear: vi.fn(),
    identity: undefined,
  }),
}));

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Outlet: () => <div data-ocid="layout.outlet" />,
  useNavigate: () => vi.fn(),
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { pathname: "/" } }),
}));

describe("Layout", () => {
  beforeEach(() => {
    loginMock.mockReset();
    useRoleMock.mockReset();
    identityState.isAuthenticated = true;
    identityState.isInitializing = false;
    identityState.isLoggingIn = false;
    useRoleMock.mockReturnValue({
      role: UserRole.admin,
      isAdmin: true,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("shows the loading state while the session initializes", () => {
    identityState.isInitializing = true;
    renderWithProviders(<Layout />);

    expect(screen.getByTestId("app.loading_state")).toBeInTheDocument();
    expect(screen.queryByTestId("auth.login_state")).not.toBeInTheDocument();
  });

  it("gates an unauthenticated visitor behind the login screen", async () => {
    identityState.isAuthenticated = false;
    renderWithProviders(<Layout />);

    expect(screen.getByTestId("auth.login_state")).toBeInTheDocument();
    expect(screen.queryByTestId("layout.outlet")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("auth.login_button"));
    expect(loginMock).toHaveBeenCalledTimes(1);
  });

  it("shows the new brand name on the login screen", () => {
    identityState.isAuthenticated = false;
    renderWithProviders(<Layout />);

    expect(
      screen.getByRole("heading", { name: "HR SOLUCIONES INTEGRALES" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Taller N[o]?r?cturno/)).not.toBeInTheDocument();
  });

  it("renders the header, sidebar and routed content when authenticated", () => {
    renderWithProviders(<Layout />);

    expect(screen.queryByTestId("auth.login_state")).not.toBeInTheDocument();
    expect(screen.getByTestId("header.home_link")).toBeInTheDocument();
    expect(screen.getByTestId("layout.outlet")).toBeInTheDocument();
    expect(screen.getByText("Panel")).toBeInTheDocument();
  });
});
