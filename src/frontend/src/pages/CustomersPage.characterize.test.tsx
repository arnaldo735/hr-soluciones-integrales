import type { CustomerListItem, CustomerPage } from "@/lib/types";
import { CustomersPage } from "@/pages/CustomersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the customer directory's motorcycle data.
 *
 * The accepted change replaces the per-customer `listMotorcycles` fan-out that
 * froze `/clientes` with a single paginated read whose items already carry each
 * customer's motorcycle count. These tests protect the *consumers* of that data,
 * which must keep working after the fetch mechanism changes: each row shows its
 * own customer's motorcycle count.
 *
 * A later accepted change removes the "Enviar por WhatsApp" action from each row
 * of this listing, so the row no longer carries a WhatsApp button or its ficha
 * attachment. That removal is pinned below; the ficha attachment itself is still
 * covered on the customer detail page.
 *
 * They deliberately do not assert how many backend calls the page makes, nor the
 * shape of the query key — that is the behavior the accepted change
 * intentionally alters.
 */

const listCustomersPageDirMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCustomersPageDir: listCustomersPageDirMock,
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

function customer(overrides: Partial<CustomerListItem> = {}): CustomerListItem {
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

describe("CustomersPage motorcycle data (characterization)", () => {
  beforeEach(() => {
    listCustomersPageDirMock.mockReset();
  });

  it("shows each row its own customer's motorcycle count", async () => {
    // Two customers with different fleets: a page that keyed the counts by
    // position, or collapsed them into one total, would fail here. The accepted
    // change reads both counts from the same page response, so the mock answers
    // that call with each item's own count.
    listCustomersPageDirMock.mockResolvedValue(
      page([
        customer({ id: 1n, name: "Ada Lovelace", motorcycleCount: 2n }),
        customer({
          id: 2n,
          name: "Grace Hopper",
          phone: "+52 555 0200",
          motorcycleCount: 1n,
        }),
      ]),
    );

    renderWithProviders(<CustomersPage />);

    await screen.findByText("Ada Lovelace");
    const adaRow = screen.getByTestId("customers.row.1");
    const graceRow = screen.getByTestId("customers.row.2");

    // Each row resolves its own count, not the other customer's.
    expect(within(adaRow).getByText("2")).toBeInTheDocument();
    expect(within(graceRow).getByText("1")).toBeInTheDocument();
  });

  it("does not render a WhatsApp action on any row", async () => {
    // The accepted change removes the "Enviar por WhatsApp" action from each row
    // of the directory. The row keeps its other actions (edit, open), but no
    // WhatsApp button is rendered for any customer.
    listCustomersPageDirMock.mockResolvedValue(
      page([
        customer({ id: 1n, name: "Ada Lovelace" }),
        customer({ id: 2n, name: "Grace Hopper", phone: "+52 555 0200" }),
      ]),
    );

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    expect(screen.queryByTestId("customers.whatsapp_button.1")).toBeNull();
    expect(screen.queryByTestId("customers.whatsapp_button.2")).toBeNull();
    // The adjacent row actions are untouched by the removal.
    expect(screen.getByTestId("customers.edit_button.1")).toBeInTheDocument();
    expect(screen.getByTestId("customers.open_button.1")).toBeInTheDocument();
  });
});
