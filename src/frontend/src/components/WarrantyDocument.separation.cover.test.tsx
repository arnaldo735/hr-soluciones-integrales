import { WarrantyDocument } from "@/components/WarrantyDocument";
import type { WarrantyDocumentData } from "@/lib/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Cover for the accepted change: in the warranty document the company header,
 * the customer/moto/fecha/técnico identity block and the body (the 8 clauses
 * plus the IMPORTANTE notice) are separate normal-flow blocks, so the header
 * can never be drawn over the identity or the body.
 *
 * The accepted change removes the absolute/fixed positioning that let the
 * header overlap the blocks below it and gives each block its own top margin
 * (`.doc-warranty-identity`, `.doc-warranty-clauses`, `.doc-warranty-important`
 * in `index.css`). This file pins the structural contract jsdom can see: the
 * three blocks are distinct siblings in document order, each carries the class
 * the stylesheet gives its own top margin, and the identity/clauses/IMPORTANTE
 * are not nested inside the header.
 *
 * jsdom does not lay out CSS, so the no-overlap assertions read the structural
 * classes and the DOM order the component applies; the actual pixel stacking is
 * a CSS concern covered by the class contract and the print rules in
 * `WarrantyDocument.print.cover.test.ts`. The PDF cursor ordering is covered in
 * `lib/pdf.warranty-separation.cover.test.ts`.
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

function renderWarranty(
  overrides: Partial<React.ComponentProps<typeof WarrantyDocument>> = {},
) {
  return render(
    <WarrantyDocument
      data={warrantyData()}
      companyName="HR SOLUCIONES INTEGRALES S.A.S."
      companyContact="Calle 45 #12-30, Bogotá · +57 300 000 0000"
      companyFiscal={["NIT 900.123.456-8", "Responsable de IVA"]}
      format="a4"
      ocid="warranty"
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

/** The header row that holds the company identity and the title block. */
function header(): HTMLElement {
  const element = paper().querySelector("header");
  if (!(element instanceof HTMLElement)) {
    throw new Error("document header element not found");
  }
  return element;
}

describe("WarrantyDocument block separation (cover)", () => {
  it("renders header, identity, clauses and IMPORTANTE as distinct siblings in order", () => {
    renderWarranty();

    const sheet = paper();
    const row = header();
    const identity = screen.getByTestId("warranty.identity");
    const clauses = screen.getByTestId("warranty.clauses");
    const important = screen.getByTestId("warranty.important");

    // Each block is a direct child of the paper, not nested inside the header
    // or inside one another, so no block can be painted over another.
    expect(row.parentElement).toBe(sheet);
    expect(identity.parentElement).toBe(sheet);
    expect(clauses.parentElement).toBe(sheet);
    expect(important.parentElement).toBe(sheet);

    // Document order: header → identity → clauses → IMPORTANTE.
    const order = [row, identity, clauses, important];
    for (let index = 1; index < order.length; index += 1) {
      const previous = order[index - 1];
      const current = order[index];
      expect(
        previous.compareDocumentPosition(current) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    // The identity and the body are not inside the header.
    expect(row.contains(identity)).toBe(false);
    expect(row.contains(clauses)).toBe(false);
    expect(row.contains(important)).toBe(false);
  });

  it("gives the identity and the clauses their own top-margin class", () => {
    renderWarranty();

    // The stylesheet gives each block its own top margin, so the block below
    // starts below the previous one instead of on top of it.
    expect(screen.getByTestId("warranty.identity")).toHaveClass(
      "doc-warranty-identity",
    );
    expect(screen.getByTestId("warranty.clauses")).toHaveClass(
      "doc-warranty-clauses",
    );
    expect(screen.getByTestId("warranty.important")).toHaveClass(
      "doc-warranty-important",
    );
  });

  it("keeps the separation in the 80 mm tirilla too", () => {
    renderWarranty({ format: "receipt80" });

    const sheet = paper();
    const row = header();
    const identity = screen.getByTestId("warranty.identity");
    const clauses = screen.getByTestId("warranty.clauses");
    const important = screen.getByTestId("warranty.important");

    // The 80 mm roll uses the same normal-flow block structure.
    expect(row.parentElement).toBe(sheet);
    expect(identity.parentElement).toBe(sheet);
    expect(clauses.parentElement).toBe(sheet);
    expect(important.parentElement).toBe(sheet);
    expect(identity).toHaveClass("doc-warranty-identity");
    expect(clauses).toHaveClass("doc-warranty-clauses");
    expect(important).toHaveClass("doc-warranty-important");

    // The identity grid is the element the 80 mm rule collapses to one column.
    const grid = identity.querySelector("dl");
    expect(grid).not.toBeNull();
    expect(grid).toHaveClass("grid");
  });

  it("keeps the identity and body separated when the saved terms replace the clauses", () => {
    renderWarranty({ termsText: "Texto configurado por el administrador." });

    const sheet = paper();
    const identity = screen.getByTestId("warranty.identity");
    const terms = screen.getByTestId("warranty.terms_text");

    // The saved single block still sits in the clauses section, below the
    // identity, and the IMPORTANTE notice is dropped.
    expect(identity.parentElement).toBe(sheet);
    expect(terms.closest(".doc-warranty-clauses")).not.toBeNull();
    expect(screen.queryByTestId("warranty.important")).toBeNull();
  });
});
