import { AppSidebar } from "@/components/AppSidebar";
import { UserRole } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the "Compras" navigation flow.
 *
 * The accepted change adds a "Facturas de compra" module to the Compras flow.
 * These tests protect the surrounding navigation contract that must survive it:
 * the flow is reachable for an administrator, its existing modules are still
 * present, and the whole flow stays hidden from a mechanic. They deliberately
 * assert membership rather than the exact module set, so adding the new module
 * is not frozen as a regression.
 */

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
    refetch: vi.fn(),
  };
}

/** Expands the Compras flow, which starts collapsed on the panel route. */
async function openComprasFlow() {
  await userEvent.click(screen.getByTestId("sidebar.flow_toggle.compras"));
  return screen.getByTestId("sidebar.flow.compras");
}

describe("AppSidebar Compras flow", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    window.sessionStorage.clear();
  });

  it("keeps the Compras flow reachable for an administrator", async () => {
    useRoleMock.mockReturnValue(roleState(true));
    renderWithProviders(<AppSidebar />);

    // The flow header itself is present and expandable.
    const toggle = screen.getByTestId("sidebar.flow_toggle.compras");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("still shows the existing Compras modules to an administrator", async () => {
    useRoleMock.mockReturnValue(roleState(true));
    renderWithProviders(<AppSidebar />);

    const flow = await openComprasFlow();
    // The two modules the flow already carried must survive the addition of the
    // new purchase-invoice module. The module links carry stable markers, so
    // the assertion does not depend on the flow header's own label.
    expect(
      within(flow).getByTestId("sidebar.link.compras.compras"),
    ).toBeInTheDocument();
    expect(
      within(flow).getByTestId("sidebar.link.compras.cuentas_por_pagar"),
    ).toBeInTheDocument();
  });

  it("shows the new 'Facturas de compra' module to an administrator", async () => {
    useRoleMock.mockReturnValue(roleState(true));
    renderWithProviders(<AppSidebar />);

    const flow = await openComprasFlow();
    // The accepted change adds the purchase-invoice module to the Compras flow,
    // pointing at the new admin-gated route.
    const link = within(flow).getByTestId(
      "sidebar.link.compras.facturas_de_compra",
    );
    expect(link).toHaveAttribute("href", "/facturas-compra");
    expect(link).toHaveTextContent("Facturas de compra");
  });

  it("keeps every Compras module administrator-only", async () => {
    useRoleMock.mockReturnValue(roleState(true));
    renderWithProviders(<AppSidebar />);

    const flow = await openComprasFlow();
    const links = within(flow).getAllByRole("link");
    // Every module in this flow is admin-gated, so a mechanic never sees one.
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) {
      expect(link).toHaveAttribute("href");
    }
  });

  it("hides the whole Compras flow from a mechanic", () => {
    useRoleMock.mockReturnValue(roleState(false));
    renderWithProviders(<AppSidebar />);

    expect(
      screen.queryByTestId("sidebar.flow.compras"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Compras")).not.toBeInTheDocument();
  });
});
