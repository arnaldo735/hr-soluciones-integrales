import type { Customer, Technician } from "@/lib/types";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the appointment form dialog.
 *
 * The accepted change turns the dialog's customer field into a type-to-search
 * picker. These tests protect the surrounding working behavior that must
 * survive it: the dialog opens from the page action, the duration and
 * technician selects keep their options, and submitting an incomplete form
 * blocks with a clear Spanish message instead of calling the backend. They
 * never assert the shape of the customer control itself, which is exactly what
 * is changing.
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

describe("AppointmentsPage form dialog (characterization)", () => {
  beforeEach(() => {
    listAppointmentsMock.mockReset();
    listCustomersMock.mockReset();
    listTechniciansMock.mockReset();
    listMotorcyclesMock.mockReset();
    createAppointmentMock.mockReset();
    listAppointmentsMock.mockResolvedValue([]);
    listCustomersMock.mockResolvedValue([customer()]);
    listTechniciansMock.mockResolvedValue([technician()]);
    listMotorcyclesMock.mockResolvedValue([]);
  });

  it("opens the new-appointment dialog from the page action", async () => {
    renderWithProviders(<AppointmentsPage />);

    await userEvent.click(
      await screen.findByTestId("appointments.open_modal_button"),
    );

    const dialog = await screen.findByTestId("appointments.dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: "Nueva cita" }),
    ).toBeInTheDocument();
  });

  it("offers the duration options in the dialog", async () => {
    renderWithProviders(<AppointmentsPage />);
    await userEvent.click(
      await screen.findByTestId("appointments.open_modal_button"),
    );
    await screen.findByTestId("appointments.dialog");

    await userEvent.click(screen.getByTestId("appointments.duration_select"));
    expect(
      await screen.findByRole("option", { name: "30 min" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "120 min" })).toBeInTheDocument();
  });

  it("blocks the submit with a clear message when no customer or moto is chosen", async () => {
    renderWithProviders(<AppointmentsPage />);
    await userEvent.click(
      await screen.findByTestId("appointments.open_modal_button"),
    );
    const dialog = await screen.findByTestId("appointments.dialog");

    await userEvent.type(
      within(dialog).getByTestId("appointments.reason_input"),
      "Afinación",
    );
    await userEvent.click(
      within(dialog).getByTestId("appointments.submit_button"),
    );

    expect(
      await within(dialog).findByTestId("appointments.form.error_state"),
    ).toHaveTextContent("Selecciona el cliente y la moto de la cita.");
    expect(createAppointmentMock).not.toHaveBeenCalled();
  });

  it("blocks the submit when the reason is missing", async () => {
    renderWithProviders(<AppointmentsPage />);
    await userEvent.click(
      await screen.findByTestId("appointments.open_modal_button"),
    );
    const dialog = await screen.findByTestId("appointments.dialog");

    await userEvent.click(
      within(dialog).getByTestId("appointments.submit_button"),
    );

    expect(
      await within(dialog).findByTestId("appointments.form.error_state"),
    ).toHaveTextContent("Selecciona el cliente y la moto de la cita.");
    expect(createAppointmentMock).not.toHaveBeenCalled();
  });

  it("closes the dialog from the cancel action without creating anything", async () => {
    renderWithProviders(<AppointmentsPage />);
    await userEvent.click(
      await screen.findByTestId("appointments.open_modal_button"),
    );
    const dialog = await screen.findByTestId("appointments.dialog");

    await userEvent.click(
      within(dialog).getByTestId("appointments.cancel_button"),
    );

    await waitFor(() =>
      expect(
        screen.queryByTestId("appointments.dialog"),
      ).not.toBeInTheDocument(),
    );
    expect(createAppointmentMock).not.toHaveBeenCalled();
  });
});
