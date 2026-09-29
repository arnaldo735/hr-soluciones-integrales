import { DocumentPreview } from "@/components/DocumentPreview";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Cover for the accepted change: on screen, every company datum in the 80 mm
 * tirilla header occupies its own full-width row with its own vertical space,
 * so no datum overlaps another.
 *
 * The accepted change gives the 80 mm header a stacked, centered layout where
 * the identity block and the title block each take the full roll width
 * (`w-full`) and the company text column spaces its rows (`space-y-1`). The A4
 * header keeps its two-column layout, which is characterized separately.
 *
 * jsdom does not lay out CSS, so the assertions read the structural classes the
 * component applies — the observable seam jsdom can see. The actual pixel
 * stacking is a CSS concern covered by the class contract.
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

describe("DocumentPreview 80 mm header no-overlap (cover)", () => {
  it("gives the identity and title blocks the full roll width", () => {
    renderPreview({ format: "receipt80", companyLogoUrl: LOGO_URL });

    const row = header();
    const identity = row.firstElementChild;
    const titleBlock = row.lastElementChild;
    if (!(identity instanceof HTMLElement)) {
      throw new Error("identity block not found");
    }
    if (!(titleBlock instanceof HTMLElement)) {
      throw new Error("title block not found");
    }

    // Each block spans the full roll width instead of sharing a row, so the
    // title/number cannot sit beside the identity and overlap it.
    expect(identity.className).toContain("w-full");
    expect(titleBlock.className).toContain("w-full");
  });

  it("spaces the company text rows so no datum touches the next", () => {
    renderPreview({ format: "receipt80", companyLogoUrl: LOGO_URL });

    const identity = header().firstElementChild;
    if (!(identity instanceof HTMLElement)) {
      throw new Error("identity block not found");
    }

    // The company text column (razón social, contact line, fiscal block) is
    // the identity block's last child and spaces its rows vertically.
    const textColumn = identity.lastElementChild;
    if (!(textColumn instanceof HTMLElement)) {
      throw new Error("company text column not found");
    }
    expect(textColumn.className).toContain("w-full");
    expect(textColumn.className).toContain("space-y-1");

    // The razón social, the contact line and the fiscal block each live in
    // their own element inside that column.
    expect(textColumn.contains(screen.getByText(/Calle 45 #12-30/))).toBe(true);
    expect(
      textColumn.contains(screen.getByTestId("doc.preview.fiscal_block")),
    ).toBe(true);
  });

  it("keeps the A4 header two-column without the full-width stacking", () => {
    renderPreview({ format: "a4", companyLogoUrl: LOGO_URL });

    const row = header();
    const identity = row.firstElementChild;
    const titleBlock = row.lastElementChild;
    if (!(identity instanceof HTMLElement)) {
      throw new Error("identity block not found");
    }
    if (!(titleBlock instanceof HTMLElement)) {
      throw new Error("title block not found");
    }

    // A4 keeps its spread row: the identity is not forced to full width and
    // the title block stays right-aligned rather than centered.
    expect(identity.className).not.toContain("w-full");
    expect(titleBlock.className).not.toContain("w-full");
    expect(titleBlock.className).toContain("text-right");
  });
});
