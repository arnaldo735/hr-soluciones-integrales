import type {
  Appointment,
  Customer,
  Technician,
  WhatsAppMessageResult,
} from "@/lib/types";
import {
  AppointmentStatus,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the appointments agenda.
 *
 * The accepted change adds a "Enviar por WhatsApp" action to this page. These
 * tests protect the behavior that must survive it: the list renders each
 * appointment with its customer, technician, reason and status, the empty state
 * appears when there are none, the status filter reaches the backend, and the
 * calendar view still renders the month grid. They never assert the absence of
 * a WhatsApp action.
 */

const listAppointmentsMock = vi.fn();
const listCustomersMock = vi.fn();
const listTechniciansMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listAppointments: listAppointmentsMock,
      listCustomers: listCustomersMock,
      listTechnicians: listTechniciansMock,
      prepareWhatsAppMessage: prepareWhatsAppMessageMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TS = 1_700_000_000_000_000_000n;

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 1n,
    status: AppointmentStatus.scheduled,
    createdAt: TS,
    updatedAt: TS,
    durationMinutes: 60n,
    technicianId: 5n,
    motorcycleId: 3n,
    customerId: 7n,
    scheduledAt: TS,
    reason: "Afinación y cambio de aceite",
    ...overrides,
  };
}

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

function preparedWhatsApp(
  overrides: Partial<WhatsAppMessageResult> = {},
): WhatsAppMessageResult {
  return {
    contactKind: WhatsAppContactKind.customer,
    contactId: 7n,
    contactName: "Ana Pérez",
    hasPhone: true,
    phone: "+57 300 111 2222",
    message: "Hola Ana, le recordamos su cita.",
    ...overrides,
  };
}

describe("AppointmentsPage", () => {
  beforeEach(() => {
    listAppointmentsMock.mockReset();
    listCustomersMock.mockReset();
    listTechniciansMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    listAppointmentsMock.mockResolvedValue([]);
    listCustomersMock.mockResolvedValue([customer()]);
    listTechniciansMock.mockResolvedValue([technician()]);
  });

  it("lists appointments with customer, technician, reason and status", async () => {
    listAppointmentsMock.mockResolvedValue([appointment()]);
    renderWithProviders(<AppointmentsPage />);

    const table = await screen.findByTestId("appointments.table");
    expect(within(table).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(table).getByText("Carlos Ruiz")).toBeInTheDocument();
    expect(
      within(table).getByText("Afinación y cambio de aceite"),
    ).toBeInTheDocument();
    expect(within(table).getByText("Agendada")).toBeInTheDocument();
  });

  it("falls back to id placeholders when the lookups are unavailable", async () => {
    listAppointmentsMock.mockResolvedValue([appointment()]);
    listCustomersMock.mockResolvedValue([]);
    listTechniciansMock.mockResolvedValue([]);
    renderWithProviders(<AppointmentsPage />);

    const table = await screen.findByTestId("appointments.table");
    expect(within(table).getByText("Cliente #7")).toBeInTheDocument();
    expect(within(table).getByText("Técnico #5")).toBeInTheDocument();
  });

  it("renders the empty state when there are no appointments", async () => {
    listAppointmentsMock.mockResolvedValue([]);
    renderWithProviders(<AppointmentsPage />);

    expect(
      await screen.findByTestId("appointments.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Aún no hay citas")).toBeInTheDocument();
  });

  it("renders the error state and retries on demand", async () => {
    listAppointmentsMock.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<AppointmentsPage />);

    expect(
      await screen.findByTestId("appointments.error_state"),
    ).toBeInTheDocument();

    listAppointmentsMock.mockResolvedValue([appointment()]);
    await userEvent.click(screen.getByTestId("appointments.retry_button"));
    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
  });

  it("passes the selected status filter to the backend", async () => {
    renderWithProviders(<AppointmentsPage />);
    await waitFor(() => expect(listAppointmentsMock).toHaveBeenCalled());

    await userEvent.click(screen.getByTestId("appointments.status_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Confirmada" }),
    );

    await waitFor(() =>
      expect(listAppointmentsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: AppointmentStatus.confirmed }),
      ),
    );
  });

  it("switches to the calendar view and renders the month grid", async () => {
    listAppointmentsMock.mockResolvedValue([appointment()]);
    renderWithProviders(<AppointmentsPage />);

    await screen.findByTestId("appointments.table");
    await userEvent.click(screen.getByTestId("appointments.view.calendar_tab"));

    expect(
      await screen.findByTestId("appointments.calendar"),
    ).toBeInTheDocument();
    // The weekday header row is part of the month grid.
    expect(screen.getByText("Lun")).toBeInTheDocument();
    expect(screen.getByText("Dom")).toBeInTheDocument();
  });

  // --- Accepted behavior: the WhatsApp action on the agenda -----------------
  //
  // The accepted change adds an "Enviar por WhatsApp" action to the agenda. The
  // shared button is covered in isolation; this test protects the page wiring:
  // the row action asks the backend for the appointment's customer with the
  // appointment context and reference, and opens WhatsApp with the draft.

  it("opens WhatsApp for the appointment's customer with the appointment context", async () => {
    listAppointmentsMock.mockResolvedValue([appointment()]);
    prepareWhatsAppMessageMock.mockResolvedValue(preparedWhatsApp());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderWithProviders(<AppointmentsPage />);

      await screen.findByTestId("appointments.table");
      await userEvent.click(
        screen.getByTestId("appointments.whatsapp_button.1"),
      );

      const dialog = await screen.findByTestId("whatsapp.dialog");
      await waitFor(() =>
        expect(prepareWhatsAppMessageMock).toHaveBeenCalledTimes(1),
      );
      expect(prepareWhatsAppMessageMock.mock.calls[0][0]).toMatchObject({
        contactKind: WhatsAppContactKind.customer,
        contactId: 7n,
        context: WhatsAppContext.appointment,
        referenceId: 1n,
      });

      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));
      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      expect(openSpy.mock.calls[0][0]).toContain("https://wa.me/573001112222");
    } finally {
      openSpy.mockRestore();
    }
  });

  it("explains when the appointment's customer has no phone registered", async () => {
    listAppointmentsMock.mockResolvedValue([appointment()]);
    prepareWhatsAppMessageMock.mockResolvedValue(
      preparedWhatsApp({ hasPhone: false, phone: undefined }),
    );
    renderWithProviders(<AppointmentsPage />);

    await screen.findByTestId("appointments.table");
    await userEvent.click(screen.getByTestId("appointments.whatsapp_button.1"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    expect(
      await within(dialog).findByTestId("whatsapp.no_phone_state"),
    ).toHaveTextContent("no tiene un teléfono registrado");
    expect(within(dialog).getByTestId("whatsapp.send_button")).toBeDisabled();
  });
});
