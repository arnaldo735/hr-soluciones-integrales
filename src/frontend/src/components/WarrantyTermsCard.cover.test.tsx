import { WarrantyTermsCard } from "@/components/WarrantyTermsCard";
import {
  WARRANTY_TERMS_DEFAULT_TEXT,
  useWarrantyTermsSettings,
} from "@/hooks/use-warranty-terms";
import type { WarrantyTermsSettings } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the admin-editable "Términos y Condiciones de Garantía" editor.
 *
 * The accepted change replaces the fixed warranty copy with a single global
 * text the administrator edits once and every work-order warranty document
 * reads. This suite covers the editor's own contract: it loads the saved text,
 * saves the trimmed text through the backend, keeps the preview in sync with
 * what is typed, restores the default text on demand, and falls back to the
 * default when nothing is saved.
 *
 * The backend is mocked at the hook seam, so a passing run says nothing about
 * the real `getWarrantyTermsSettings`/`updateWarrantyTermsSettings` canister
 * methods or the default text the backend returns for an empty save.
 */

const {
  settingsQueryMock,
  saveMutationMock,
  toastSuccessMock,
  toastErrorMock,
  toastInfoMock,
} = vi.hoisted(() => ({
  settingsQueryMock: vi.fn(),
  saveMutationMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastInfoMock: vi.fn(),
}));

vi.mock("@/hooks/use-warranty-terms", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-warranty-terms")>();
  return {
    ...actual,
    useWarrantyTermsSettings: () => settingsQueryMock(),
    useUpdateWarrantyTermsSettings: () => saveMutationMock(),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
    info: toastInfoMock,
  },
}));

function settings(text: string): WarrantyTermsSettings {
  return { text, updatedAt: 1_700_000_000_000_000_000n };
}

function loadedQuery(data: WarrantyTermsSettings | null) {
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

describe("WarrantyTermsCard (cover)", () => {
  beforeEach(() => {
    settingsQueryMock.mockReset();
    saveMutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    toastInfoMock.mockReset();
    saveMutationMock.mockReturnValue(idleMutation());
  });

  it("loads the saved warranty text into the editor", async () => {
    settingsQueryMock.mockReturnValue(
      loadedQuery(settings("Texto de garantía guardado por el taller.")),
    );

    renderWithProviders(<WarrantyTermsCard />);

    const textarea = await screen.findByTestId(
      "settings.warranty_terms.textarea",
    );
    await waitFor(() =>
      expect(textarea).toHaveValue("Texto de garantía guardado por el taller."),
    );
    expect(useWarrantyTermsSettings).toBeDefined();
  });

  it("saves the trimmed warranty text through the backend", async () => {
    const mutate = vi.fn();
    saveMutationMock.mockReturnValue({ mutate, isPending: false });
    settingsQueryMock.mockReturnValue(loadedQuery(settings("Texto inicial")));

    renderWithProviders(<WarrantyTermsCard />);

    const textarea = await screen.findByTestId(
      "settings.warranty_terms.textarea",
    );
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "  Nuevo texto de garantía  ");

    await userEvent.click(
      screen.getByTestId("settings.warranty_terms.save_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      text: "Nuevo texto de garantía",
    });
  });

  it("keeps the preview in sync with the typed text", async () => {
    settingsQueryMock.mockReturnValue(loadedQuery(settings("Texto inicial")));

    renderWithProviders(<WarrantyTermsCard />);

    const textarea = await screen.findByTestId(
      "settings.warranty_terms.textarea",
    );
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Garantía visible en el documento");

    const preview = screen.getByTestId("settings.warranty_terms.preview");
    expect(
      within(preview).getByText("Garantía visible en el documento"),
    ).toBeInTheDocument();
  });

  it("previews the default warranty text when the saved text is empty", async () => {
    settingsQueryMock.mockReturnValue(loadedQuery(settings("")));

    renderWithProviders(<WarrantyTermsCard />);

    const preview = await screen.findByTestId(
      "settings.warranty_terms.preview",
    );
    expect(preview.textContent).toBe(WARRANTY_TERMS_DEFAULT_TEXT);
    // An empty text cannot be saved; the default is only a fallback.
    expect(
      screen.getByTestId("settings.warranty_terms.save_button"),
    ).toBeDisabled();
  });

  it("restores the default warranty text into the editor", async () => {
    settingsQueryMock.mockReturnValue(loadedQuery(settings("Texto inicial")));

    renderWithProviders(<WarrantyTermsCard />);

    const textarea = await screen.findByTestId(
      "settings.warranty_terms.textarea",
    );
    await userEvent.click(
      screen.getByTestId("settings.warranty_terms.restore_default_button"),
    );

    await waitFor(() =>
      expect(textarea).toHaveValue(WARRANTY_TERMS_DEFAULT_TEXT),
    );
    expect(toastInfoMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces a load failure with a retry", async () => {
    const refetch = vi.fn();
    settingsQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });

    renderWithProviders(<WarrantyTermsCard />);

    expect(
      await screen.findByTestId("settings.warranty_terms.error_state"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByTestId("settings.warranty_terms.retry_button"),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
