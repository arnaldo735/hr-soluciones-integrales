import { AppSidebar } from "@/components/AppSidebar";
import { UserRole } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the role-to-module visibility seam.
 *
 * The accepted change makes the assigned role decide which modules and pages a
 * user sees, and lets an administrator define custom roles. These tests protect
 * the surrounding contract that must survive that rework: the sidebar resolves
 * the caller's role from the backend through the real `useRole` hook and filters
 * the administrator-only modules accordingly.
 *
 * Unlike the other sidebar tests, this file does not mock `useRole`; it mocks
 * only the backend actor, so it exercises the real role resolution feeding the
 * navigation filter. It deliberately asserts the visibility rule (admin-only
 * modules hidden from a non-admin) rather than the exact module set, which the
 * custom-roles change may extend.
 */

const getCallerUserRoleMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: { getCallerUserRole: getCallerUserRoleMock },
    isFetching: false,
  }),
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

/** Expands a flow so its module links are queryable. */
async function openFlow(id: string) {
  const { default: userEvent } = await import("@testing-library/user-event");
  await userEvent.click(screen.getByTestId(`sidebar.flow_toggle.${id}`));
  return screen.getByTestId(`sidebar.flow.${id}`);
}

describe("AppSidebar role visibility (characterization)", () => {
  beforeEach(() => {
    getCallerUserRoleMock.mockReset();
    window.sessionStorage.clear();
  });

  it("shows the administrator-only modules to a caller the backend reports as admin", async () => {
    getCallerUserRoleMock.mockResolvedValue(UserRole.admin);
    renderWithProviders(<AppSidebar />);

    // The role resolves from the backend, then the admin-only flows appear.
    await waitFor(() =>
      expect(screen.getByTestId("sidebar.flow.compras")).toBeInTheDocument(),
    );
    expect(
      screen.getByTestId("sidebar.flow.administracion"),
    ).toBeInTheDocument();

    const catalog = await openFlow("catalogo");
    expect(
      within(catalog).getByTestId("sidebar.link.catalogo.motocicletas"),
    ).toBeInTheDocument();
  });

  it("hides the administrator-only modules from a caller the backend reports as a mechanic", async () => {
    getCallerUserRoleMock.mockResolvedValue(UserRole.user);
    renderWithProviders(<AppSidebar />);

    // The non-admin flows remain reachable.
    await waitFor(() =>
      expect(screen.getByTestId("sidebar.flow.taller")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("sidebar.flow.catalogo")).toBeInTheDocument();

    // The flows that hold only admin-only modules disappear entirely.
    expect(
      screen.queryByTestId("sidebar.flow.compras"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("sidebar.flow.administracion"),
    ).not.toBeInTheDocument();

    // The admin-only modules inside a mixed flow are filtered out, while the
    // non-admin modules of that same flow stay visible.
    const catalog = await openFlow("catalogo");
    expect(
      within(catalog).queryByTestId("sidebar.link.catalogo.motocicletas"),
    ).not.toBeInTheDocument();
    expect(
      within(catalog).queryByTestId("sidebar.link.catalogo.proveedores"),
    ).not.toBeInTheDocument();
    expect(
      within(catalog).getByTestId("sidebar.link.catalogo.inventario"),
    ).toBeInTheDocument();
  });
});
