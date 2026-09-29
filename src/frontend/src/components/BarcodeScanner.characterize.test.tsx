import { BarcodeScanner } from "@/components/BarcodeScanner";
import type { PartView } from "@/lib/types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the shared `BarcodeScanner` component.
 *
 * The accepted change reworks the camera lifecycle and adds a non-native
 * detection fallback, so this file deliberately does NOT assert the camera
 * start/stop behavior or the native `BarcodeDetector` path — those are the
 * behaviors intentionally changing. It protects the surrounding working
 * behavior that must survive: manual code entry resolves through the backend
 * `findPartByCode` (barcode or SKU) and reports the resolved product, an
 * unknown code shows the Spanish "producto no encontrado" notice and adds
 * nothing, a browser without the native API still offers manual entry, and a
 * backend failure surfaces a Spanish error instead of a silent no-op.
 *
 * The actor is a typed local mock; no network or camera is involved.
 */

const findPartByCodeMock = vi.fn();

// The real `useBackend` returns a stable actor for the app's lifetime; a fresh
// actor object per render would change the scanner's `start` identity and
// re-run its mount effect, which is a harness artifact, not app behavior.
const stableActor = { findPartByCode: findPartByCodeMock };

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: stableActor,
    isFetching: false,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "session-token" }),
}));

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 42n,
    sku: "REP-0042",
    name: "Filtro de aceite",
    category: "Motor",
    brand: "Genérico",
    unit: "unidad",
    salePrice: 25_000n,
    costPrice: 15_000n,
    lowStockThreshold: 2n,
    totalStock: 10n,
    barcode: "7701234567890",
    lowStock: false,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

/** The scanner's manual-entry form, identified by its stable ocid. */
function manualInput() {
  return screen.getByTestId("barcode-scanner.input");
}

function submitManual() {
  return screen.getByTestId("barcode-scanner.submit_button");
}

describe("BarcodeScanner (characterization)", () => {
  beforeEach(() => {
    findPartByCodeMock.mockReset();
    // jsdom has no native BarcodeDetector, so the component renders its
    // unsupported notice and relies on manual entry — the fallback path.
    // The key must be absent (not `= undefined`): the hook's capability check
    // is `"BarcodeDetector" in window`, and assigning `undefined` still leaves
    // the key present, which would report the native API as supported.
    // `Reflect.deleteProperty` removes the key without the `delete` operator,
    // which the lint rule forbids.
    Reflect.deleteProperty(
      window as unknown as Record<string, unknown>,
      "BarcodeDetector",
    );
  });

  it("resolves a manually typed code and reports the matched product", async () => {
    const resolved = part();
    findPartByCodeMock.mockResolvedValue({
      __kind__: "found",
      found: resolved,
    });
    const onDetected = vi.fn();

    render(<BarcodeScanner ocid="barcode-scanner" onDetected={onDetected} />);

    await userEvent.type(manualInput(), "7701234567890");
    await userEvent.click(submitManual());

    await waitFor(() => expect(onDetected).toHaveBeenCalledTimes(1));
    expect(onDetected).toHaveBeenCalledWith(resolved, "7701234567890");
    // The lookup goes through the shared backend resolver with the session token.
    expect(findPartByCodeMock).toHaveBeenCalledWith(
      "session-token",
      "7701234567890",
    );
  });

  it("trims the typed code before resolving it", async () => {
    findPartByCodeMock.mockResolvedValue({
      __kind__: "found",
      found: part(),
    });

    render(<BarcodeScanner ocid="barcode-scanner" onDetected={vi.fn()} />);

    await userEvent.type(manualInput(), "  REP-0042  ");
    await userEvent.click(submitManual());

    await waitFor(() =>
      expect(findPartByCodeMock).toHaveBeenCalledWith(
        "session-token",
        "REP-0042",
      ),
    );
  });

  it("shows the Spanish not-found notice and reports the code for an unknown code", async () => {
    findPartByCodeMock.mockResolvedValue({
      __kind__: "notFound",
      notFound: null,
    });
    const onDetected = vi.fn();
    const onNotFound = vi.fn();

    render(
      <BarcodeScanner
        ocid="barcode-scanner"
        onDetected={onDetected}
        onNotFound={onNotFound}
      />,
    );

    await userEvent.type(manualInput(), "NO-EXISTE");
    await userEvent.click(submitManual());

    const notice = await screen.findByTestId("barcode-scanner.not_found_state");
    expect(notice).toHaveTextContent(
      "Producto no encontrado para el código NO-EXISTE.",
    );
    expect(onNotFound).toHaveBeenCalledWith("NO-EXISTE");
    // An unknown code never adds a product.
    expect(onDetected).not.toHaveBeenCalled();
  });

  it("offers manual entry when the browser lacks the native detection API", async () => {
    findPartByCodeMock.mockResolvedValue({
      __kind__: "found",
      found: part(),
    });
    const onDetected = vi.fn();

    render(<BarcodeScanner ocid="barcode-scanner" onDetected={onDetected} />);

    // The unsupported notice is shown and the camera button is disabled, but
    // the manual form remains usable.
    expect(
      screen.getByTestId("barcode-scanner.unsupported_state"),
    ).toHaveTextContent(
      "Este navegador no trae la lectura nativa; se usa el lector integrado.",
    );
    expect(screen.getByTestId("barcode-scanner.start_button")).toBeDisabled();

    await userEvent.type(manualInput(), "REP-0042");
    await userEvent.click(submitManual());

    await waitFor(() => expect(onDetected).toHaveBeenCalledTimes(1));
  });

  it("shows a Spanish error when the backend lookup fails", async () => {
    findPartByCodeMock.mockRejectedValue(new Error("network down"));
    const onDetected = vi.fn();

    render(<BarcodeScanner ocid="barcode-scanner" onDetected={onDetected} />);

    await userEvent.type(manualInput(), "REP-0042");
    await userEvent.click(submitManual());

    // jsdom has no camera, so the mount effect also sets a camera error; the
    // manual lookup clears it and then surfaces the backend failure.
    await waitFor(() =>
      expect(
        screen.getByTestId("barcode-scanner.error_state"),
      ).toHaveTextContent(
        "No se pudo consultar el código. Inténtalo de nuevo.",
      ),
    );
    expect(onDetected).not.toHaveBeenCalled();
  });

  it("does not resolve an empty or whitespace-only code", async () => {
    render(<BarcodeScanner ocid="barcode-scanner" onDetected={vi.fn()} />);

    // The submit button stays disabled for an empty code, and typing only
    // whitespace keeps it disabled, so no lookup is ever issued.
    expect(submitManual()).toBeDisabled();
    await userEvent.type(manualInput(), "   ");
    expect(submitManual()).toBeDisabled();
    expect(findPartByCodeMock).not.toHaveBeenCalled();
  });
});
