import { BarcodeScanner } from "@/components/BarcodeScanner";
import type { PartView } from "@/lib/types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted `BarcodeScanner` camera-availability behavior.
 *
 * The accepted change disables the camera action and shows a clear Spanish
 * notice when the device or context cannot open a camera, while keeping manual
 * code entry as the fallback. These tests exercise the real component with a
 * typed local actor mock and a stubbed `getUserMedia`; no camera or network is
 * involved.
 */

const findPartByCodeMock = vi.fn();

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

describe("BarcodeScanner camera availability (cover)", () => {
  beforeEach(() => {
    findPartByCodeMock.mockReset();
    // jsdom has no camera: the component must fall back to manual entry.
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });
    (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector =
      undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("disables the camera and shows the Spanish notice when no camera is available", () => {
    render(<BarcodeScanner ocid="barcode-scanner" onDetected={vi.fn()} />);

    expect(
      screen.getByTestId("barcode-scanner.camera_unavailable_state"),
    ).toHaveTextContent(
      "La cámara no está disponible en este dispositivo o contexto. Ingresa el código manualmente.",
    );
    expect(screen.getByTestId("barcode-scanner.start_button")).toBeDisabled();
  });

  it("still resolves a manually typed code when the camera is unavailable", async () => {
    const resolved = part();
    findPartByCodeMock.mockResolvedValue({
      __kind__: "found",
      found: resolved,
    });
    const onDetected = vi.fn();

    render(<BarcodeScanner ocid="barcode-scanner" onDetected={onDetected} />);

    await userEvent.type(
      screen.getByTestId("barcode-scanner.input"),
      "REP-0042",
    );
    await userEvent.click(screen.getByTestId("barcode-scanner.submit_button"));

    await waitFor(() => expect(onDetected).toHaveBeenCalledTimes(1));
    expect(onDetected).toHaveBeenCalledWith(resolved, "REP-0042");
    expect(findPartByCodeMock).toHaveBeenCalledWith(
      "session-token",
      "REP-0042",
    );
  });

  it("shows the Spanish not-found notice for an unknown code when the camera is unavailable", async () => {
    findPartByCodeMock.mockResolvedValue({
      __kind__: "notFound",
      notFound: null,
    });
    const onDetected = vi.fn();

    render(<BarcodeScanner ocid="barcode-scanner" onDetected={onDetected} />);

    await userEvent.type(
      screen.getByTestId("barcode-scanner.input"),
      "NO-EXISTE",
    );
    await userEvent.click(screen.getByTestId("barcode-scanner.submit_button"));

    expect(
      await screen.findByTestId("barcode-scanner.not_found_state"),
    ).toHaveTextContent("Producto no encontrado para el código NO-EXISTE.");
    expect(onDetected).not.toHaveBeenCalled();
  });
});
