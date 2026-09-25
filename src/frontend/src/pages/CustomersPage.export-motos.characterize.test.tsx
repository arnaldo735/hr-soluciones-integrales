import type {
  Customer,
  CustomerExportRow,
  CustomerListItem,
  CustomerPage,
  Motorcycle,
} from "@/lib/types";
import { CustomersPage } from "@/pages/CustomersPage";
import { readXlsxBlob, renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the customer directory's Excel export of
 * motorcycles.
 *
 * The accepted change keeps the export's motorcycle summary but reworks how the
 * fleet is read: a single aggregated `exportCustomersAggregated` call returns
 * every customer with its motorcycles, instead of a per-customer fan-out. These
 * tests protect the observable workbook contract: every customer is exported,
 * each customer's complete fleet is joined into the `motos` cell, and a customer
 * with no motorcycles exports an empty cell rather than a placeholder.
 *
 * They deliberately do not assert how many backend calls the export makes — that
 * is the behavior the accepted change intentionally alters.
 */

const listCustomersPageDirMock = vi.fn();
const exportCustomersAggregatedMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCustomersPageDir: listCustomersPageDirMock,
      exportCustomersAggregated: exportCustomersAggregatedMock,
    },
    isFetching: false,
  }),
}));

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => (
    <a href={to} data-params={JSON.stringify(params)} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+52 555 0100",
    email: "ada@example.com",
    document: "LOAA1815",
    address: "Calle 1 #2-3",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function listItem(overrides: Partial<CustomerListItem> = {}): CustomerListItem {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+52 555 0100",
    email: "ada@example.com",
    document: "LOAA1815",
    motorcycleCount: 0n,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function page(items: CustomerListItem[], total = items.length): CustomerPage {
  return { items, total: BigInt(total), offset: 0n, limit: 50n };
}

function motorcycle(overrides: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 7n,
    customerId: 1n,
    brand: "Yamaha",
    model: "FZ 2.0",
    plate: "ABC12D",
    year: 2021n,
    mileage: 12000n,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function exportRow(
  customerRecord: Customer,
  motorcycles: Motorcycle[],
): CustomerExportRow {
  return { customer: customerRecord, motorcycles };
}

/** Captures the blob handed to `URL.createObjectURL` and the anchor download. */
function captureDownload() {
  const createObjectURL = vi.fn((_blob: Blob) => "blob:xlsx");
  const revokeObjectURL = vi.fn();
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  return {
    createObjectURL,
    restore: () => {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    },
  };
}

describe("CustomersPage Excel export motorcycle summary (characterization)", () => {
  beforeEach(() => {
    listCustomersPageDirMock.mockReset();
    exportCustomersAggregatedMock.mockReset();
    listCustomersPageDirMock.mockResolvedValue(page([listItem()]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("joins every motorcycle of a customer into the motos cell", async () => {
    exportCustomersAggregatedMock.mockResolvedValue([
      exportRow(customer(), [
        motorcycle({
          id: 7n,
          brand: "Yamaha",
          model: "FZ 2.0",
          plate: "ABC12D",
        }),
        motorcycle({
          id: 8n,
          brand: "Honda",
          model: "CB 190R",
          plate: "XYZ789",
        }),
      ]),
    ]);

    const capture = captureDownload();
    try {
      renderWithProviders(<CustomersPage />);
      await screen.findByText("Ada Lovelace");

      await userEvent.click(screen.getByTestId("customers.export_button"));
      await waitFor(() => expect(capture.createObjectURL).toHaveBeenCalled());

      const sheet = await readXlsxBlob(
        capture.createObjectURL.mock.calls[0][0],
      );
      const motos = sheet.headers.indexOf("motos");
      // Both motorcycles are present, in the order the backend returned them.
      expect(sheet.rows[0][motos]).toBe(
        "Yamaha FZ 2.0 (ABC12D); Honda CB 190R (XYZ789)",
      );
    } finally {
      capture.restore();
    }
  });

  it("exports an empty motos cell for a customer with no motorcycles", async () => {
    exportCustomersAggregatedMock.mockResolvedValue([
      exportRow(customer({ id: 1n, name: "Ada Lovelace" }), [motorcycle()]),
      exportRow(
        customer({ id: 2n, name: "Grace Hopper", phone: "+52 555 0200" }),
        [],
      ),
    ]);

    const capture = captureDownload();
    try {
      renderWithProviders(<CustomersPage />);
      await screen.findByText("Ada Lovelace");

      await userEvent.click(screen.getByTestId("customers.export_button"));
      await waitFor(() => expect(capture.createObjectURL).toHaveBeenCalled());

      const sheet = await readXlsxBlob(
        capture.createObjectURL.mock.calls[0][0],
      );
      const motos = sheet.headers.indexOf("motos");
      // The customer with a fleet keeps its summary; the one without exports
      // an empty cell, not a placeholder or another customer's fleet.
      expect(sheet.rows[0][motos]).toBe("Yamaha FZ 2.0 (ABC12D)");
      expect(sheet.rows[1][motos] ?? "").toBe("");
    } finally {
      capture.restore();
    }
  });
});
