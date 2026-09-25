import { DocumentPreview } from "@/components/DocumentPreview";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the printable document surface.
 *
 * The accepted change requires every generated document to be printable in both
 * A4 and 80 mm receipt formats, which builds on this shared component. These
 * tests protect the behavior it already has and that the new documents will
 * depend on: the A4 and 80 mm formats render distinct paper classes, both
 * formats expose the same print and download controls, and both open the
 * browser print dialog (the supported PDF path). They never assert the exact
 * copy of any page that mounts the component.
 */

function renderPreview(
  overrides: Partial<React.ComponentProps<typeof DocumentPreview>> = {},
) {
  return render(
    <DocumentPreview
      title="Cotización"
      number="COT-0001"
      companyName="Taller Central"
      meta={[{ label: "Cliente", value: "Ada Lovelace" }]}
      lines={[
        {
          description: "Cambio de aceite",
          quantity: 1,
          unitPrice: 450,
          amount: 450,
        },
      ]}
      totals={[{ label: "Total", value: "$ 450", emphasis: true }]}
      format="a4"
      ocid="doc.preview"
      {...overrides}
    />,
  );
}

/** The paper element carrying the format-specific class. */
function paper(): HTMLElement {
  const sheet = document.querySelector(".doc-preview");
  if (!(sheet instanceof HTMLElement)) {
    throw new Error("document paper element not found");
  }
  return sheet;
}

describe("DocumentPreview formats", () => {
  beforeEach(() => {
    vi.spyOn(window, "print").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the A4 paper class for the a4 format", () => {
    renderPreview({ format: "a4" });
    expect(paper().className).toContain("doc-preview-a4");
    expect(paper().className).not.toContain("doc-preview-80mm");
  });

  it("renders the 80 mm paper class for the receipt80 format", () => {
    renderPreview({ format: "receipt80" });
    expect(paper().className).toContain("doc-preview-80mm");
    expect(paper().className).not.toContain("doc-preview-a4");
  });

  it("exposes the print and download controls in both formats", () => {
    const { unmount } = renderPreview({ format: "a4" });
    expect(screen.getByTestId("doc.preview.print_button")).toBeInTheDocument();
    expect(
      screen.getByTestId("doc.preview.download_button"),
    ).toBeInTheDocument();
    unmount();

    renderPreview({ format: "receipt80" });
    expect(screen.getByTestId("doc.preview.print_button")).toBeInTheDocument();
    expect(
      screen.getByTestId("doc.preview.download_button"),
    ).toBeInTheDocument();
  });

  it("opens the print dialog from the 80 mm format", async () => {
    renderPreview({ format: "receipt80" });

    await userEvent.click(screen.getByTestId("doc.preview.print_button"));

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("opens the print dialog from the download control in both formats", async () => {
    const { unmount } = renderPreview({ format: "a4" });
    await userEvent.click(screen.getByTestId("doc.preview.download_button"));
    expect(window.print).toHaveBeenCalledTimes(1);
    unmount();

    renderPreview({ format: "receipt80" });
    await userEvent.click(screen.getByTestId("doc.preview.download_button"));
    expect(window.print).toHaveBeenCalledTimes(2);
  });

  // --- Accepted behavior: the document scrolls on a narrow screen -----------
  //
  // The accepted change requires document previews and wide tables to scroll
  // horizontally on phone and tablet without breaking the layout. The paper
  // keeps its fixed A4/80 mm width and sits inside an overflow-x container, so
  // a narrow viewport scrolls the sheet instead of clipping it.

  it("wraps the paper in a horizontal scroll container in both formats", () => {
    const { unmount } = renderPreview({ format: "a4" });
    expect(paper().parentElement?.className).toContain("overflow-x-auto");
    unmount();

    renderPreview({ format: "receipt80" });
    expect(paper().parentElement?.className).toContain("overflow-x-auto");
  });
});
