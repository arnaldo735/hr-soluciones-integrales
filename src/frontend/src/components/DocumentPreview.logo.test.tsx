import { DocumentPreview } from "@/components/DocumentPreview";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Coverage for the accepted company logo in printed documents.
 *
 * The accepted change persists a company logo and requires it to appear in
 * every printed document. `DocumentPreview` is the shared header every document
 * page renders (cotización, factura, POS, historial POS, ficha de contacto), so
 * this pins the seam: a permanent `companyLogoUrl` renders an image in the
 * document header, and its absence renders no image at all.
 *
 * The image is not fetched here; jsdom does not load it. The test asserts the
 * rendered `src`, which is the URL the document carries.
 */

const LOGO_URL = "https://gateway.example.com/logo-hash.png";

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
      totals={[{ label: "Total", value: "$ 522", emphasis: true }]}
      format="a4"
      ocid="quote.preview"
      {...overrides}
    />,
  );
}

describe("DocumentPreview company logo", () => {
  it("renders the company logo in the document header when a URL is given", () => {
    renderPreview({ companyLogoUrl: LOGO_URL });

    const logo = screen.getByTestId("quote.preview.logo");
    expect(logo).toHaveAttribute("src", LOGO_URL);
    // The logo is decorative: the company name carries the identity for
    // assistive technology.
    expect(logo).toHaveAttribute("alt", "");
  });

  it("renders no logo when the company has none", () => {
    renderPreview({ companyLogoUrl: undefined });

    expect(screen.queryByTestId("quote.preview.logo")).not.toBeInTheDocument();
    // The rest of the header still renders.
    expect(screen.getByText("Taller Central")).toBeInTheDocument();
  });
});
