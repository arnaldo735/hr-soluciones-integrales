import { DocumentPreview } from "@/components/DocumentPreview";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Characterization: the shared printable header's full company block.
 *
 * The accepted change requires every printable document (OT, cotización,
 * factura, compra, recibo POS A4 and tirilla 80 mm) to use the same header with
 * the complete company information. `DocumentPreview` is that shared header, so
 * this file protects the contract the unified header will build on: the logo,
 * the razón social, the contact line and the fiscal block (NIT with check
 * digit, régimen and responsabilidad) all render from the props the component
 * already accepts, and each is omitted cleanly when absent.
 *
 * It deliberately does not assert which page passes which prop — that wiring is
 * what the accepted change alters. It pins only the component seam.
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

describe("DocumentPreview company header (characterization)", () => {
  it("renders the logo, razón social, contact line and fiscal block together", () => {
    renderPreview({
      companyLogoUrl: LOGO_URL,
      companyContact:
        "Calle 45 #12-30, Bogotá · Bogotá D.C. · +57 300 000 0000 · contacto@hr.com · https://hr.com",
      companyFiscal: ["NIT 900.123.456-8", "Responsable de IVA", "No aplica"],
    });

    // Logo, to the left of the company identity.
    expect(screen.getByTestId("doc.preview.logo")).toHaveAttribute(
      "src",
      LOGO_URL,
    );
    // Razón social.
    expect(
      screen.getByText("HR SOLUCIONES INTEGRALES S.A.S."),
    ).toBeInTheDocument();
    // Contact line: dirección, ciudad, teléfono, correo and web.
    expect(screen.getByText(/Calle 45 #12-30, Bogotá/)).toBeInTheDocument();
    expect(screen.getByText(/Bogotá D\.C\./)).toBeInTheDocument();
    expect(screen.getByText(/\+57 300 000 0000/)).toBeInTheDocument();
    expect(screen.getByText(/contacto@hr\.com/)).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/hr\.com/)).toBeInTheDocument();
    // Fiscal block: NIT with check digit, régimen and responsabilidad.
    const fiscal = screen.getByTestId("doc.preview.fiscal_block");
    expect(fiscal).toHaveTextContent("NIT 900.123.456-8");
    expect(fiscal).toHaveTextContent("Responsable de IVA");
    expect(fiscal).toHaveTextContent("No aplica");
  });

  it("renders the fiscal block in the 80 mm receipt format too", () => {
    renderPreview({
      format: "receipt80",
      companyFiscal: ["NIT 900.123.456-8", "No responsable de IVA"],
    });

    const fiscal = screen.getByTestId("doc.preview.fiscal_block");
    expect(fiscal).toHaveTextContent("NIT 900.123.456-8");
    expect(fiscal).toHaveTextContent("No responsable de IVA");
  });

  it("omits the logo, contact line and fiscal block when they are absent", () => {
    renderPreview({
      companyLogoUrl: undefined,
      companyContact: undefined,
      companyFiscal: undefined,
    });

    expect(screen.queryByTestId("doc.preview.logo")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("doc.preview.fiscal_block"),
    ).not.toBeInTheDocument();
    // The razón social still carries the identity.
    expect(
      screen.getByText("HR SOLUCIONES INTEGRALES S.A.S."),
    ).toBeInTheDocument();
  });

  it("drops blank fiscal lines instead of rendering empty rows", () => {
    renderPreview({
      companyFiscal: ["NIT 900.123.456-8", "   ", ""],
    });

    const fiscal = screen.getByTestId("doc.preview.fiscal_block");
    expect(fiscal).toHaveTextContent("NIT 900.123.456-8");
    // Only the non-blank line is rendered.
    expect(fiscal.querySelectorAll("p")).toHaveLength(1);
  });

  it("keeps the document title and number beside the company identity", () => {
    renderPreview();

    expect(screen.getByText("Factura")).toBeInTheDocument();
    expect(screen.getByText("FAC-000128")).toBeInTheDocument();
  });
});
