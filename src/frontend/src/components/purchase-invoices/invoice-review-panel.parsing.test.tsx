import {
  InvoiceReviewPanel,
  type ReviewHeader,
  type ReviewLine,
  centsToPesosInput,
  computeLineTotalCents,
  parsePercentInput,
  parsePesosToCents,
  parseQuantityInput,
} from "@/components/purchase-invoices/invoice-review-panel";
import { LineMatchStatus } from "@/lib/types";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the review table's parsing seam.
 *
 * The accepted change makes a selectable-text PDF extract automatically and
 * preload the editable review table. This suite protects the adjacent behavior
 * that must survive it: the peso/quantity conversions the review table uses to
 * turn extracted values into editable inputs and back into integer cents, and
 * the table's edit/add/remove contract. It never asserts the extraction itself,
 * which the request changes.
 *
 * The conversions are the frontend half of the "montos en centavos enteros"
 * rule: an extracted cost must round-trip through the input without drift, and
 * a Colombian-formatted amount must not be silently misread.
 */

function line(overrides: Partial<ReviewLine> = {}): ReviewLine {
  return {
    key: "line-1",
    code: "7701023153317/T",
    description: "JGO AMORTIGUADOR TRASERO AKT-125/SL/NKD",
    quantity: "1",
    unitCost: "89367.19",
    taxRate: "19",
    discountRate: "10",
    total: "95712.26",
    matchStatus: LineMatchStatus.new,
    ...overrides,
  };
}

function header(overrides: Partial<ReviewHeader> = {}): ReviewHeader {
  return {
    supplierId: null,
    supplierName: "RALLYE MOTORS SAS",
    supplierTaxId: "901780198-3",
    invoiceNumber: "FMLR20288",
    invoiceDate: "2026-09-21",
    paymentMethod: "Contado Repuestos (POS)",
    paymentMeans: "Efectivo",
    ...overrides,
  };
}

function renderPanel(lines: ReviewLine[] = [line()]) {
  const onLineChange = vi.fn();
  const onAddLine = vi.fn();
  const onRemoveLine = vi.fn();
  const onHeaderChange = vi.fn();
  render(
    <InvoiceReviewPanel
      header={header()}
      onHeaderChange={onHeaderChange}
      lines={lines}
      onLineChange={onLineChange}
      onAddLine={onAddLine}
      onRemoveLine={onRemoveLine}
      suppliers={[]}
      suppliersLoading={false}
      isSaving={false}
      isConfirming={false}
      validationError={null}
      onSave={vi.fn()}
      onConfirm={vi.fn()}
      confirmed={false}
    />,
  );
  return { onLineChange, onAddLine, onRemoveLine, onHeaderChange };
}

describe("review panel peso parsing", () => {
  it("parses a peso input with two decimals into integer cents", () => {
    expect(parsePesosToCents("89367.19")).toBe(8_936_719n);
    expect(parsePesosToCents("12500")).toBe(1_250_000n);
    expect(parsePesosToCents("12500.5")).toBe(1_250_050n);
    // A comma is accepted as the decimal separator too.
    expect(parsePesosToCents("12500,50")).toBe(1_250_050n);
  });

  it("returns null for an empty or separator-only input", () => {
    expect(parsePesosToCents("")).toBeNull();
    expect(parsePesosToCents(".")).toBeNull();
    expect(parsePesosToCents(",")).toBeNull();
  });

  it("formats integer cents as a peso input with no thousands separators", () => {
    // The input value must be re-parseable by `parsePesosToCents`, so it never
    // carries a thousands separator that would be read as a decimal point.
    expect(centsToPesosInput(8_936_719n)).toBe("89367.19");
    expect(centsToPesosInput(1_250_000n)).toBe("12500.00");
    expect(centsToPesosInput(0n)).toBe("0.00");
  });

  it("round-trips cents through the input format without drift", () => {
    for (const cents of [0n, 1n, 99n, 100n, 8_936_719n, 9_571_226n]) {
      expect(parsePesosToCents(centsToPesosInput(cents))).toBe(cents);
    }
  });

  it("parses a quantity input into a non-negative integer", () => {
    expect(parseQuantityInput("1")).toBe(1n);
    expect(parseQuantityInput("12")).toBe(12n);
    expect(parseQuantityInput("")).toBeNull();
    expect(parseQuantityInput("abc")).toBeNull();
  });

  it("parses an IVA or discount percentage into a whole integer", () => {
    // The extracted IVA and discount are whole percentages; a comma or dot
    // decimal separator is accepted and rounded to the nearest whole percent.
    expect(parsePercentInput("19")).toBe(19n);
    expect(parsePercentInput("10")).toBe(10n);
    expect(parsePercentInput("19.00")).toBe(19n);
    expect(parsePercentInput("10,0000")).toBe(10n);
    expect(parsePercentInput("")).toBeNull();
    expect(parsePercentInput("abc")).toBeNull();
  });

  it("derives the line total from quantity, cost, IVA and discount", () => {
    // 1 × 89367.19 = 8936719 cents; −10 % = 8043047; +19 % = 9571225 (the
    // integer division truncates the half cent). The extracted invoice total
    // (95712.26) is carried explicitly and wins over this derived value.
    expect(computeLineTotalCents(1n, 8_936_719n, 19n, 10n)).toBe(9_571_225n);
    // No IVA and no discount leaves the gross amount untouched.
    expect(computeLineTotalCents(2n, 1_000_000n, 0n, 0n)).toBe(2_000_000n);
  });
});

describe("review panel preloaded editable table", () => {
  it("preloads the extracted header and line into editable inputs", () => {
    renderPanel();

    expect(
      screen.getByTestId("purchase_invoices.supplier_name_input"),
    ).toHaveValue("RALLYE MOTORS SAS");
    expect(
      screen.getByTestId("purchase_invoices.supplier_tax_id_input"),
    ).toHaveValue("901780198-3");
    expect(
      screen.getByTestId("purchase_invoices.invoice_number_input"),
    ).toHaveValue("FMLR20288");
    expect(
      screen.getByTestId("purchase_invoices.invoice_date_input"),
    ).toHaveValue("2026-09-21");
    expect(
      screen.getByTestId("purchase_invoices.payment_method_input"),
    ).toHaveValue("Contado Repuestos (POS)");
    expect(
      screen.getByTestId("purchase_invoices.payment_means_input"),
    ).toHaveValue("Efectivo");

    expect(
      screen.getByTestId("purchase_invoices.line_code_input.1"),
    ).toHaveValue("7701023153317/T");
    expect(
      screen.getByTestId("purchase_invoices.line_description_input.1"),
    ).toHaveValue("JGO AMORTIGUADOR TRASERO AKT-125/SL/NKD");
    expect(
      screen.getByTestId("purchase_invoices.line_quantity_input.1"),
    ).toHaveValue("1");
    expect(
      screen.getByTestId("purchase_invoices.line_cost_input.1"),
    ).toHaveValue("89367.19");
    expect(
      screen.getByTestId("purchase_invoices.line_tax_rate_input.1"),
    ).toHaveValue("19");
    expect(
      screen.getByTestId("purchase_invoices.line_discount_input.1"),
    ).toHaveValue("10");
    expect(
      screen.getByTestId("purchase_invoices.line_total_input.1"),
    ).toHaveValue("95712.26");
  });

  it("reports edits to the NIT, payment fields, IVA, discount and total", async () => {
    const { onHeaderChange, onLineChange } = renderPanel();

    // The panel is controlled: the input value comes from props, so each
    // keystroke reports the value the parent would store. The last call is the
    // one that carries the fully typed value.
    const taxId = screen.getByTestId("purchase_invoices.supplier_tax_id_input");
    await userEvent.type(taxId, "X");
    expect(onHeaderChange).toHaveBeenLastCalledWith({
      supplierTaxId: "901780198-3X",
    });

    const paymentMethod = screen.getByTestId(
      "purchase_invoices.payment_method_input",
    );
    await userEvent.type(paymentMethod, "!");
    expect(onHeaderChange).toHaveBeenLastCalledWith({
      paymentMethod: "Contado Repuestos (POS)!",
    });

    const paymentMeans = screen.getByTestId(
      "purchase_invoices.payment_means_input",
    );
    await userEvent.type(paymentMeans, "!");
    expect(onHeaderChange).toHaveBeenLastCalledWith({
      paymentMeans: "Efectivo!",
    });

    const taxRate = screen.getByTestId(
      "purchase_invoices.line_tax_rate_input.1",
    );
    await userEvent.type(taxRate, "5");
    expect(onLineChange).toHaveBeenLastCalledWith("line-1", { taxRate: "195" });

    const discount = screen.getByTestId(
      "purchase_invoices.line_discount_input.1",
    );
    await userEvent.type(discount, "0");
    expect(onLineChange).toHaveBeenLastCalledWith("line-1", {
      discountRate: "100",
    });

    const total = screen.getByTestId("purchase_invoices.line_total_input.1");
    await userEvent.type(total, "0");
    expect(onLineChange).toHaveBeenLastCalledWith("line-1", {
      total: "95712.260",
    });
  });

  it("reports each edited field through onLineChange", async () => {
    const { onLineChange } = renderPanel();

    // The panel is controlled: the input value comes from props, so each
    // keystroke reports the value the parent would store. The last call is the
    // one that carries the fully typed value.
    const quantity = screen.getByTestId(
      "purchase_invoices.line_quantity_input.1",
    );
    await userEvent.clear(quantity);
    await userEvent.type(quantity, "3");

    expect(onLineChange).toHaveBeenCalledWith("line-1", { quantity: "" });
    expect(onLineChange).toHaveBeenLastCalledWith("line-1", {
      quantity: "13",
    });
  });

  it("adds and removes lines through the panel actions", async () => {
    const { onAddLine, onRemoveLine } = renderPanel();

    await userEvent.click(
      screen.getByTestId("purchase_invoices.add_line_button"),
    );
    expect(onAddLine).toHaveBeenCalledTimes(1);

    await userEvent.click(
      screen.getByTestId("purchase_invoices.line_delete_button.1"),
    );
    expect(onRemoveLine).toHaveBeenCalledWith("line-1");
  });

  it("shows the empty-lines state with an add action when there are no lines", () => {
    renderPanel([]);

    const empty = screen.getByTestId("purchase_invoices.lines_empty_state");
    expect(empty).toHaveTextContent("Añade los ítems manualmente");
    expect(
      screen.getByTestId("purchase_invoices.add_line_button"),
    ).toBeInTheDocument();
  });

  it("computes the running total from the edited quantity and cost", () => {
    // No explicit total and no IVA/discount, so the running total is derived
    // from the quantity and unit cost alone.
    renderPanel([
      line({
        quantity: "2",
        unitCost: "1000.00",
        taxRate: "0",
        discountRate: "0",
        total: "",
      }),
      line({
        key: "line-2",
        quantity: "1",
        unitCost: "500.00",
        taxRate: "0",
        discountRate: "0",
        total: "",
      }),
    ]);

    // 2 × 1000.00 + 1 × 500.00 = 2500 pesos = 250000 cents, rendered as COP.
    const panel = screen.getByTestId("purchase_invoices.review_panel");
    expect(within(panel).getByText("$ 2.500")).toBeInTheDocument();
  });
});
