import { DocumentPreview } from "@/components/DocumentPreview";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Characterization: the A4 document header layout that must NOT change.
 *
 * The accepted change reworks the 80 mm tirilla header so the logo and the
 * company text are centered on the roll. The A4 sheet header is explicitly out
 * of scope: it must keep its current layout — the logo to the left of the
 * company identity, the document title and number right-aligned on the same
 * row, and the whole header spread edge to edge.
 *
 * This file pins only that A4 layout contract. It deliberately does not assert
 * the 80 mm header alignment, which the accepted change intentionally alters.
 */

const LOGO_URL = "https://gateway.example.com/logo-hash.png";

function renderPreview(
  overrides: Partial<React.ComponentProps<typeof DocumentPreview>> = {},
) {
  return render(
    <DocumentPreview
      title="Factura"
      number="FAC-000128"
      companyName="HR SOLUCIONES INTEGRALES S.A.S."
      companyContact="Calle 45 #12-30, Bogotá · +57 300 000 0000"
      companyFiscal={["NIT 900.123.456-8", "No responsable de IVA"]}
      meta={[{ label: "Cliente", value: "Ada Lovelace" }]}
      lines={[
        {
          description: "Cambio de aceite",
          quantity: 1,
          unitPrice: 450,
          amount: 450,
        },
      ]}
      totals={[{ label: "Total", value: "$ 522", emphasis: true }]}
      format="a4"
      ocid="doc.preview"
      {...overrides}
    />,
  );
}

/** The A4 paper element carrying the format-specific class. */
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

describe("DocumentPreview A4 header layout (characterization)", () => {
  it("keeps the A4 paper class and does not apply the 80 mm class", () => {
    renderPreview({ format: "a4" });

    expect(paper().className).toContain("doc-preview-a4");
    expect(paper().className).not.toContain("doc-preview-80mm");
  });

  it("spreads the header edge to edge with the identity left and the title right", () => {
    renderPreview();

    const row = header();
    // The header is a single spread row: identity on the left, title block on
    // the right. This is the A4 layout the accepted change must preserve.
    expect(row.className).toContain("justify-between");

    const identity = row.firstElementChild;
    const titleBlock = row.lastElementChild;
    expect(identity).not.toBeNull();
    expect(titleBlock).not.toBeNull();
    expect(identity).not.toBe(titleBlock);

    // The right-hand block holds the document title and number, right-aligned.
    expect(titleBlock?.className).toContain("text-right");
    expect(titleBlock).toHaveTextContent("Factura");
    expect(titleBlock).toHaveTextContent("FAC-000128");
  });

  it("places the logo to the left of the company identity in the A4 header", () => {
    renderPreview({ companyLogoUrl: LOGO_URL });

    const row = header();
    const identity = row.firstElementChild;
    if (!(identity instanceof HTMLElement)) {
      throw new Error("identity block not found");
    }

    const logo = screen.getByTestId("doc.preview.logo");
    const name = screen.getByText("HR SOLUCIONES INTEGRALES S.A.S.");

    // The logo and the company text share the left-hand identity block, with
    // the logo first in document order.
    expect(identity.contains(logo)).toBe(true);
    expect(identity.contains(name)).toBe(true);
    expect(
      logo.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("keeps the company contact and fiscal block inside the A4 identity block", () => {
    renderPreview();

    const identity = header().firstElementChild;
    if (!(identity instanceof HTMLElement)) {
      throw new Error("identity block not found");
    }

    expect(identity.contains(screen.getByText(/Calle 45 #12-30, Bogotá/))).toBe(
      true,
    );
    expect(
      identity.contains(screen.getByTestId("doc.preview.fiscal_block")),
    ).toBe(true);
  });
});
