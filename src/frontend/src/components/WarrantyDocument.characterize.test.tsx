import { WarrantyDocument } from "@/components/WarrantyDocument";
import type { WarrantyDocumentData } from "@/lib/types";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the structural contract of the work-order
 * warranty document, ahead of making its text admin-editable.
 *
 * The accepted change turns the fixed "Términos y Condiciones de Garantía"
 * copy into an admin-editable setting. What must NOT change is the document's
 * shape and behavior: it renders nothing when there is no data, it prints the
 * identification block, the eight numbered clauses and the IMPORTANTE notice,
 * it toggles between A4 and the 80 mm receipt, and it reports the chosen format
 * to its callbacks. The exact clause wording is deliberately not frozen here —
 * that is precisely what the change makes editable.
 */

function warrantyData(
  overrides: Partial<WarrantyDocumentData> = {},
): WarrantyDocumentData {
  return {
    orderNumber: "OT-000123",
    customerName: "Ada Lovelace",
    customerDocument: "1020304050",
    motorcycleBrand: "Yamaha",
    motorcycleModel: "FZ 2.0",
    motorcycleYear: 2022n,
    motorcyclePlate: "ABC12D",
    serviceDate: 1_700_000_000_000_000_000n,
    technicianCode: "TEC-01",
    technicianName: "Marco Pérez",
    ...overrides,
  };
}

describe("WarrantyDocument (characterization)", () => {
  it("renders nothing at all when there is no data", () => {
    const { container } = render(
      <WarrantyDocument
        data={null}
        companyName="HR MOTOCICLETAS"
        format="a4"
        ocid="warranty"
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("warranty")).not.toBeInTheDocument();
  });

  it("renders the identification block with the order and customer", () => {
    render(
      <WarrantyDocument
        data={warrantyData()}
        companyName="HR MOTOCICLETAS"
        format="a4"
        ocid="warranty"
      />,
    );

    const document = screen.getByTestId("warranty");
    const identity = within(document).getByTestId("warranty.identity");
    expect(within(identity).getByText("Ada Lovelace")).toBeInTheDocument();
    expect(within(identity).getByText("Yamaha FZ 2.0")).toBeInTheDocument();
    expect(within(identity).getByText("ABC12D")).toBeInTheDocument();
    expect(
      within(identity).getByText("TEC-01 · Marco Pérez"),
    ).toBeInTheDocument();
    // The order number sits in the header, next to the document title.
    expect(within(document).getByText("OT-000123")).toBeInTheDocument();
  });

  it("renders eight numbered clauses and the IMPORTANTE notice", () => {
    render(
      <WarrantyDocument
        data={warrantyData()}
        companyName="HR MOTOCICLETAS"
        format="a4"
        ocid="warranty"
      />,
    );

    const document = screen.getByTestId("warranty");
    for (let number = 1; number <= 8; number += 1) {
      const clause = within(document).getByTestId(`warranty.clause.${number}`);
      // Each clause carries a non-empty title and body; the wording itself is
      // what the admin-editable setting will supply, so it is not frozen.
      expect(clause.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    }
    expect(within(document).queryByTestId("warranty.clause.9")).toBeNull();

    const important = within(document).getByTestId("warranty.important");
    expect(important).toHaveTextContent("IMPORTANTE");
    expect(important.textContent?.trim().length ?? 0).toBeGreaterThan(
      "IMPORTANTE".length,
    );
  });

  it("toggles between A4 and the 80 mm receipt and reports the choice", async () => {
    const onFormatChange = vi.fn();
    render(
      <WarrantyDocument
        data={warrantyData()}
        companyName="HR MOTOCICLETAS"
        format="a4"
        ocid="warranty"
        onFormatChange={onFormatChange}
      />,
    );

    const document = screen.getByTestId("warranty");
    expect(document.querySelector(".doc-preview-a4")).not.toBeNull();

    await userEvent.click(
      within(document).getByTestId("warranty.format_receipt80"),
    );

    expect(document.querySelector(".doc-preview-80mm")).not.toBeNull();
    expect(document.querySelector(".doc-preview-a4")).toBeNull();
    expect(onFormatChange).toHaveBeenCalledWith("receipt80");
  });

  it("reports the active format to the PDF download callback", async () => {
    const onDownloadPdf = vi.fn();
    render(
      <WarrantyDocument
        data={warrantyData()}
        companyName="HR MOTOCICLETAS"
        format="a4"
        ocid="warranty"
        onFormatChange={vi.fn()}
        onDownloadPdf={onDownloadPdf}
      />,
    );

    const document = screen.getByTestId("warranty");
    await userEvent.click(
      within(document).getByTestId("warranty.format_receipt80"),
    );
    await userEvent.click(
      within(document).getByTestId("warranty.download_button"),
    );

    expect(onDownloadPdf).toHaveBeenCalledWith("receipt80");
  });

  it("hides the format selector when no change handler is provided", () => {
    render(
      <WarrantyDocument
        data={warrantyData()}
        companyName="HR MOTOCICLETAS"
        format="a4"
        ocid="warranty"
      />,
    );

    const document = screen.getByTestId("warranty");
    expect(within(document).queryByTestId("warranty.format_toggle")).toBeNull();
    // The static paper label still tells the reader which format is shown.
    expect(within(document).getByText("Hoja A4")).toBeInTheDocument();
  });
});
