import { RequireAdmin } from "@/components/RequireAdmin";
import { UserRole } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useRoleMock = vi.fn();

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a href="/" {...props}>
      {children}
    </a>
  ),
}));

describe("RequireAdmin", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
  });

  it("renders children for an administrator", () => {
    useRoleMock.mockReturnValue({
      role: UserRole.admin,
      isAdmin: true,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <RequireAdmin>
        <p>Contenido restringido</p>
      </RequireAdmin>,
    );

    expect(screen.getByText("Contenido restringido")).toBeInTheDocument();
    expect(screen.queryByTestId("access.denied_state")).not.toBeInTheDocument();
  });

  it("blocks a mechanic with an access-denied view", () => {
    useRoleMock.mockReturnValue({
      role: UserRole.user,
      isAdmin: false,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <RequireAdmin>
        <p>Contenido restringido</p>
      </RequireAdmin>,
    );

    expect(screen.queryByText("Contenido restringido")).not.toBeInTheDocument();
    expect(screen.getByTestId("access.denied_state")).toBeInTheDocument();
    expect(screen.getByText("Acceso restringido")).toBeInTheDocument();
  });

  it("shows a loading state while the role resolves", () => {
    useRoleMock.mockReturnValue({
      role: null,
      isAdmin: false,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <RequireAdmin>
        <p>Contenido restringido</p>
      </RequireAdmin>,
    );

    expect(screen.getByTestId("access.loading_state")).toBeInTheDocument();
    expect(screen.queryByText("Contenido restringido")).not.toBeInTheDocument();
  });

  it("offers a retry when the role query fails", async () => {
    const refetch = vi.fn();
    useRoleMock.mockReturnValue({
      role: null,
      isAdmin: false,
      isLoading: false,
      isError: true,
      refetch,
    });

    renderWithProviders(
      <RequireAdmin>
        <p>Contenido restringido</p>
      </RequireAdmin>,
    );

    expect(screen.getByTestId("access.error_state")).toBeInTheDocument();
    screen.getByTestId("access.retry_button").click();
    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
  });
});
