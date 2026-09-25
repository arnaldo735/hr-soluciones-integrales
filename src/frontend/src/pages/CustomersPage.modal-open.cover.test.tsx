import type { CustomerListItem, CustomerPage } from "@/lib/types";
import { CustomersPage } from "@/pages/CustomersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change: opening the customer/motorcycle modal must be
 * immediate and must not touch the backend until the user saves.
 *
 * The accepted change makes the modal open without a perceptible pause or a
 * frozen screen. The observable contract that proves it is that opening the
 * modal issues no backend write (and no document generation), that the modal
 * still shows the right data, and that saving still persists and refreshes the
 * directory. These tests never assert how long the open takes, nor how many
 * reads the page makes — that is the behavior the accepted change alters.
 */

const listCustomersPageDirMock = vi.fn();
const createCustomerMock = vi.fn();
const updateCustomerMock = vi.fn();
const createMotorcycleMock = vi.fn();
const updateMotorcycleMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCustomersPageDir: listCustomersPageDirMock,
      createCustomer: createCustomerMock,
      updateCustomer: updateCustomerMock,
      createMotorcycle: createMotorcycleMock,
      updateMotorcycle: updateMotorcycleMock,
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

describe("CustomersPage modal open (cover)", () => {
  beforeEach(() => {
    listCustomersPageDirMock.mockReset();
    createCustomerMock.mockReset();
    updateCustomerMock.mockReset();
    createMotorcycleMock.mockReset();
    updateMotorcycleMock.mockReset();
    navigateMock.mockReset();
  });

  it("opens the new-customer modal without writing to the backend", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await userEvent.click(screen.getByTestId("customers.open_modal_button"));

    const dialog = await screen.findByTestId("customer.dialog");
    expect(within(dialog).getByText("Nuevo cliente")).toBeInTheDocument();
    expect(screen.getByTestId("customer.name_input")).toHaveValue("");

    // Opening the modal is a pure UI action: no create/update is issued until
    // the user submits the form.
    expect(createCustomerMock).not.toHaveBeenCalled();
    expect(updateCustomerMock).not.toHaveBeenCalled();
  });

  it("opens the edit-customer modal seeded without writing to the backend", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await userEvent.click(screen.getByTestId("customers.edit_button.1"));

    const dialog = await screen.findByTestId("customer.dialog");
    expect(within(dialog).getByText("Editar cliente")).toBeInTheDocument();
    expect(screen.getByTestId("customer.name_input")).toHaveValue(
      "Ada Lovelace",
    );
    expect(screen.getByTestId("customer.phone_input")).toHaveValue(
      "+52 555 0100",
    );

    expect(createCustomerMock).not.toHaveBeenCalled();
    expect(updateCustomerMock).not.toHaveBeenCalled();
  });

  it("saves a new customer on submit and refreshes the directory", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));
    createCustomerMock.mockResolvedValue(
      customer({ id: 2n, name: "Grace Hopper", phone: "+52 555 0200" }),
    );

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await userEvent.click(screen.getByTestId("customers.open_modal_button"));
    await screen.findByTestId("customer.dialog");

    await userEvent.type(
      screen.getByTestId("customer.name_input"),
      "Grace Hopper",
    );
    await userEvent.type(
      screen.getByTestId("customer.phone_input"),
      "+52 555 0200",
    );

    // The write happens only on submit, with the typed values.
    expect(createCustomerMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("customer.submit_button"));

    await waitFor(() =>
      expect(createCustomerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Grace Hopper",
          phone: "+52 555 0200",
        }),
      ),
    );

    // The directory is invalidated and read again after the save.
    await waitFor(() =>
      expect(listCustomersPageDirMock.mock.calls.length).toBeGreaterThan(1),
    );
  });

  it("saves an edited customer on submit with the row's id", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));
    updateCustomerMock.mockResolvedValue(customer({ name: "Ada Byron" }));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await userEvent.click(screen.getByTestId("customers.edit_button.1"));
    await screen.findByTestId("customer.dialog");

    const name = screen.getByTestId("customer.name_input");
    await userEvent.clear(name);
    await userEvent.type(name, "Ada Byron");

    expect(updateCustomerMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("customer.submit_button"));

    await waitFor(() =>
      expect(updateCustomerMock).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({ name: "Ada Byron" }),
      ),
    );
  });

  it("does not render a WhatsApp action on any row", async () => {
    // The accepted change removes the "Enviar por WhatsApp" action from each row
    // of the directory, so no row exposes a WhatsApp button (and therefore no
    // row-level WhatsApp dialog or ficha attachment).
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
    expect(screen.queryByTestId("whatsapp.dialog")).toBeNull();
    // The row's other actions remain available.
    expect(screen.getByTestId("customers.edit_button.1")).toBeInTheDocument();
    expect(screen.getByTestId("customers.open_button.1")).toBeInTheDocument();
  });
});
