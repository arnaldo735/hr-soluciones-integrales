import { WarrantyDocument } from "@/components/WarrantyDocument";
import type { WarrantyDocumentData } from "@/lib/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Cover for the accepted change: the warranty document header carries the
 * complete company identity and lays each datum out in its own space, in A4 and
 * in the 80 mm tirilla, on screen.
 *
 * `WarrantyDocument` duplicates the printable header markup of
 * `DocumentPreview` (logo, razón social, contact line, fiscal block and the
 * title/number block), so the accepted header rework has to hold here too. This
 * file pins the observable contract jsdom can see: every company datum renders,
 * the 80 mm header stacks and centers each block at full roll width, and the A4
 * header keeps its two-column identity-left / title-right layout.
 *
 * jsdom does not lay out CSS, so the no-overlap assertions read the structural
 * classes the component applies; the actual pixel stacking is a CSS concern
 * covered by the class contract. The PDF bytes are covered separately in
 * `lib/pdf.warranty-header.cover.test.ts`.
 */

const LOGO_URL = "https://gateway.example.com/logo-hash.png";

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
      companyLogoUrl={LOGO_URL}
      companyContact="Calle 45 #12-30, Bogotá · Bogotá D.C. · +57 300 000 0000 · contacto@hr.com · https://hr.com"
      companyFiscal={[
        "NIT 900.123.456-8",
        "Responsable de IVA",
        "Gran contribuyente",
      ]}
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

describe("WarrantyDocument company header (cover)", () => {
  it("renders the complete company identity in the header", () => {
    renderWarranty();

    // Logo, razón social, contact line and fiscal block all render.
    expect(screen.getByTestId("warranty.logo")).toHaveAttribute(
      "src",
      LOGO_URL,
    );
    expect(
      screen.getByText("HR SOLUCIONES INTEGRALES S.A.S."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Calle 45 #12-30, Bogotá/)).toBeInTheDocument();
    expect(screen.getByText(/Bogotá D\.C\./)).toBeInTheDocument();
    expect(screen.getByText(/\+57 300 000 0000/)).toBeInTheDocument();
    expect(screen.getByText(/contacto@hr\.com/)).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/hr\.com/)).toBeInTheDocument();

    const fiscal = screen.getByTestId("warranty.fiscal_block");
    expect(fiscal).toHaveTextContent("NIT 900.123.456-8");
    expect(fiscal).toHaveTextContent("Responsable de IVA");
    expect(fiscal).toHaveTextContent("Gran contribuyente");
    // Each fiscal datum is its own paragraph, so none overlaps another.
    expect(fiscal.querySelectorAll("p")).toHaveLength(3);
  });

  it("stacks and centers each 80 mm header block at full roll width", () => {
    renderWarranty({ format: "receipt80" });

    const row = header();
    // The 80mm header stacks and centers instead of spreading edge to edge.
    expect(row.className).toContain("flex-col");
    expect(row.className).toContain("items-center");
    expect(row.className).toContain("text-center");
    expect(row.className).not.toContain("justify-between");

    const identity = row.firstElementChild;
    const titleBlock = row.lastElementChild;
    if (!(identity instanceof HTMLElement)) {
      throw new Error("identity block not found");
    }
    if (!(titleBlock instanceof HTMLElement)) {
      throw new Error("title block not found");
    }

    // Each block spans the full roll width, so the title/number cannot sit
    // beside the identity and overlap it.
    expect(identity.className).toContain("w-full");
    expect(titleBlock.className).toContain("w-full");
    expect(identity.className).toContain("items-center");
    expect(titleBlock.className).toContain("text-center");
    expect(titleBlock.className).not.toContain("text-right");

    // The company text column spaces its rows so no datum touches the next.
    const textColumn = identity.lastElementChild;
    if (!(textColumn instanceof HTMLElement)) {
      throw new Error("company text column not found");
    }
    expect(textColumn.className).toContain("w-full");
    expect(textColumn.className).toContain("space-y-1");
    expect(textColumn.contains(screen.getByText(/Calle 45 #12-30/))).toBe(true);
    expect(
      textColumn.contains(screen.getByTestId("warranty.fiscal_block")),
    ).toBe(true);
  });

  it("keeps the A4 header two-column with the identity left and the title right", () => {
    renderWarranty({ format: "a4" });

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

    // A4 keeps its spread row: identity left, title/number right-aligned.
    expect(identity.className).not.toContain("w-full");
    expect(titleBlock.className).not.toContain("w-full");
    expect(titleBlock.className).toContain("text-right");
    expect(titleBlock).toHaveTextContent("Términos y Condiciones de Garantía");
    expect(titleBlock).toHaveTextContent("OT-000123");
  });

  it("omits the logo, contact line and fiscal block when they are absent", () => {
    renderWarranty({
      companyLogoUrl: undefined,
      companyContact: undefined,
      companyFiscal: undefined,
    });

    expect(screen.queryByTestId("warranty.logo")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("warranty.fiscal_block"),
    ).not.toBeInTheDocument();
    // The razón social still carries the identity.
    expect(
      screen.getByText("HR SOLUCIONES INTEGRALES S.A.S."),
    ).toBeInTheDocument();
  });
});
