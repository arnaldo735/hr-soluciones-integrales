import { LoginScreen } from "@/components/LoginScreen";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the username/password login screen.
 *
 * The accepted change makes username + password the primary way into the app.
 * These tests pin the observable contract: the submit button stays disabled
 * until both fields are filled, a successful login forwards the trimmed
 * username and the raw password to the auth context, and each backend failure
 * kind renders its own Spanish message. `classifyAuthError` is the real
 * implementation, so the error-to-message mapping is exercised end to end.
 */

const loginMock = vi.fn();
const identityLoginMock = vi.fn();

vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isRestoring: false,
      isAdmin: false,
      modules: null,
      roleName: "Invitado",
      login: loginMock,
      logout: vi.fn(),
      refetch: vi.fn(),
    }),
  };
});

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: null, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    login: identityLoginMock,
    clear: vi.fn(),
    identity: undefined,
  }),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    loginMock.mockReset();
    identityLoginMock.mockReset();
  });

  it("keeps the submit button disabled until both fields are filled", async () => {
    renderWithProviders(<LoginScreen />);

    const submit = screen.getByTestId("auth.submit_button");
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByTestId("auth.username_input"), "juan");
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByTestId("auth.password_input"), "secreta");
    expect(submit).toBeEnabled();
  });

  it("logs in with the trimmed username and the raw password", async () => {
    loginMock.mockResolvedValue(undefined);
    renderWithProviders(<LoginScreen />);

    await userEvent.type(
      screen.getByTestId("auth.username_input"),
      "  juan.perez  ",
    );
    await userEvent.type(
      screen.getByTestId("auth.password_input"),
      "secreta-123",
    );
    await userEvent.click(screen.getByTestId("auth.submit_button"));

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
    expect(loginMock).toHaveBeenCalledWith("juan.perez", "secreta-123");
  });

  it("shows the invalid-credentials message when the login is rejected", async () => {
    loginMock.mockRejectedValue(new Error("Usuario o contraseña incorrectos"));
    renderWithProviders(<LoginScreen />);

    await userEvent.type(screen.getByTestId("auth.username_input"), "juan");
    await userEvent.type(screen.getByTestId("auth.password_input"), "mala");
    await userEvent.click(screen.getByTestId("auth.submit_button"));

    expect(await screen.findByTestId("auth.error_state")).toHaveTextContent(
      "Usuario o contraseña incorrectos.",
    );
    expect(screen.queryByTestId("auth.inactive_state")).not.toBeInTheDocument();
  });

  it("shows the deactivated-account message for an inactive account", async () => {
    loginMock.mockRejectedValue(new Error("La cuenta está desactivada"));
    renderWithProviders(<LoginScreen />);

    await userEvent.type(screen.getByTestId("auth.username_input"), "juan");
    await userEvent.type(screen.getByTestId("auth.password_input"), "secreta");
    await userEvent.click(screen.getByTestId("auth.submit_button"));

    expect(await screen.findByTestId("auth.inactive_state")).toHaveTextContent(
      "Su cuenta está desactivada. Contacte al administrador.",
    );
    expect(screen.queryByTestId("auth.error_state")).not.toBeInTheDocument();
  });

  it("shows the generic message for an unrecognized failure", async () => {
    loginMock.mockRejectedValue(new Error("network down"));
    renderWithProviders(<LoginScreen />);

    await userEvent.type(screen.getByTestId("auth.username_input"), "juan");
    await userEvent.type(screen.getByTestId("auth.password_input"), "secreta");
    await userEvent.click(screen.getByTestId("auth.submit_button"));

    expect(await screen.findByTestId("auth.error_state")).toHaveTextContent(
      "No se pudo iniciar sesión. Verifique su conexión e inténtelo de nuevo.",
    );
  });

  it("toggles the password visibility", async () => {
    renderWithProviders(<LoginScreen />);

    const password = screen.getByTestId("auth.password_input");
    expect(password).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByTestId("auth.toggle_password_button"));
    expect(password).toHaveAttribute("type", "text");
  });

  it("offers the Internet Identity admin entry", async () => {
    renderWithProviders(<LoginScreen />);

    await userEvent.click(screen.getByTestId("auth.identity_login_button"));
    expect(identityLoginMock).toHaveBeenCalledTimes(1);
  });
});
