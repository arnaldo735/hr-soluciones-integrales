import { WarrantyDocument } from "@/components/WarrantyDocument";
import type { WarrantyDocumentData } from "@/lib/types";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Cover for the admin-editable text of the work-order warranty document.
 *
 * The accepted change makes "Términos y Condiciones de Garantía" a single
 * global text the administrator edits. When a saved text is supplied, the
 * document must render that one block and drop the eight per-clause elements
 * and the IMPORTANTE notice; when it is absent or blank, the document must keep
 * rendering the eight numbered clauses and the IMPORTANTE notice exactly as
 * before. The exact clause wording is not frozen here — that is what the change
 * makes editable.
 *
 * This is component coverage only: it renders the document in jsdom and says
 * nothing about the bytes the PDF builder produces or the real canister read.
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

describe("WarrantyDocument editable terms (cover)", () => {
  it("renders the saved text as a single block instead of the clauses", () => {
    render(
      <WarrantyDocument
        data={warrantyData()}
        companyName="HR MOTOCICLETAS"
        format="a4"
        termsText={
          "1. GARANTÍA A MEDIDA\nTexto configurado por el administrador."
        }
        ocid="warranty"
      />,
    );

    const document = screen.getByTestId("warranty");
    const terms = within(document).getByTestId("warranty.terms_text");
    expect(terms).toHaveTextContent("Texto configurado por el administrador.");
    // The per-clause elements and the IMPORTANTE notice are replaced.
    expect(within(document).queryByTestId("warranty.clause.1")).toBeNull();
    expect(within(document).queryByTestId("warranty.clause.8")).toBeNull();
    expect(within(document).queryByTestId("warranty.important")).toBeNull();
  });

  it("trims the saved text before rendering it", () => {
    render(
      <WarrantyDocument
        data={warrantyData()}
        companyName="HR MOTOCICLETAS"
        format="a4"
        termsText={"   Texto con espacios alrededor   "}
        ocid="warranty"
      />,
    );

    const terms = screen.getByTestId("warranty.terms_text");
    expect(terms).toHaveTextContent("Texto con espacios alrededor");
    expect(terms.textContent).toBe("Texto con espacios alrededor");
  });

  it("falls back to the eight clauses and IMPORTANTE when the text is blank", () => {
    render(
      <WarrantyDocument
        data={warrantyData()}
        companyName="HR MOTOCICLETAS"
        format="a4"
        termsText={"   "}
        ocid="warranty"
      />,
    );

    const document = screen.getByTestId("warranty");
    expect(within(document).queryByTestId("warranty.terms_text")).toBeNull();
    for (let number = 1; number <= 8; number += 1) {
      expect(
        within(document).getByTestId(`warranty.clause.${number}`),
      ).toBeInTheDocument();
    }
    expect(
      within(document).getByTestId("warranty.important"),
    ).toHaveTextContent("IMPORTANTE");
  });

  it("falls back to the eight clauses and IMPORTANTE when no text is supplied", () => {
    render(
      <WarrantyDocument
        data={warrantyData()}
        companyName="HR MOTOCICLETAS"
        format="a4"
        ocid="warranty"
      />,
    );

    const document = screen.getByTestId("warranty");
    expect(within(document).queryByTestId("warranty.terms_text")).toBeNull();
    expect(
      within(document).getByTestId("warranty.clause.1"),
    ).toBeInTheDocument();
    expect(
      within(document).getByTestId("warranty.important"),
    ).toBeInTheDocument();
  });

  it("keeps the identification block and title alongside the saved text", () => {
    render(
      <WarrantyDocument
        data={warrantyData()}
        companyName="HR MOTOCICLETAS"
        format="a4"
        termsText="Texto configurado por el administrador."
        ocid="warranty"
      />,
    );

    const document = screen.getByTestId("warranty");
    expect(
      within(document).getByText("Términos y Condiciones de Garantía"),
    ).toBeInTheDocument();
    const identity = within(document).getByTestId("warranty.identity");
    expect(within(identity).getByText("Ada Lovelace")).toBeInTheDocument();
    // The order number sits in the header, next to the document title.
    expect(within(document).getByText("OT-000123")).toBeInTheDocument();
  });
});
