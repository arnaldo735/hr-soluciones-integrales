import { AppSidebar } from "@/components/AppSidebar";
import { UserRole } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useRoleMock = vi.fn();

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
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { pathname: "/" } }),
}));

function roleState(isAdmin: boolean) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading: false,
    isError: false,
    // `null` means "no module restriction", so the sidebar falls back to the
    // administrator rule for the admin-only modules.
    modules: null,
    roleName: isAdmin ? "Administrador" : "Mecánico",
    refetch: vi.fn(),
  };
}

describe("AppSidebar", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
  });

  it("shows the six consolidated flows to an administrator", () => {
    useRoleMock.mockReturnValue(roleState(true));
    renderWithProviders(<AppSidebar />);

    expect(screen.getByText("Panel")).toBeInTheDocument();
    expect(screen.getByText("Taller")).toBeInTheDocument();
    expect(screen.getByText("Catálogo")).toBeInTheDocument();
    expect(screen.getByText("Ventas")).toBeInTheDocument();
    expect(screen.getByText("Compras")).toBeInTheDocument();
    expect(screen.getByText("Administración")).toBeInTheDocument();
    expect(screen.getByText("Acceso total")).toBeInTheDocument();
  });

  it("hides admin-only flows from a mechanic", () => {
    useRoleMock.mockReturnValue(roleState(false));
    renderWithProviders(<AppSidebar />);

    expect(screen.getByText("Panel")).toBeInTheDocument();
    expect(screen.getByText("Taller")).toBeInTheDocument();
    expect(screen.getByText("Catálogo")).toBeInTheDocument();
    expect(screen.getByText("Ventas")).toBeInTheDocument();

    // Compras and Administración hold only admin-only modules, so the whole
    // flow disappears for a mechanic.
    expect(screen.queryByText("Compras")).not.toBeInTheDocument();
    expect(screen.queryByText("Administración")).not.toBeInTheDocument();
    expect(screen.getByText("Acceso mecánico")).toBeInTheDocument();
  });

  it("lists the new 'Facturas de compra' module inside the Compras flow", async () => {
    useRoleMock.mockReturnValue(roleState(true));
    renderWithProviders(<AppSidebar />);

    await userEvent.click(screen.getByTestId("sidebar.flow_toggle.compras"));
    const flow = screen.getByTestId("sidebar.flow.compras");

    // The accepted change adds the purchase-invoice module to the Compras flow.
    const link = within(flow).getByTestId(
      "sidebar.link.compras.facturas_de_compra",
    );
    expect(link).toHaveAttribute("href", "/facturas-compra");
  });
});
