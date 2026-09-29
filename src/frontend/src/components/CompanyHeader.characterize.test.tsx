import { CompanyHeader } from "@/components/CompanyHeader";
import type { CompanyHeaderData } from "@/lib/company-header";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Characterization: the shared `CompanyHeader` component's structural contract.
 *
 * `CompanyHeader` is the complete company identity block used by the accounting
 * reports (and available to every printable document). The accepted change
 * reworks the header *layout* so each company datum gets its own space without
 * overlapping, in A4 and 80mm, on screen and in the PDF. The structural
 * contract that feeds that layout must not change: the logo, razón social,
 * nombre comercial, NIT con dígito de verificación, régimen, responsabilidad,
 * dirección, ciudad, teléfono, correo y sitio web each render in their own
 * element, and unconfigured fields are omitted cleanly.
 *
 * This file pins only that structure — which data renders and where it lives in
 * the tree — not any pixel position or CSS class, which the accepted change
 * intentionally alters.
 */

const LOGO_URL = "https://gateway.example.com/logo-hash.png";

function headerData(
  overrides: Partial<CompanyHeaderData> = {},
): CompanyHeaderData {
  return {
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: "Taller HR Motos",
    logoUrl: LOGO_URL,
    taxId: "NIT 900.123.456-8",
    fiscalRegime: "Responsable de IVA",
    taxResponsibility: "Gran contribuyente",
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: "contacto@hrsolucionesintegrales.com",
    website: "https://hrsolucionesintegrales.com",
    ...overrides,
  };
}

describe("CompanyHeader document variant (characterization)", () => {
  it("renders the logo, razón social, contact line and fiscal block", () => {
    render(<CompanyHeader header={headerData()} ocid="doc.company" />);

    expect(screen.getByTestId("doc.company.logo")).toHaveAttribute(
      "src",
      LOGO_URL,
    );
    expect(
      screen.getByText("HR SOLUCIONES INTEGRALES S.A.S."),
    ).toBeInTheDocument();
    // Nombre comercial shown when it differs from the razón social.
    expect(screen.getByText("Taller HR Motos")).toBeInTheDocument();

    // Contact line: dirección, ciudad, teléfono, correo y sitio web.
    const contact = screen.getByTestId("doc.company.contact");
    expect(contact).toHaveTextContent("Calle 45 #12-30, Bogotá");
    expect(contact).toHaveTextContent("Bogotá D.C., Cundinamarca");
    expect(contact).toHaveTextContent("+57 300 000 0000");
    expect(contact).toHaveTextContent("contacto@hrsolucionesintegrales.com");
    expect(contact).toHaveTextContent("https://hrsolucionesintegrales.com");

    // Fiscal block: NIT with check digit, régimen and responsabilidad, each in
    // its own paragraph so no two data overlap.
    const fiscal = screen.getByTestId("doc.company.fiscal_block");
    expect(fiscal).toHaveTextContent("NIT 900.123.456-8");
    expect(fiscal).toHaveTextContent("Responsable de IVA");
    expect(fiscal).toHaveTextContent("Gran contribuyente");
    expect(fiscal.querySelectorAll("p")).toHaveLength(3);
  });

  it("omits the logo, contact line and fiscal block when they are absent", () => {
    render(
      <CompanyHeader
        header={headerData({
          logoUrl: undefined,
          address: undefined,
          city: undefined,
          phone: undefined,
          email: undefined,
          website: undefined,
          taxId: undefined,
          fiscalRegime: undefined,
          taxResponsibility: undefined,
        })}
        ocid="doc.company"
      />,
    );

    expect(screen.queryByTestId("doc.company.logo")).not.toBeInTheDocument();
    expect(screen.queryByTestId("doc.company.contact")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("doc.company.fiscal_block"),
    ).not.toBeInTheDocument();
    // The razón social still carries the identity.
    expect(
      screen.getByText("HR SOLUCIONES INTEGRALES S.A.S."),
    ).toBeInTheDocument();
  });

  it("hides the nombre comercial when it equals the razón social", () => {
    render(
      <CompanyHeader
        header={headerData({ tradeName: "HR SOLUCIONES INTEGRALES S.A.S." })}
        ocid="doc.company"
      />,
    );

    expect(screen.getAllByText("HR SOLUCIONES INTEGRALES S.A.S.")).toHaveLength(
      1,
    );
  });

  it("renders nothing when there is no header", () => {
    const { container } = render(
      <CompanyHeader header={null} ocid="doc.company" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("CompanyHeader panel variant (characterization)", () => {
  it("labels each company datum in its own field", () => {
    render(
      <CompanyHeader
        header={headerData()}
        ocid="panel.company"
        variant="panel"
      />,
    );

    expect(screen.getByText("NIT:")).toBeInTheDocument();
    expect(screen.getByText("Régimen:")).toBeInTheDocument();
    expect(screen.getByText("Responsabilidad:")).toBeInTheDocument();
    expect(screen.getByText("Tel:")).toBeInTheDocument();
    expect(screen.getByText("Correo:")).toBeInTheDocument();
    expect(screen.getByText("Web:")).toBeInTheDocument();

    expect(screen.getByText("NIT 900.123.456-8")).toBeInTheDocument();
    expect(screen.getByText("Responsable de IVA")).toBeInTheDocument();
    expect(screen.getByText("Gran contribuyente")).toBeInTheDocument();
    expect(screen.getByText("+57 300 000 0000")).toBeInTheDocument();
    expect(
      screen.getByText("contacto@hrsolucionesintegrales.com"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("https://hrsolucionesintegrales.com"),
    ).toBeInTheDocument();
  });

  it("omits the fields the company has not configured", () => {
    render(
      <CompanyHeader
        header={headerData({
          taxId: undefined,
          fiscalRegime: undefined,
          taxResponsibility: undefined,
          phone: undefined,
          email: undefined,
          website: undefined,
        })}
        ocid="panel.company"
        variant="panel"
      />,
    );

    expect(screen.queryByText("NIT:")).not.toBeInTheDocument();
    expect(screen.queryByText("Régimen:")).not.toBeInTheDocument();
    expect(screen.queryByText("Responsabilidad:")).not.toBeInTheDocument();
    expect(screen.queryByText("Tel:")).not.toBeInTheDocument();
    expect(screen.queryByText("Correo:")).not.toBeInTheDocument();
    expect(screen.queryByText("Web:")).not.toBeInTheDocument();
  });
});
