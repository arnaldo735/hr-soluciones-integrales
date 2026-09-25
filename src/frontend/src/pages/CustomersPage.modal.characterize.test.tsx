import type { CustomerListItem, CustomerPage } from "@/lib/types";
import { CustomersPage } from "@/pages/CustomersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the customer/motorcycle modal on `/clientes`.
 *
 * The accepted change makes opening the customer modal fast and non-blocking on
 * every device. These tests protect the *observable contract* of that modal,
 * which must survive the performance rework: opening it shows the right
 * customer's data, the page stays interactive while it is open, and the
 * motorcycle count column still reflects each customer's own fleet.
 *
 * They deliberately do not assert how many backend calls the page makes, nor
 * how long the modal takes to open — that is the behavior the accepted change
 * intentionally alters. They also never assert the reported freeze itself.
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

describe("CustomersPage customer modal (characterization)", () => {
  beforeEach(() => {
    listCustomersPageDirMock.mockReset();
    navigateMock.mockReset();
  });

  it("opens the edit modal seeded with the clicked customer's own data", async () => {
    // Two customers with distinct contact data: a modal that seeded itself from
    // the wrong row, or from a shared draft, would fail here.
    listCustomersPageDirMock.mockResolvedValue(
      page([
        customer({ id: 1n, name: "Ada Lovelace", phone: "+52 555 0100" }),
        customer({
          id: 2n,
          name: "Grace Hopper",
          phone: "+52 555 0200",
          email: "grace@example.com",
          document: "GRHP1906",
          address: "Calle 9 #9-9",
        }),
      ]),
    );

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await userEvent.click(screen.getByTestId("customers.edit_button.2"));

    const dialog = await screen.findByTestId("customer.dialog");
    expect(within(dialog).getByText("Editar cliente")).toBeInTheDocument();
    expect(screen.getByTestId("customer.name_input")).toHaveValue(
      "Grace Hopper",
    );
    expect(screen.getByTestId("customer.phone_input")).toHaveValue(
      "+52 555 0200",
    );
    expect(screen.getByTestId("customer.email_input")).toHaveValue(
      "grace@example.com",
    );
    expect(screen.getByTestId("customer.document_input")).toHaveValue(
      "GRHP1906",
    );
    expect(screen.getByTestId("customer.address_input")).toHaveValue(
      "Calle 9 #9-9",
    );
  });

  it("opens a blank create modal from the new-customer button", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await userEvent.click(screen.getByTestId("customers.open_modal_button"));

    const dialog = await screen.findByTestId("customer.dialog");
    expect(within(dialog).getByText("Nuevo cliente")).toBeInTheDocument();
    expect(screen.getByTestId("customer.name_input")).toHaveValue("");
    expect(screen.getByTestId("customer.phone_input")).toHaveValue("");
  });

  it("keeps the modal interactive while it is open", async () => {
    // The reported freeze is the behavior the accepted change fixes; this test
    // only pins the adjacent contract that the open modal still responds to
    // user input and keeps the draft the user typed.
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await userEvent.click(screen.getByTestId("customers.edit_button.1"));
    await screen.findByTestId("customer.dialog");

    // The modal's own fields accept edits and reflect them immediately.
    const name = screen.getByTestId("customer.name_input");
    await userEvent.clear(name);
    await userEvent.type(name, "Ada Byron");
    expect(name).toHaveValue("Ada Byron");

    // The modal stays open with the edited draft.
    expect(screen.getByTestId("customer.dialog")).toBeInTheDocument();
    expect(screen.getByTestId("customer.phone_input")).toHaveValue(
      "+52 555 0100",
    );
  });

  it("closes the modal without saving when the user cancels", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await userEvent.click(screen.getByTestId("customers.edit_button.1"));
    await screen.findByTestId("customer.dialog");

    await userEvent.click(screen.getByTestId("customer.cancel_button"));

    await waitFor(() =>
      expect(screen.queryByTestId("customer.dialog")).not.toBeInTheDocument(),
    );
  });

  it("still shows each row its own motorcycle count", async () => {
    // The count column must keep resolving per customer after the fetch rework.
    // The accepted change reads every count from the same page response, so the
    // mock answers that call with each item's own count.
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
    expect(within(adaRow).getByText("2")).toBeInTheDocument();
    expect(within(graceRow).getByText("1")).toBeInTheDocument();
  });
});
