import { AppHeader } from "@/components/AppHeader";
import { UserRole } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the accepted fullscreen control in the header.
 *
 * The accepted change adds a fullscreen toggle to the header, shown only when
 * the browser supports the Fullscreen API. These tests pin the observable
 * contract: the button is absent without support, present with support, and
 * clicking it requests fullscreen. The hook's own state transitions are covered
 * in `use-fullscreen.test.tsx`.
 */

const loginMock = vi.fn();
const clearMock = vi.fn();
const useRoleMock = vi.fn();
const getDriveConnectionStatusMock = vi.fn();

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({
    actor: {
      listCustomers: vi.fn().mockResolvedValue([]),
      listSuppliers: vi.fn().mockResolvedValue([]),
      listServices: vi
        .fn()
        .mockResolvedValue({ items: [], total: 0n, offset: 0n, limit: 0n }),
      listParts: vi
        .fn()
        .mockResolvedValue({ items: [], total: 0n, offset: 0n, limit: 0n }),
      listTechnicians: vi.fn().mockResolvedValue([]),
      listServiceCategories: vi.fn().mockResolvedValue([]),
      getDriveConnectionStatus: getDriveConnectionStatusMock,
      createBackup: vi.fn(),
    },
    isFetching: false,
  }),
  useInternetIdentity: () => ({
    isAuthenticated: true,
    isInitializing: false,
    isLoggingIn: false,
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
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
}));

/** Installs a fake Fullscreen API on the document and its root element. */
function installFullscreenApi() {
  const requestFullscreen = vi.fn().mockResolvedValue(undefined);
  const exitFullscreen = vi.fn().mockResolvedValue(undefined);
  const root = document.documentElement as HTMLElement & {
    requestFullscreen?: () => Promise<void>;
  };
  const doc = document as Document & {
    exitFullscreen?: () => Promise<void>;
    fullscreenElement?: Element | null;
  };
  root.requestFullscreen = requestFullscreen;
  doc.exitFullscreen = exitFullscreen;
  doc.fullscreenElement = null;
  return {
    requestFullscreen,
    exitFullscreen,
    setFullscreenElement: (element: Element | null) => {
      doc.fullscreenElement = element;
    },
    restore: () => {
      (root as { requestFullscreen?: unknown }).requestFullscreen = undefined;
      (doc as { exitFullscreen?: unknown }).exitFullscreen = undefined;
      (doc as { fullscreenElement?: unknown }).fullscreenElement = undefined;
    },
  };
}

describe("AppHeader fullscreen control", () => {
  beforeEach(() => {
    loginMock.mockReset();
    clearMock.mockReset();
    useRoleMock.mockReset();
    getDriveConnectionStatusMock.mockReset();
    getDriveConnectionStatusMock.mockResolvedValue({ connected: false });
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides the fullscreen control when the browser does not support it", () => {
    renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

    expect(
      screen.queryByTestId("header.fullscreen_button"),
    ).not.toBeInTheDocument();
  });

  it("shows the fullscreen control when the browser supports it", () => {
    const api = installFullscreenApi();
    try {
      renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

      const button = screen.getByTestId("header.fullscreen_button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-label", "Pantalla completa");
      expect(button).toHaveAttribute("aria-pressed", "false");
    } finally {
      api.restore();
    }
  });

  it("requests fullscreen when the control is clicked", async () => {
    const api = installFullscreenApi();
    try {
      renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

      await userEvent.click(screen.getByTestId("header.fullscreen_button"));

      expect(api.requestFullscreen).toHaveBeenCalledTimes(1);
    } finally {
      api.restore();
    }
  });

  // --- Accepted behavior: the control reflects the real fullscreen state ----
  //
  // The accepted change requires the button to show whether the app is in
  // fullscreen and to update when the user leaves with Escape or the system
  // gesture. Both paths fire `fullscreenchange`, so the header is driven by the
  // event rather than by the click alone.

  it("reflects entering fullscreen when the browser reports the change", () => {
    const api = installFullscreenApi();
    try {
      renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);
      const button = screen.getByTestId("header.fullscreen_button");
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(button).toHaveAttribute("aria-label", "Pantalla completa");

      act(() => {
        api.setFullscreenElement(document.documentElement);
        document.dispatchEvent(new Event("fullscreenchange"));
      });

      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(button).toHaveAttribute(
        "aria-label",
        "Salir de pantalla completa",
      );
    } finally {
      api.restore();
    }
  });

  it("returns to the normal state when the user leaves fullscreen with Escape", () => {
    const api = installFullscreenApi();
    try {
      api.setFullscreenElement(document.documentElement);
      renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);
      const button = screen.getByTestId("header.fullscreen_button");
      expect(button).toHaveAttribute("aria-pressed", "true");

      // Escape clears the fullscreen element and fires the same event.
      act(() => {
        api.setFullscreenElement(null);
        document.dispatchEvent(new Event("fullscreenchange"));
      });

      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(button).toHaveAttribute("aria-label", "Pantalla completa");
    } finally {
      api.restore();
    }
  });

  it("leaves fullscreen through the control when it is already active", async () => {
    const api = installFullscreenApi();
    try {
      api.setFullscreenElement(document.documentElement);
      renderWithProviders(<AppHeader onOpenSidebar={vi.fn()} />);

      await userEvent.click(screen.getByTestId("header.fullscreen_button"));

      expect(api.exitFullscreen).toHaveBeenCalledTimes(1);
      expect(api.requestFullscreen).not.toHaveBeenCalled();
    } finally {
      api.restore();
    }
  });
});
