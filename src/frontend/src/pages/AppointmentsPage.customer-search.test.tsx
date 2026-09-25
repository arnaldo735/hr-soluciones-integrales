import type { Customer, Motorcycle, Technician } from "@/lib/types";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the accepted type-to-search customer picker in the appointment
 * form dialog.
 *
 * The accepted change replaces the dialog's fixed customer dropdown with a
 * search box that filters the directory live as the user types. These tests pin
 * the observable behavior the change introduces: the pre-typing prompt, the
 * no-match empty state carrying the typed term, selecting a match showing the
 * selected-customer card and loading that customer's motorcycles, and clearing
 * the selection resetting the motorcycle field. The dialog's surrounding
 * behavior is already covered by `AppointmentsPage.dialog.characterize.test.tsx`.
 *
 * The backend actor is mocked; the real directory is not exercised here.
 */

const listAppointmentsMock = vi.fn();
const listCustomersMock = vi.fn();
const listTechniciansMock = vi.fn();
const listMotorcyclesMock = vi.fn();
const createAppointmentMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listAppointments: listAppointmentsMock,
      listCustomers: listCustomersMock,
      listTechnicians: listTechniciansMock,
      listMotorcycles: listMotorcyclesMock,
      createAppointment: createAppointmentMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TS = 1_700_000_000_000_000_000n;

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 7n,
    name: "Ana Pérez",
    phone: "+57 300 111 2222",
    email: "ana@example.com",
    document: "LOAA1815",
    createdAt: TS,
    ...overrides,
  };
}

function motorcycle(overrides: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 3n,
    customerId: 7n,
    plate: "ABC12D",
    brand: "Yamaha",
    model: "FZ25",
    year: 2021n,
    mileage: 12000n,
    createdAt: TS,
    ...overrides,
  };
}

function technician(overrides: Partial<Technician> = {}): Technician {
  return {
    id: 5n,
    code: "TEC-0001",
    name: "Carlos Ruiz",
    specialty: "Mecánica general",
    hourlyRate: 30000n,
    commissionRate: 10n,
    phone: "+57 300 000 0000",
    email: "carlos@example.com",
    active: true,
    createdAt: TS,
    ...overrides,
  };
}

async function openDialog() {
  renderWithProviders(<AppointmentsPage />);
  await userEvent.click(
    await screen.findByTestId("appointments.open_modal_button"),
  );
  return await screen.findByTestId("appointments.dialog");
}

describe("AppointmentsPage customer search", () => {
  beforeEach(() => {
    listAppointmentsMock.mockReset();
    listCustomersMock.mockReset();
    listTechniciansMock.mockReset();
    listMotorcyclesMock.mockReset();
    createAppointmentMock.mockReset();
    listAppointmentsMock.mockResolvedValue([]);
    listCustomersMock.mockResolvedValue([customer()]);
    listTechniciansMock.mockResolvedValue([technician()]);
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
  });

  it("prompts for a term before the user types instead of listing the whole directory", async () => {
    const dialog = await openDialog();

    expect(
      within(dialog).getByTestId("appointments.customer_search.prompt_state"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByTestId("appointments.customer_search.list"),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state carrying the typed term when nothing matches", async () => {
    listCustomersMock.mockResolvedValue([]);
    const dialog = await openDialog();

    await userEvent.type(
      within(dialog).getByTestId("appointments.customer_search_input"),
      "Zzz",
    );

    const empty = await within(dialog).findByTestId(
      "appointments.customer_search.empty_state",
    );
    expect(empty).toHaveTextContent("Zzz");
    expect(
      within(dialog).queryByTestId("appointments.customer_search.list"),
    ).not.toBeInTheDocument();
  });

  it("filters by the typed term, selects a match and loads that customer's motorcycles", async () => {
    const dialog = await openDialog();

    await userEvent.type(
      within(dialog).getByTestId("appointments.customer_search_input"),
      "Ana",
    );

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalledWith("Ana"));

    const result = await within(dialog).findByTestId(
      "appointments.customer_search.item.1",
    );
    expect(result).toHaveTextContent("Ana Pérez");
    await userEvent.click(result);

    expect(
      await within(dialog).findByTestId("appointments.customer_selected"),
    ).toHaveTextContent("Ana Pérez");
    await waitFor(() => expect(listMotorcyclesMock).toHaveBeenCalledWith(7n));

    await userEvent.click(
      within(dialog).getByTestId("appointments.motorcycle_select"),
    );
    expect(
      await screen.findByRole("option", { name: "Yamaha FZ25 · ABC12D" }),
    ).toBeInTheDocument();
  });

  it("clears the selected customer and the motorcycle when the user changes the customer", async () => {
    const dialog = await openDialog();

    await userEvent.type(
      within(dialog).getByTestId("appointments.customer_search_input"),
      "Ana",
    );
    await userEvent.click(
      await within(dialog).findByTestId("appointments.customer_search.item.1"),
    );
    await waitFor(() => expect(listMotorcyclesMock).toHaveBeenCalledWith(7n));

    await userEvent.click(
      within(dialog).getByTestId("appointments.motorcycle_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Yamaha FZ25 · ABC12D" }),
    );

    await userEvent.click(
      within(dialog).getByTestId("appointments.clear_customer_button"),
    );

    // The selected-customer card is gone and the motorcycle field is gated
    // again, so the previously chosen motorcycle is no longer selected.
    await waitFor(() =>
      expect(
        within(dialog).queryByTestId("appointments.customer_selected"),
      ).not.toBeInTheDocument(),
    );
    expect(
      within(dialog).getByTestId("appointments.motorcycle_select"),
    ).toBeDisabled();
  });
});
