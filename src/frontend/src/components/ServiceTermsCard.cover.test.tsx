import { ServiceTermsCard } from "@/components/ServiceTermsCard";
import {
  SERVICE_TERMS_DEFAULT_TEXT,
  useServiceTermsSettings,
  useUpdateServiceTermsSettings,
} from "@/hooks/use-service-terms";
import type { ServiceTermsSettings } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the admin-editable "Términos y condiciones del Servicio" footer.
 *
 * The accepted change replaces the hardcoded order footer with a single
 * admin-editable text that every generated document reads. This suite covers
 * the editor's own contract: it loads the saved text, saves the trimmed text
 * through the backend, keeps the preview in sync with what is typed, and falls
 * back to the default reception text when nothing is saved.
 *
 * The backend is mocked at the hook seam, so a passing run says nothing about
 * the real `getServiceTermsSettings`/`updateServiceTermsSettings` canister
 * methods or the default text the backend returns for an empty save.
 */

const {
  settingsQueryMock,
  saveMutationMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  settingsQueryMock: vi.fn(),
  saveMutationMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/hooks/use-service-terms", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-service-terms")>();
  return {
    ...actual,
    useServiceTermsSettings: () => settingsQueryMock(),
    useUpdateServiceTermsSettings: () => saveMutationMock(),
  };
});

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

function settings(text: string): ServiceTermsSettings {
  return { text, updatedAt: 1_700_000_000_000_000_000n };
}

function loadedQuery(data: ServiceTermsSettings | null) {
  return {
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

function idleMutation() {
  return { mutate: vi.fn(), isPending: false };
}

describe("ServiceTermsCard (cover)", () => {
  beforeEach(() => {
    settingsQueryMock.mockReset();
    saveMutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    saveMutationMock.mockReturnValue(idleMutation());
  });

  it("loads the saved footer text into the editor", async () => {
    settingsQueryMock.mockReturnValue(
      loadedQuery(settings("Pie de página guardado por el taller.")),
    );

    renderWithProviders(<ServiceTermsCard />);

    const textarea = await screen.findByTestId(
      "settings.service_terms.textarea",
    );
    await waitFor(() =>
      expect(textarea).toHaveValue("Pie de página guardado por el taller."),
    );
    expect(useServiceTermsSettings).toBeDefined();
  });

  it("saves the trimmed footer text through the backend", async () => {
    const mutate = vi.fn();
    saveMutationMock.mockReturnValue({ mutate, isPending: false });
    settingsQueryMock.mockReturnValue(loadedQuery(settings("Texto inicial")));

    renderWithProviders(<ServiceTermsCard />);

    const textarea = await screen.findByTestId(
      "settings.service_terms.textarea",
    );
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "  Nuevo pie de página  ");

    await userEvent.click(
      screen.getByTestId("settings.service_terms.save_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({ text: "Nuevo pie de página" });
  });

  it("keeps the preview in sync with the typed text", async () => {
    settingsQueryMock.mockReturnValue(loadedQuery(settings("Texto inicial")));

    renderWithProviders(<ServiceTermsCard />);

    const textarea = await screen.findByTestId(
      "settings.service_terms.textarea",
    );
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Pie visible en el documento");

    const preview = screen.getByTestId("settings.service_terms.preview");
    expect(
      within(preview).getByText("Pie visible en el documento"),
    ).toBeInTheDocument();
  });

  it("previews the default reception text when the saved text is empty", async () => {
    settingsQueryMock.mockReturnValue(loadedQuery(settings("")));

    renderWithProviders(<ServiceTermsCard />);

    const preview = await screen.findByTestId("settings.service_terms.preview");
    expect(
      within(preview).getByText(SERVICE_TERMS_DEFAULT_TEXT),
    ).toBeInTheDocument();
    // An empty text cannot be saved; the default is only a fallback.
    expect(
      screen.getByTestId("settings.service_terms.save_button"),
    ).toBeDisabled();
  });

  it("surfaces a load failure with a retry", async () => {
    const refetch = vi.fn();
    settingsQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });

    renderWithProviders(<ServiceTermsCard />);

    expect(
      await screen.findByTestId("settings.service_terms.error_state"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByTestId("settings.service_terms.retry_button"),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
