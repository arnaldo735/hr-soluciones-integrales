import { Layout } from "@/components/Layout";
import type { RemindersSummary } from "@/hooks/use-reminders";
import { UserRole } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the layout's auth gate and shell, plus cover
 * for the session-scoped reminders dialog the accepted change introduces.
 *
 * The brand heading shown on the login gate is intentionally changing, so this
 * file asserts the gate's structure and controls rather than its exact copy.
 * The reminders dialog must appear on its own when the session has pending
 * work, reappear when the tab becomes visible again, and stay closed for the
 * rest of the session once the user dismisses it.
 */

const loginMock = vi.fn();
const useRoleMock = vi.fn();
const useRemindersSummaryMock = vi.fn();
const identityState = {
  isAuthenticated: true,
  isInitializing: false,
  isLoggingIn: false,
};

vi.mock("@/hooks/use-reminders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-reminders")>();
  return {
    ...actual,
    useRemindersSummary: () => useRemindersSummaryMock(),
  };
});

function pendingSummary(): RemindersSummary {
  return {
    generatedAt: 1_700_000_000_000_000_000n,
    appointments: {
      count: 1n,
      items: [
        {
          id: 1n,
          customerId: 10n,
          customerName: "Ana Pérez",
          scheduledAt: 1_700_000_000_000_000_000n,
          status: "scheduled",
        },
      ],
    },
  };
}

function remindersResult(data: RemindersSummary | undefined) {
  return {
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

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
    useRemindersSummaryMock.mockReset();
    useRemindersSummaryMock.mockReturnValue(remindersResult(undefined));
    window.sessionStorage.clear();
    identityState.isAuthenticated = true;
    identityState.isInitializing = false;
    identityState.isLoggingIn = false;
    useRoleMock.mockReturnValue({
      role: UserRole.admin,
      isAdmin: true,
      isLoading: false,
      isError: false,
      modules: null,
      roleName: "Administrador",
      refetch: vi.fn(),
    });
  });

  it("gates an unauthenticated visitor behind the login screen", () => {
    identityState.isAuthenticated = false;
    renderWithProviders(<Layout />);

    expect(screen.getByTestId("auth.login_state")).toBeInTheDocument();
    expect(screen.queryByTestId("layout.outlet")).not.toBeInTheDocument();

    // The accepted change replaces the one-click login with a username and
    // password form; the submit control is disabled until both fields are set.
    expect(screen.getByTestId("auth.submit_button")).toBeDisabled();
    expect(screen.getByTestId("auth.username_input")).toBeInTheDocument();
    expect(screen.getByTestId("auth.password_input")).toBeInTheDocument();
  });

  it("shows the login screen heading when unauthenticated", () => {
    identityState.isAuthenticated = false;
    renderWithProviders(<Layout />);

    expect(
      screen.getByRole("heading", { name: "Iniciar sesión" }),
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

  it("opens the reminders dialog on its own when the session has pending work", async () => {
    useRemindersSummaryMock.mockReturnValue(remindersResult(pendingSummary()));
    renderWithProviders(<Layout />);

    expect(await screen.findByTestId("reminders.dialog")).toBeInTheDocument();
    expect(
      screen.getByTestId("reminders.section.appointments"),
    ).toBeInTheDocument();
  });

  it("keeps the reminders dialog closed when there is nothing pending", async () => {
    useRemindersSummaryMock.mockReturnValue(
      remindersResult({ generatedAt: 1_700_000_000_000_000_000n }),
    );
    renderWithProviders(<Layout />);

    await waitFor(() =>
      expect(screen.getByTestId("layout.outlet")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("reminders.dialog")).not.toBeInTheDocument();
  });

  it("does not reopen the reminders dialog after it is dismissed in the session", async () => {
    useRemindersSummaryMock.mockReturnValue(remindersResult(pendingSummary()));
    renderWithProviders(<Layout />);

    await userEvent.click(await screen.findByTestId("reminders.close_button"));
    await waitFor(() =>
      expect(screen.queryByTestId("reminders.dialog")).not.toBeInTheDocument(),
    );

    // Returning to the tab must not bring the dismissed dialog back.
    document.dispatchEvent(new Event("visibilitychange"));
    expect(screen.queryByTestId("reminders.dialog")).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("hr-reminders-dismissed")).toBe("1");
  });

  it("does not open the reminders dialog for an unauthenticated visitor", async () => {
    identityState.isAuthenticated = false;
    useRemindersSummaryMock.mockReturnValue(remindersResult(pendingSummary()));
    renderWithProviders(<Layout />);

    expect(screen.getByTestId("auth.login_state")).toBeInTheDocument();
    expect(screen.queryByTestId("reminders.dialog")).not.toBeInTheDocument();
  });
});
