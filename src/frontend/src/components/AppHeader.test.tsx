import { AppHeader } from "@/components/AppHeader";
import { UserRole } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the header's adjacent working behavior.
 *
 * The displayed brand name is intentionally changing, so this file never
 * asserts the old string. It protects the surrounding contract instead: the
 * brand link target, the global search navigation, and the auth controls.
 */

const navigateMock = vi.fn();
const loginMock = vi.fn();
const clearMock = vi.fn();
const useRoleMock = vi.fn();
const listCustomersMock = vi.fn();
const listSuppliersMock = vi.fn();
const listServicesMock = vi.fn();
const listPartsMock = vi.fn();
const listTechniciansMock = vi.fn();
const listServiceCategoriesMock = vi.fn();
const getDriveConnectionStatusMock = vi.fn();
const createBackupMock = vi.fn();
const identityState = {
  isAuthenticated: true,
  isInitializing: false,
  isLoggingIn: false,
};

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({
    actor: {
      listCustomers: listCustomersMock,
      listSuppliers: listSuppliersMock,
      listServices: listServicesMock,
      listParts: listPartsMock,
      listTechnicians: listTechniciansMock,
      listServiceCategories: listServiceCategoriesMock,
      getDriveConnectionStatus: getDriveConnectionStatusMock,
      createBackup: createBackupMock,
    },
    isFetching: false,
  }),
  useInternetIdentity: () => ({
    isAuthenticated: identityState.isAuthenticated,
    isInitializing: identityState.isInitializing,
    isLoggingIn: identityState.isLoggingIn,
    login: loginMock,
    clear: clearMock,
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
  useNavigate: () => navigateMock,
  useSearch: () => ({}),
}));

function roleState(isAdmin: boolean, isLoading = false) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading,
    isError: false,
    modules: null,
    roleName: isAdmin ? "Administrador" : "Mecánico",
    refetch: vi.fn(),
  };
}

describe("AppHeader", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    loginMock.mockReset();
    clearMock.mockReset();
    useRoleMock.mockReset();
    listCustomersMock.mockReset();
    listSuppliersMock.mockReset();
    listServicesMock.mockReset();
    listPartsMock.mockReset();
    listTechniciansMock.mockReset();
    listServiceCategoriesMock.mockReset();
    getDriveConnectionStatusMock.mockReset();
    createBackupMock.mockReset();
    listCustomersMock.mockResolvedValue([]);
    listSuppliersMock.mockResolvedValue([]);
    listServicesMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 0n,
    });
    listPartsMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 0n,
    });
    listTechniciansMock.mockResolvedValue([]);
    listServiceCategoriesMock.mockResolvedValue([]);
    getDriveConnectionStatusMock.mockResolvedValue({ connected: false });
    identityState.isAuthenticated = true;
    identityState.isInitializing = false;
    identityState.isLoggingIn = false;
    useRoleMock.mockReturnValue(roleState(true));
  });

  it("links the brand mark back to the dashboard", () => {
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    expect(screen.getByTestId("header.home_link")).toHaveAttribute("href", "/");
  });

  it("shows the new brand name in the header", () => {
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    expect(
      within(screen.getByTestId("header.home_link")).getByText(
        "HR SOLUCIONES INTEGRALES",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Taller N[o]?r?cturno/)).not.toBeInTheDocument();
  });

  it("finds records across catalogs and navigates to the selected one", async () => {
    listCustomersMock.mockResolvedValue([
      {
        id: 1n,
        name: "Ada Lovelace",
        phone: "+52 555 0100",
        createdAt: 0n,
      },
    ]);
    listPartsMock.mockResolvedValue({
      items: [
        {
          id: 9n,
          sku: "BAL-001",
          name: "Balata delantera",
          stock: 4n,
          minStock: 1n,
          price: 32000n,
          cost: 20000n,
          active: true,
          createdAt: 0n,
        },
      ],
      total: 1n,
      offset: 0n,
      limit: 5n,
    });

    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    await userEvent.type(
      screen.getByTestId("global_search.search_input"),
      "balata",
    );

    // Results are grouped by record type once the debounced query resolves.
    expect(
      await screen.findByTestId("global_search.group.inventario"),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId("global_search.group.clientes"),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByTestId("global_search.result.inventario.1"),
    );

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith({
        to: "/inventario/$id",
        params: { id: "9" },
      }),
    );
  });

  it("shows a clear empty state when the global search matches nothing", async () => {
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    await userEvent.type(
      screen.getByTestId("global_search.search_input"),
      "zzz",
    );

    expect(
      await screen.findByTestId("global_search.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se encontraron coincidencias"),
    ).toBeInTheDocument();
  });

  it("opens the sidebar from the menu button", async () => {
    const onOpenSidebar = vi.fn();
    renderWithProviders(<AppHeader onOpenSidebar={onOpenSidebar} />);

    await userEvent.click(screen.getByTestId("header.open_sidebar_button"));

    expect(onOpenSidebar).toHaveBeenCalledTimes(1);
  });

  it("shows the admin role badge and a logout control when authenticated", async () => {
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    expect(screen.getByTestId("header.role_badge")).toHaveTextContent(
      "Administrador",
    );
    expect(screen.queryByTestId("header.login_button")).not.toBeInTheDocument();

    // The accepted change routes an administrator's "Salir" through the exit
    // confirmation dialog instead of logging out immediately.
    await userEvent.click(screen.getByTestId("header.logout_button"));
    expect(
      await screen.findByTestId("exit_session.dialog"),
    ).toBeInTheDocument();
    expect(clearMock).not.toHaveBeenCalled();
  });

  // --- Accepted behavior: the administrator's exit confirmation -------------
  //
  // The accepted change makes an administrator's "Salir" open a confirmation
  // dialog that reminds them to back up. These tests protect the header's
  // wiring into that dialog: the three options appear, "Cancelar" keeps the
  // session open, and "Respaldar y salir" backs up before closing the session.

  it("offers the three exit options to an administrator", async () => {
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    await userEvent.click(screen.getByTestId("header.logout_button"));

    expect(
      await screen.findByRole("button", { name: "Respaldar y salir" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Salir sin respaldar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancelar" }),
    ).toBeInTheDocument();
  });

  it("keeps the session open when the administrator cancels the exit", async () => {
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    await userEvent.click(screen.getByTestId("header.logout_button"));
    await userEvent.click(
      await screen.findByTestId("exit_session.cancel_button"),
    );

    expect(clearMock).not.toHaveBeenCalled();
  });

  it("backs up and then closes the session on 'Respaldar y salir'", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({ connected: true });
    createBackupMock.mockResolvedValue({
      __kind__: "ok",
      ok: {
        fileId: "file-1",
        name: "respaldo-hr-2026-09-22-1530.json",
        size: 2048n,
        createdAt: 1_700_000_000_000_000_000n,
        webViewLink: "https://drive.google.com/file/d/file-1/view",
      },
    });
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    await userEvent.click(screen.getByTestId("header.logout_button"));
    await userEvent.click(
      await screen.findByTestId("exit_session.backup_and_exit_button"),
    );

    await waitFor(() => expect(createBackupMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(clearMock).toHaveBeenCalledTimes(1));
  });

  it("keeps the session open and shows the error when the backup fails", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({ connected: true });
    createBackupMock.mockResolvedValue({
      __kind__: "err",
      err: { __kind__: "driveFailed", driveFailed: "cuota excedida" },
    });
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    await userEvent.click(screen.getByTestId("header.logout_button"));
    await userEvent.click(
      await screen.findByTestId("exit_session.backup_and_exit_button"),
    );

    expect(
      await screen.findByTestId("exit_session.error_state"),
    ).toBeInTheDocument();
    expect(clearMock).not.toHaveBeenCalled();
  });

  it("warns an administrator without Drive connected before exiting", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({ connected: false });
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    await userEvent.click(screen.getByTestId("header.logout_button"));

    expect(
      await screen.findByTestId("exit_session.drive_warning"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("exit_session.backup_and_exit_button"),
    ).toBeDisabled();
  });

  it("labels a mechanic and offers login when unauthenticated", async () => {
    identityState.isAuthenticated = false;
    useRoleMock.mockReturnValue(roleState(false));
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    expect(screen.queryByTestId("header.role_badge")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("header.logout_button"),
    ).not.toBeInTheDocument();

    // The accepted change moves sign-in to the username/password login screen,
    // so the header's unauthenticated control only clears any stale session.
    const loginButton = screen.getByTestId("header.login_button");
    expect(loginButton).toBeInTheDocument();
    await userEvent.click(loginButton);
    expect(clearMock).not.toHaveBeenCalled();
  });

  // --- Accepted behavior: the mechanic's logout stays direct -----------------
  //
  // The accepted change scopes the exit confirmation dialog to administrators.
  // A mechanic still logs out directly, with no dialog.

  it("logs a mechanic out directly without the exit dialog", async () => {
    useRoleMock.mockReturnValue(roleState(false));
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    expect(screen.getByTestId("header.role_badge")).toHaveTextContent(
      "Mecánico",
    );
    const logout = screen.getByTestId("header.logout_button");
    expect(logout).toBeInTheDocument();
    expect(logout).toBeEnabled();

    await userEvent.click(logout);

    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("exit_session.dialog")).not.toBeInTheDocument();
  });
});
