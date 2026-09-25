import type { Technician, TechnicianWorkload } from "@/lib/types";
import { TechniciansPage } from "@/pages/TechniciansPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listTechniciansMock = vi.fn();
const listWorkloadMock = vi.fn();
const listOrdersMock = vi.fn();
const createTechnicianMock = vi.fn();
const updateTechnicianMock = vi.fn();
const deleteTechnicianMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listTechnicians: listTechniciansMock,
      listTechnicianWorkload: listWorkloadMock,
      listOrders: listOrdersMock,
      createTechnician: createTechnicianMock,
      updateTechnician: updateTechnicianMock,
      deleteTechnician: deleteTechnicianMock,
    },
    isFetching: false,
  }),
}));

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a href="/" {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function technician(overrides: Partial<Technician> = {}): Technician {
  return {
    id: 1n,
    code: "TEC-001",
    name: "Marco Ríos",
    phone: "81 8123 4567",
    email: "marco@taller.co",
    specialty: "Motores",
    hourlyRate: 18000n,
    commissionRate: 10n,
    active: true,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function workload(
  overrides: Partial<TechnicianWorkload> = {},
): TechnicianWorkload {
  return {
    technician: technician(),
    activeOrders: 2n,
    orderIds: [42n],
    ...overrides,
  };
}

describe("TechniciansPage", () => {
  beforeEach(() => {
    listTechniciansMock.mockReset();
    listWorkloadMock.mockReset();
    listOrdersMock.mockReset();
    createTechnicianMock.mockReset();
    updateTechnicianMock.mockReset();
    deleteTechnicianMock.mockReset();
    listTechniciansMock.mockResolvedValue([]);
    listWorkloadMock.mockResolvedValue([]);
    listOrdersMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 200n,
    });
  });

  it("lists technicians with code, specialty, contact, rate and commission", async () => {
    listTechniciansMock.mockResolvedValue([technician()]);
    renderWithProviders(<TechniciansPage />);

    expect(await screen.findByText("Marco Ríos")).toBeInTheDocument();
    expect(screen.getByText("TEC-001")).toBeInTheDocument();
    expect(screen.getByText("Motores")).toBeInTheDocument();
    expect(screen.getByText("81 8123 4567")).toBeInTheDocument();
    expect(screen.getByText("$ 180")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("marco@taller.co")).toBeInTheDocument();
  });

  it("surfaces a duplicate technician code and does not save", async () => {
    createTechnicianMock.mockRejectedValue(
      new Error("Ya existe un técnico con el código TEC-001"),
    );
    renderWithProviders(<TechniciansPage />);
    await screen.findByTestId("technicians.empty_state");

    await userEvent.click(screen.getByTestId("technicians.open_modal_button"));
    await userEvent.type(
      screen.getByTestId("technicians.code_input"),
      "TEC-001",
    );
    await userEvent.type(
      screen.getByTestId("technicians.name_input"),
      "Ana Torres",
    );
    await userEvent.type(
      screen.getByTestId("technicians.phone_input"),
      "81 8000 0000",
    );
    await userEvent.type(
      screen.getByTestId("technicians.specialty_input"),
      "Eléctrico",
    );
    await userEvent.type(screen.getByTestId("technicians.rate_input"), "200");
    await userEvent.type(
      screen.getByTestId("technicians.commission_input"),
      "15",
    );
    await userEvent.click(screen.getByTestId("technicians.submit_button"));

    await waitFor(() => expect(createTechnicianMock).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByTestId("technicians.form_error"),
    ).toHaveTextContent("Ya existe un técnico con el código TEC-001");
    // The dialog stays open so the code can be corrected.
    expect(screen.getByTestId("technicians.dialog")).toBeInTheDocument();
  });

  it("renders an empty state when no technicians exist", async () => {
    listTechniciansMock.mockResolvedValue([]);
    renderWithProviders(<TechniciansPage />);

    expect(
      await screen.findByTestId("technicians.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Aún no hay técnicos")).toBeInTheDocument();
  });

  it("renders an error state when the roster fails to load", async () => {
    listTechniciansMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<TechniciansPage />);

    expect(
      await screen.findByTestId("technicians.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo cargar la plantilla"),
    ).toBeInTheDocument();
  });

  it("passes the trimmed search term to the backend", async () => {
    renderWithProviders(<TechniciansPage />);
    await waitFor(() => expect(listTechniciansMock).toHaveBeenCalled());

    await userEvent.type(
      screen.getByTestId("technicians.search_input"),
      "  Marco  ",
    );

    await waitFor(() =>
      expect(listTechniciansMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "Marco" }),
      ),
    );
  });

  it("creates a technician from the form dialog", async () => {
    createTechnicianMock.mockResolvedValue(technician());
    renderWithProviders(<TechniciansPage />);
    await screen.findByTestId("technicians.empty_state");

    await userEvent.click(screen.getByTestId("technicians.open_modal_button"));
    await userEvent.type(
      screen.getByTestId("technicians.code_input"),
      "TEC-002",
    );
    await userEvent.type(
      screen.getByTestId("technicians.name_input"),
      "Ana Torres",
    );
    await userEvent.type(
      screen.getByTestId("technicians.phone_input"),
      "81 8000 0000",
    );
    await userEvent.type(
      screen.getByTestId("technicians.specialty_input"),
      "Eléctrico",
    );
    await userEvent.type(screen.getByTestId("technicians.rate_input"), "200");
    await userEvent.type(
      screen.getByTestId("technicians.commission_input"),
      "15",
    );
    await userEvent.click(screen.getByTestId("technicians.submit_button"));

    await waitFor(() => expect(createTechnicianMock).toHaveBeenCalledTimes(1));
    expect(createTechnicianMock.mock.calls[0][0]).toMatchObject({
      code: "TEC-002",
      name: "Ana Torres",
      phone: "81 8000 0000",
      specialty: "Eléctrico",
      hourlyRate: 20000n,
      commissionRate: 15n,
      active: true,
    });
  });

  it("does not save a technician while the required fields are empty", async () => {
    renderWithProviders(<TechniciansPage />);
    await screen.findByTestId("technicians.empty_state");

    await userEvent.click(screen.getByTestId("technicians.open_modal_button"));
    await userEvent.type(
      screen.getByTestId("technicians.name_input"),
      "Ana Torres",
    );
    await userEvent.click(screen.getByTestId("technicians.submit_button"));

    // The form's native `required` validation keeps the dialog open and no
    // backend call is made.
    expect(screen.getByTestId("technicians.dialog")).toBeInTheDocument();
    expect(createTechnicianMock).not.toHaveBeenCalled();
  });

  it("pre-fills the edit dialog with the selected technician", async () => {
    listTechniciansMock.mockResolvedValue([technician()]);
    renderWithProviders(<TechniciansPage />);
    await screen.findByText("Marco Ríos");

    await userEvent.click(screen.getByTestId("technicians.edit_button.1"));

    // The controlled `open` prop must populate the form from the technician
    // being edited; a blank dialog would silently overwrite the record.
    expect(screen.getByTestId("technicians.code_input")).toHaveValue("TEC-001");
    expect(screen.getByTestId("technicians.name_input")).toHaveValue(
      "Marco Ríos",
    );
    expect(screen.getByTestId("technicians.phone_input")).toHaveValue(
      "81 8123 4567",
    );
    expect(screen.getByTestId("technicians.specialty_input")).toHaveValue(
      "Motores",
    );
    expect(screen.getByTestId("technicians.rate_input")).toHaveValue("180.00");
    expect(screen.getByTestId("technicians.commission_input")).toHaveValue(
      "10",
    );
  });

  it("updates an existing technician through the edit dialog", async () => {
    listTechniciansMock.mockResolvedValue([technician()]);
    updateTechnicianMock.mockResolvedValue(technician());
    renderWithProviders(<TechniciansPage />);
    await screen.findByText("Marco Ríos");

    await userEvent.click(screen.getByTestId("technicians.edit_button.1"));
    // The dialog is pre-filled from the technician; change only the specialty
    // and the commission so the update payload is unambiguous.
    const specialtyInput = screen.getByTestId("technicians.specialty_input");
    await userEvent.clear(specialtyInput);
    await userEvent.type(specialtyInput, "Transmisión");
    const commissionInput = screen.getByTestId("technicians.commission_input");
    await userEvent.clear(commissionInput);
    await userEvent.type(commissionInput, "12");
    await userEvent.click(screen.getByTestId("technicians.submit_button"));

    await waitFor(() => expect(updateTechnicianMock).toHaveBeenCalledTimes(1));
    expect(updateTechnicianMock.mock.calls[0][0]).toBe(1n);
    expect(updateTechnicianMock.mock.calls[0][1]).toMatchObject({
      code: "TEC-001",
      name: "Marco Ríos",
      specialty: "Transmisión",
      hourlyRate: 18000n,
      commissionRate: 12n,
    });
  });

  it("deletes a technician only after confirming", async () => {
    listTechniciansMock.mockResolvedValue([technician()]);
    deleteTechnicianMock.mockResolvedValue(true);
    renderWithProviders(<TechniciansPage />);
    await screen.findByText("Marco Ríos");

    await userEvent.click(screen.getByTestId("technicians.delete_button.1"));
    expect(deleteTechnicianMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("technicians.confirm_button"));
    await waitFor(() => expect(deleteTechnicianMock).toHaveBeenCalledWith(1n));
  });

  it("shows each technician's active order count in the workload tab", async () => {
    listTechniciansMock.mockResolvedValue([technician()]);
    listWorkloadMock.mockResolvedValue([workload()]);
    renderWithProviders(<TechniciansPage />);
    await screen.findByText("Marco Ríos");

    await userEvent.click(screen.getByTestId("technicians.tab.workload"));

    expect(
      await screen.findByTestId("technicians.workload.card.1"),
    ).toBeInTheDocument();
    expect(screen.getByText("2 órdenes")).toBeInTheDocument();
  });

  it("renders an empty workload state when there is no workload", async () => {
    listTechniciansMock.mockResolvedValue([]);
    listWorkloadMock.mockResolvedValue([]);
    renderWithProviders(<TechniciansPage />);
    await screen.findByTestId("technicians.empty_state");

    await userEvent.click(screen.getByTestId("technicians.tab.workload"));

    expect(
      await screen.findByTestId("technicians.workload.empty_state"),
    ).toBeInTheDocument();
  });
});
