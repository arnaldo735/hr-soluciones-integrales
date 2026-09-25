import { DocumentPreview } from "@/components/DocumentPreview";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function renderPreview(
  overrides: Partial<React.ComponentProps<typeof DocumentPreview>> = {},
) {
  return render(
    <DocumentPreview
      title="Cotización"
      number="COT-0001"
      companyName="Taller Central"
      companyContact="Calle 10 #20-30"
      meta={[
        { label: "Cliente", value: "Ada Lovelace" },
        { label: "Fecha", value: "01 ene 2026", rail: true },
      ]}
      lines={[
        {
          description: "Cambio de aceite",
          quantity: 1,
          unitPrice: 450,
          amount: 450,
        },
      ]}
      totals={[
        { label: "Subtotal", value: "$ 450" },
        { label: "IVA", value: "$ 72" },
        { label: "Total", value: "$ 522", emphasis: true },
      ]}
      footer="Gracias por su preferencia"
      format="a4"
      ocid="quote.preview"
      {...overrides}
    />,
  );
}

describe("DocumentPreview", () => {
  beforeEach(() => {
    vi.spyOn(window, "print").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the document header, metadata, lines and totals", () => {
    renderPreview();

    expect(screen.getByText("Taller Central")).toBeInTheDocument();
    expect(screen.getByText("Calle 10 #20-30")).toBeInTheDocument();
    expect(screen.getByText("Cotización")).toBeInTheDocument();
    expect(screen.getByText("COT-0001")).toBeInTheDocument();
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Cambio de aceite")).toBeInTheDocument();
    // The line's unit price and amount both render as $ 450.
    expect(screen.getAllByText("$ 450")).toHaveLength(3);
    expect(screen.getByText("$ 72")).toBeInTheDocument();
    expect(screen.getByText("$ 522")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Gracias por su preferencia")).toBeInTheDocument();
  });

  it("labels the A4 sheet format", () => {
    renderPreview({ format: "a4" });
    expect(screen.getByText("Hoja A4")).toBeInTheDocument();
  });

  it("labels the 80 mm receipt format", () => {
    renderPreview({ format: "receipt80" });
    expect(screen.getByText("Tirilla 80 mm")).toBeInTheDocument();
  });

  it("opens the print dialog from the print button", async () => {
    renderPreview();

    await userEvent.click(screen.getByTestId("quote.preview.print_button"));

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("exposes a download control for the document", () => {
    renderPreview();
    expect(
      screen.getByTestId("quote.preview.download_button"),
    ).toBeInTheDocument();
  });
});
