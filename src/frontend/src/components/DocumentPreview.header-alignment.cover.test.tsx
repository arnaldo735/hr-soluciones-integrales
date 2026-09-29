import { DocumentPreview } from "@/components/DocumentPreview";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Cover for the accepted header alignment of the on-screen document preview.
 *
 * The accepted change centers the logo and the company text horizontally on the
 * 80 mm tirilla preview, while the A4 preview keeps its current two-column
 * header (logo to the left of the identity block, title/number right-aligned).
 * The A4 contract is characterized separately in
 * `DocumentPreview.a4-header.characterize.test.tsx`; this file pins the new
 * 80 mm centering and the A4 contrast in one place.
 *
 * The assertions read the layout classes the component applies, which is the
 * observable seam jsdom can see; the actual pixel centering is a CSS concern
 * covered by the class contract.
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

describe("DocumentPreview header alignment (cover)", () => {
  it("centers the 80 mm header, identity and title blocks", () => {
    renderPreview({ format: "receipt80", companyLogoUrl: LOGO_URL });

    const row = header();
    // The 80mm header stacks and centers instead of spreading edge to edge.
    expect(row.className).toContain("flex-col");
    expect(row.className).toContain("items-center");
    expect(row.className).toContain("text-center");
    expect(row.className).not.toContain("justify-between");

    const identity = row.firstElementChild;
    const titleBlock = row.lastElementChild;
    expect(identity).not.toBeNull();
    expect(titleBlock).not.toBeNull();
    if (!(identity instanceof HTMLElement)) {
      throw new Error("identity block not found");
    }
    if (!(titleBlock instanceof HTMLElement)) {
      throw new Error("title block not found");
    }

    // The identity block (logo + company text) is centered too.
    expect(identity.className).toContain("items-center");
    expect(identity.className).toContain("text-center");
    // The title/number block is centered rather than right-aligned.
    expect(titleBlock.className).toContain("text-center");
    expect(titleBlock.className).not.toContain("text-right");
  });

  it("keeps the logo and the company text inside the centered 80 mm identity block", () => {
    renderPreview({ format: "receipt80", companyLogoUrl: LOGO_URL });

    const identity = header().firstElementChild;
    if (!(identity instanceof HTMLElement)) {
      throw new Error("identity block not found");
    }

    const logo = screen.getByTestId("doc.preview.logo");
    const name = screen.getByText("HR SOLUCIONES INTEGRALES S.A.S.");
    expect(identity.contains(logo)).toBe(true);
    expect(identity.contains(name)).toBe(true);
  });

  it("keeps the A4 header spread with the identity left and the title right", () => {
    renderPreview({ format: "a4", companyLogoUrl: LOGO_URL });

    const row = header();
    expect(row.className).toContain("justify-between");
    expect(row.className).not.toContain("flex-col");

    const identity = row.firstElementChild;
    const titleBlock = row.lastElementChild;
    if (!(identity instanceof HTMLElement)) {
      throw new Error("identity block not found");
    }
    if (!(titleBlock instanceof HTMLElement)) {
      throw new Error("title block not found");
    }
    expect(identity.className).not.toContain("items-center");
    expect(titleBlock.className).toContain("text-right");
    expect(titleBlock).toHaveTextContent("Factura");
    expect(titleBlock).toHaveTextContent("FAC-000128");
  });
});
