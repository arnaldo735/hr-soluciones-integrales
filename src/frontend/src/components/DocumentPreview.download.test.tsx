import { DocumentPreview } from "@/components/DocumentPreview";
import type { DocumentFormat } from "@/lib/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the shared document download seam.
 *
 * The accepted change makes «Descargar PDF» save a real file on mobile and
 * tablet instead of relying on the browser print dialog. Every document page
 * (factura, cotización, ficha de contacto, comprobante, reporte) routes its
 * download through this one component, so this file protects the contract the
 * new mobile path must keep:
 *
 * - with no `onDownloadPdf`, the button still opens the browser print dialog
 *   (the existing desktop fallback);
 * - with `onDownloadPdf`, the button delegates to it with the currently
 *   selected format and never opens the print dialog;
 * - while `isDownloading` is true the button is disabled and reads
 *   «Generando…», then returns to «Descargar PDF» when the download settles.
 *
 * It never asserts the exact PDF bytes or the copy of any page that mounts it.
 */

function renderPreview(
  overrides: Partial<React.ComponentProps<typeof DocumentPreview>> = {},
) {
  return render(
    <DocumentPreview
      title="Factura"
      number="FAC-0001"
      companyName="HR SOLUCIONES INTEGRALES"
      meta={[{ label: "Cliente", value: "Ada Lovelace" }]}
      lines={[
        {
          description: "Balata de freno",
          quantity: 2,
          unitPrice: 250,
          amount: 500,
        },
      ]}
      totals={[{ label: "Total", value: "$ 580", emphasis: true }]}
      format="a4"
      ocid="doc.preview"
      {...overrides}
    />,
  );
}

describe("DocumentPreview download seam", () => {
  beforeEach(() => {
    vi.spyOn(window, "print").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to the print dialog when no download handler is given", async () => {
    renderPreview();

    await userEvent.click(screen.getByTestId("doc.preview.download_button"));

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("delegates to the download handler with the selected format instead of printing", async () => {
    const onDownloadPdf = vi.fn();
    // The format toggle is only rendered when the caller controls the format.
    renderPreview({ onDownloadPdf, onFormatChange: vi.fn() });

    await userEvent.click(screen.getByTestId("doc.preview.format_receipt80"));
    await userEvent.click(screen.getByTestId("doc.preview.download_button"));

    expect(onDownloadPdf).toHaveBeenCalledTimes(1);
    expect(onDownloadPdf).toHaveBeenCalledWith("receipt80");
    expect(window.print).not.toHaveBeenCalled();
  });

  it("reports the A4 format by default when the handler is given", async () => {
    const onDownloadPdf = vi.fn();
    renderPreview({ onDownloadPdf });

    await userEvent.click(screen.getByTestId("doc.preview.download_button"));

    expect(onDownloadPdf).toHaveBeenCalledWith("a4");
  });

  it("disables the download control and shows progress while a download is in flight", () => {
    renderPreview({ onDownloadPdf: vi.fn(), isDownloading: true });

    const button = screen.getByTestId("doc.preview.download_button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Generando…");
  });

  it("re-enables the download control once the download settles", async () => {
    const onDownloadPdf = vi.fn();
    const { rerender } = renderPreview({ onDownloadPdf, isDownloading: true });

    expect(screen.getByTestId("doc.preview.download_button")).toBeDisabled();

    rerender(
      <DocumentPreview
        title="Factura"
        number="FAC-0001"
        companyName="HR SOLUCIONES INTEGRALES"
        meta={[{ label: "Cliente", value: "Ada Lovelace" }]}
        lines={[]}
        totals={[]}
        format="a4"
        ocid="doc.preview"
        onDownloadPdf={onDownloadPdf}
        isDownloading={false}
      />,
    );

    const button = screen.getByTestId("doc.preview.download_button");
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Descargar PDF");
  });

  it("keeps the format toggle reporting the chosen format to the caller", async () => {
    const onFormatChange = vi.fn<(format: DocumentFormat) => void>();
    renderPreview({ onFormatChange });

    await userEvent.click(screen.getByTestId("doc.preview.format_receipt80"));
    expect(onFormatChange).toHaveBeenLastCalledWith("receipt80");

    await userEvent.click(screen.getByTestId("doc.preview.format_a4"));
    expect(onFormatChange).toHaveBeenLastCalledWith("a4");
  });
});
