import { AddLaborDialog } from "@/components/order/AddLaborDialog";
import type { Service, Technician } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the labor dialog's adjacent working behavior.
 *
 * The dialog is intentionally changing from a free-text form to a service
 * catalog picker, so this file never asserts that a labor line must be entered
 * by hand. It protects the surrounding contract instead: the required
 * description and price validation in Spanish, the technician picker, and the
 * stable fields of the payload sent to the backend.
 */

const addLaborMock = vi.fn();
const listTechniciansMock = vi.fn();
const listServicesMock = vi.fn();

vi.mock("@/hooks/use-orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-orders")>();
  return {
    ...actual,
    useAddLabor: () => addLaborMock(),
  };
});

vi.mock("@/hooks/use-technicians", () => ({
  useTechnicians: () => ({
    data: listTechniciansMock(),
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listServices: listServicesMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function technician(overrides: Partial<Technician> = {}): Technician {
  return {
    id: 5n,
    code: "TEC-005",
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

function service(overrides: Partial<Service> = {}): Service {
  return {
    id: 3n,
    code: "SRV-0003",
    name: "Cambio de aceite",
    description: "Incluye filtro",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 60n,
    active: true,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function idleMutation() {
  return { mutate: vi.fn(), isPending: false };
}

function servicePage(items: Service[] = []) {
  return { items, total: BigInt(items.length), offset: 0n, limit: 8n };
}

describe("AddLaborDialog", () => {
  beforeEach(() => {
    addLaborMock.mockReset();
    listTechniciansMock.mockReset();
    listServicesMock.mockReset();
    addLaborMock.mockReturnValue(idleMutation());
    listTechniciansMock.mockReturnValue([]);
    listServicesMock.mockResolvedValue(servicePage());
  });

  it("rejects an empty description with a Spanish error and does not save", async () => {
    const mutation = idleMutation();
    addLaborMock.mockReturnValue(mutation);

    renderWithProviders(
      <AddLaborDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await userEvent.click(
      screen.getByTestId("order_detail.add_labor.submit_button"),
    );

    expect(
      await screen.findByTestId("order_detail.add_labor.error_state"),
    ).toHaveTextContent("Describe el servicio o la mano de obra realizada.");
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it("rejects a missing price with a Spanish error and does not save", async () => {
    const mutation = idleMutation();
    addLaborMock.mockReturnValue(mutation);

    renderWithProviders(
      <AddLaborDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.add_labor.description_input"),
      "Ajuste de frenos",
    );
    await userEvent.click(
      screen.getByTestId("order_detail.add_labor.submit_button"),
    );

    expect(
      await screen.findByTestId("order_detail.add_labor.error_state"),
    ).toHaveTextContent("Captura un precio válido (mayor o igual a cero).");
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it("sends the description, price in cents and technician to the backend", async () => {
    const mutate = vi.fn();
    addLaborMock.mockReturnValue({ mutate, isPending: false });
    listTechniciansMock.mockReturnValue([technician()]);

    renderWithProviders(
      <AddLaborDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.add_labor.description_input"),
      "Ajuste de frenos",
    );
    await userEvent.type(
      screen.getByTestId("order_detail.add_labor.price_input"),
      "300",
    );

    await userEvent.click(
      screen.getByTestId("order_detail.add_labor.technician_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: /TEC-005/ }),
    );

    await userEvent.click(
      screen.getByTestId("order_detail.add_labor.submit_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toMatchObject({
      id: 42n,
      labor: {
        description: "Ajuste de frenos",
        price: 30000n,
        technicianId: 5n,
        serviceId: undefined,
      },
    });
  });

  it("autocompletes description and price from a catalog service and keeps the reference", async () => {
    const mutate = vi.fn();
    addLaborMock.mockReturnValue({ mutate, isPending: false });
    listServicesMock.mockResolvedValue(servicePage([service()]));

    renderWithProviders(
      <AddLaborDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.add_labor.service.search_input"),
      "aceite",
    );

    await userEvent.click(
      await screen.findByTestId("order_detail.add_labor.service.item.1"),
    );

    // The picker autocompletes the description and the tariff as the price.
    expect(
      screen.getByTestId("order_detail.add_labor.description_input"),
    ).toHaveValue("SRV-0003 · Cambio de aceite");
    expect(
      screen.getByTestId("order_detail.add_labor.price_input"),
    ).toHaveValue(450);

    // The price stays editable after selecting the service.
    await userEvent.clear(
      screen.getByTestId("order_detail.add_labor.price_input"),
    );
    await userEvent.type(
      screen.getByTestId("order_detail.add_labor.price_input"),
      "500",
    );

    await userEvent.click(
      screen.getByTestId("order_detail.add_labor.submit_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toMatchObject({
      id: 42n,
      labor: {
        description: "SRV-0003 · Cambio de aceite",
        price: 50000n,
        serviceId: 3n,
      },
    });
  });

  it("closes the dialog after a successful save", async () => {
    const onOpenChange = vi.fn();
    const mutate = vi.fn(
      (_input: unknown, options?: { onSuccess?: () => void }): void => {
        options?.onSuccess?.();
      },
    );
    addLaborMock.mockReturnValue({ mutate, isPending: false });

    renderWithProviders(
      <AddLaborDialog orderId={42n} open onOpenChange={onOpenChange} />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.add_labor.description_input"),
      "Ajuste de frenos",
    );
    await userEvent.type(
      screen.getByTestId("order_detail.add_labor.price_input"),
      "300",
    );
    await userEvent.click(
      screen.getByTestId("order_detail.add_labor.submit_button"),
    );

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
