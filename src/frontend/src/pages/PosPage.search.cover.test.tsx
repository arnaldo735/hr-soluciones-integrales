import { useParts } from "@/hooks/use-orders";
import { useCreatePosSale } from "@/hooks/use-pos";
import type {
  BusinessSettings,
  CompanyProfile,
  PartPage,
  PartView,
  PosSale,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  PaymentCondition,
  PaymentMethod,
  TaxResponsibility,
} from "@/lib/types";
import { PosPage } from "@/pages/PosPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the POS product-search change.
 *
 * The accepted change makes the POS search return the products whose name, SKU
 * or barcode match the typed term, ignoring case and accents, and show a clear
 * no-results message when nothing matches. The accent/case folding itself is
 * backend-owned (`src/backend/lib/search.mo`) and is exercised by the PocketIC
 * lane; this file covers the frontend seam the change touched:
 *
 *   - the term is forwarded to `listParts` verbatim (case and accents intact)
 *     and with the broad picker page size, so the backend can normalize and
 *     nothing is truncated;
 *   - while the debounce has not caught up, the picker shows its loading state
 *     instead of stale results or a premature "sin resultados" message;
 *   - a term with no matches shows the no-results message with the typed term;
 *   - registering a sale invalidates the picker cache, so searching again
 *     refetches the updated catalog instead of serving stale stock.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * frontend seam, not a real backend search.
 */

const listPartsMock = vi.fn();
const listCustomersMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const createPosSaleMock = vi.fn();
const findPartByCodeMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listParts: listPartsMock,
      listCustomers: listCustomersMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      createPosSale: createPosSaleMock,
      findPartByCode: findPartByCodeMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 1n,
    sku: "REP-0001",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 5n,
    totalStock: 12n,
    barcode: "",
    lowStock: false,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function business(overrides: Partial<BusinessSettings> = {}): BusinessSettings {
  return {
    name: "HR SOLUCIONES INTEGRALES",
    taxId: "900.123.456-7",
    address: "Calle 45 #12-30, Bogotá",
    phone: "+57 300 000 0000",
    taxRate: 16n,
    ...overrides,
  };
}

function companyProfile(
  overrides: Partial<CompanyProfile> = {},
): CompanyProfile {
  return {
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: "Taller HR Motos",
    documentType: DocumentType.nit,
    taxId: "900123456",
    checkDigit: 8n,
    fiscalRegime: FiscalRegime.responsableIva,
    taxResponsibility: TaxResponsibility.noAplica,
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: "contacto@hrsolucionesintegrales.com",
    website: "https://hrsolucionesintegrales.com",
    logoUrl: undefined,
    taxRate: 16n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function sale(overrides: Partial<PosSale> = {}): PosSale {
  return {
    id: 1n,
    saleNumber: "POS-0001",
    lines: [
      {
        partId: 1n,
        description: "Balata de freno",
        quantity: 1n,
        unitPrice: 25000n,
        amount: 25000n,
        discount: 0n,
      },
    ],
    subtotal: 25000n,
    discount: 0n,
    taxRate: 16n,
    tax: 4000n,
    total: 29000n,
    amountReceived: 30000n,
    change: 1000n,
    paymentMethod: PaymentMethod.cash,
    paymentCondition: PaymentCondition.cash,
    soldAt: 1_700_000_000_000_000_000n,
    soldBy: undefined as never,
    invoiceId: 1n,
    ...overrides,
  };
}

/** A `PartPage` carrying the given items, matching the picker's broad page. */
function page(items: PartView[]): PartPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 1000n };
}

/** A promise whose resolution the test controls, for the pending-state branch. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("PosPage product search (cover)", () => {
  beforeEach(() => {
    listPartsMock.mockReset();
    listCustomersMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    createPosSaleMock.mockReset();
    findPartByCodeMock.mockReset();
    listPartsMock.mockResolvedValue(page([part()]));
    listCustomersMock.mockResolvedValue([]);
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  // --- Accepted behavior: the term reaches the backend unmodified -----------
  //
  // The backend owns case/accent folding, so the frontend must forward the term
  // exactly as typed. A frontend that lowercased or stripped accents would hide
  // a backend regression and could not match a barcode or SKU that carries
  // meaningful case.

  it("forwards the typed term verbatim so the backend can fold case and accents", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "Ácido");

    await waitFor(() => expect(listPartsMock).toHaveBeenCalled(), {
      timeout: 2000,
    });
    const call = listPartsMock.mock.calls.at(-1);
    // The term is passed through unchanged, accents and capitals included.
    expect(call?.[1]).toMatchObject({ search: "Ácido" });
  });

  it("requests the broad picker page so matching results are not truncated", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "balata");

    await waitFor(() => expect(listPartsMock).toHaveBeenCalled(), {
      timeout: 2000,
    });
    const call = listPartsMock.mock.calls.at(-1);
    // The picker asks for the whole catalog page, not a small fixed cap, so a
    // term with many matches returns all of them.
    expect(call?.[4]).toBe(1000n);
  });

  // --- Accepted behavior: a code typed in the search box --------------------
  //
  // The search box matches by name, SKU or barcode, so a code typed there must
  // reach the backend verbatim and the product it resolves to must render. The
  // backend owns the code match; the frontend must not mangle a code that
  // carries meaningful case or digits.

  it("forwards a code typed in the search box verbatim and renders its product", async () => {
    listPartsMock.mockResolvedValue(
      page([
        part({
          id: 7n,
          sku: "REP-0007",
          name: "Cadena de transmisión",
          barcode: "7701234567890",
        }),
      ]),
    );
    renderWithProviders(<PosPage />);

    await userEvent.type(
      screen.getByTestId("pos.search_input"),
      "7701234567890",
    );

    await waitFor(() => expect(listPartsMock).toHaveBeenCalled(), {
      timeout: 2000,
    });
    const call = listPartsMock.mock.calls.at(-1);
    // The code is passed through unchanged, digits and case included.
    expect(call?.[1]).toMatchObject({ search: "7701234567890" });

    const list = await screen.findByTestId("pos.product_list");
    expect(within(list).getByText("Cadena de transmisión")).toBeInTheDocument();
  });

  // --- Accepted behavior: the pending branch --------------------------------
  //
  // While the user is still typing, the debounced term has not reached the
  // query yet. The picker must show its loading state rather than the previous
  // term's results or a premature "sin resultados" message.

  it("shows the loading state while the debounced term is still catching up", async () => {
    const pending = deferred<PartPage>();
    listPartsMock.mockReturnValue(pending.promise);
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "balata");

    // The query is in flight, so the loading state is shown and no empty-state
    // message is rendered before the backend answers.
    expect(await screen.findByTestId("pos.loading_state")).toBeInTheDocument();
    expect(screen.queryByTestId("pos.empty_state")).not.toBeInTheDocument();

    pending.resolve(page([part()]));
    expect(await screen.findByTestId("pos.product_list")).toBeInTheDocument();
  });

  it("does not show a stale result list for the previous term while the new one loads", async () => {
    renderWithProviders(<PosPage />);

    // First term resolves and renders its product.
    await userEvent.type(screen.getByTestId("pos.search_input"), "balata");
    await screen.findByTestId("pos.product_list");

    // The next term's query is held open; the picker must not keep showing the
    // previous term's product as if it matched the new term.
    const pending = deferred<PartPage>();
    listPartsMock.mockReturnValue(pending.promise);
    await userEvent.type(screen.getByTestId("pos.search_input"), "zzz");

    expect(await screen.findByTestId("pos.loading_state")).toBeInTheDocument();
    expect(screen.queryByTestId("pos.product_list")).not.toBeInTheDocument();

    pending.resolve(page([]));
    expect(await screen.findByTestId("pos.empty_state")).toBeInTheDocument();
  });

  // --- Accepted behavior: the no-results message ----------------------------

  it("shows the no-results message with the typed term when nothing matches", async () => {
    listPartsMock.mockResolvedValue(page([]));
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "zzz");

    const empty = await screen.findByTestId("pos.empty_state");
    expect(empty).toHaveTextContent("Sin resultados");
    expect(empty).toHaveTextContent("zzz");
    expect(screen.queryByTestId("pos.product_list")).not.toBeInTheDocument();
  });

  // --- Accepted behavior: a sale refreshes the picker -----------------------
  //
  // Registering a sale invalidates the `["parts"]` query family, so the picker
  // refetches the catalog and reflects the updated stock instead of serving the
  // pre-sale cache. This is asserted at the hook seam (`useParts` +
  // `useCreatePosSale`) because the POS success view unmounts the picker, which
  // makes the refetch timing in the full-page journey non-deterministic.

  it("refetches the picker catalog after a sale so the search reflects updated stock", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<SaleRefreshHarness />);

    // The picker has loaded the pre-sale page.
    await waitFor(() =>
      expect(screen.getByTestId("harness.stock")).toHaveTextContent("12"),
    );

    // The backend now reports the post-sale stock for the same term.
    listPartsMock.mockResolvedValue(page([part({ totalStock: 11n })]));

    // Register a sale through the same hook the POS uses; its invalidation of
    // the `["parts"]` family must make the picker query the backend again.
    await userEvent.click(screen.getByTestId("harness.charge"));

    await waitFor(() =>
      expect(listPartsMock.mock.calls.length).toBeGreaterThan(1),
    );
    await waitFor(() =>
      expect(screen.getByTestId("harness.stock")).toHaveTextContent("11"),
    );
  });
});

/**
 * Minimal harness that mounts the picker query and the sale mutation together,
 * mirroring how `PosPage` composes `useParts` and `useCreatePosSale`. It lets
 * the test observe the invalidation contract without the POS success view
 * unmounting the picker mid-flight.
 */
function SaleRefreshHarness() {
  const partsQuery = useParts("balata");
  const createSale = useCreatePosSale();

  return (
    <div>
      <span data-ocid="harness.stock">
        {partsQuery.data?.items[0]?.totalStock.toString() ?? "none"}
      </span>
      <button
        type="button"
        data-ocid="harness.charge"
        onClick={() =>
          createSale.mutate({
            lines: [{ partId: 1n, quantity: 1n, discount: 0n }],
            paymentMethod: PaymentMethod.cash,
            paymentCondition: PaymentCondition.cash,
            amountReceived: 30000n,
          })
        }
      >
        Cobrar
      </button>
    </div>
  );
}
