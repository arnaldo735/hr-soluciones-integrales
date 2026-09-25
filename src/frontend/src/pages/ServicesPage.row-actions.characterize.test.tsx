import type { Customer, Service, ServicePage } from "@/lib/types";
import { ServiceSort, UserRole } from "@/lib/types";
import { ServicesPage } from "@/pages/ServicesPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the ServicesPage row-action cluster.
 *
 * The accepted change removes the per-row "Enviar por WhatsApp" control from
 * this page. That control is rendered through `DataTable`'s `rowExtraActions`
 * slot, inside the same trailing actions cluster as the standard edit, notify
 * and delete actions. These tests protect the behavior that must survive the
 * removal: the standard row actions still render for every row, each still
 * performs its own job, and the notify action's visibility rule is unchanged.
 *
 * They deliberately never assert the presence or absence of the WhatsApp
 * control, because removing it is the accepted change.
 */

const listServicesMock = vi.fn();
const deleteServiceMock = vi.fn();
const listCategoriesMock = vi.fn();
const listCustomersMock = vi.fn();
const notifyCustomerMock = vi.fn();
const useRoleMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listServices: listServicesMock,
      deleteService: deleteServiceMock,
      listServiceCategories: listCategoriesMock,
      listCustomers: listCustomersMock,
      notifyCustomer: notifyCustomerMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
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

function service(overrides: Partial<Service> = {}): Service {
  return {
    id: 1n,
    code: "SRV-0001",
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

function page(items: Service[], total = items.length): ServicePage {
  return { items, total: BigInt(total), offset: 0n, limit: 100n };
}

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+57 300 000 0000",
    email: "ada@example.com",
    document: "LOAA1815",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function roleState(isAdmin: boolean) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

describe("ServicesPage row actions (characterization)", () => {
  beforeEach(() => {
    listServicesMock.mockReset();
    deleteServiceMock.mockReset();
    listCategoriesMock.mockReset();
    listCustomersMock.mockReset();
    notifyCustomerMock.mockReset();
    useRoleMock.mockReset();
    listServicesMock.mockResolvedValue(page([]));
    listCategoriesMock.mockResolvedValue([]);
    listCustomersMock.mockResolvedValue([]);
    useRoleMock.mockReturnValue(roleState(true));
  });

  it("renders the standard edit, notify and delete actions for every row", async () => {
    listServicesMock.mockResolvedValue(
      page([
        service({ id: 1n, code: "SRV-0001" }),
        service({ id: 2n, code: "SRV-0002" }),
      ]),
    );
    listCustomersMock.mockResolvedValue([customer()]);
    renderWithProviders(<ServicesPage />);

    await screen.findByText("SRV-0001");
    expect(screen.getByText("SRV-0002")).toBeInTheDocument();

    for (const index of [1, 2]) {
      expect(
        screen.getByTestId(`services.edit_button.${index}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`services.save_button.${index}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`services.delete_button.${index}`),
      ).toBeInTheDocument();
    }
  });

  it("hides the notify action when no customer is registered", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    // No customers: the notify action's `hidden` rule keeps it out of the row.
    listCustomersMock.mockResolvedValue([]);
    renderWithProviders(<ServicesPage />);

    await screen.findByText("SRV-0001");

    expect(
      screen.queryByTestId("services.save_button.1"),
    ).not.toBeInTheDocument();
    // The other standard actions are unaffected by the notify rule.
    expect(screen.getByTestId("services.edit_button.1")).toBeInTheDocument();
    expect(screen.getByTestId("services.delete_button.1")).toBeInTheDocument();
  });

  it("opens the edit dialog from the row's edit action", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    renderWithProviders(<ServicesPage />);
    await screen.findByText("SRV-0001");

    await userEvent.click(screen.getByTestId("services.edit_button.1"));

    const dialog = await screen.findByTestId("services.form_dialog");
    expect(within(dialog).getByTestId("services.code_input")).toHaveValue(
      "SRV-0001",
    );
  });

  it("deletes the row through the confirmation dialog", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    deleteServiceMock.mockResolvedValue(true);
    renderWithProviders(<ServicesPage />);
    await screen.findByText("SRV-0001");

    await userEvent.click(screen.getByTestId("services.delete_button.1"));
    // The delete is gated behind the shared confirmation dialog.
    expect(deleteServiceMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("services.confirm_button"));
    await waitFor(() => expect(deleteServiceMock).toHaveBeenCalledWith(1n));
  });

  it("keeps the sort control wired to the backend after the row actions render", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    renderWithProviders(<ServicesPage />);
    await screen.findByText("SRV-0001");

    await userEvent.click(screen.getByLabelText("Ordenar por"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Nombre" }),
    );

    await waitFor(() =>
      expect(listServicesMock).toHaveBeenCalledWith(
        expect.anything(),
        ServiceSort.name,
        expect.anything(),
        expect.anything(),
      ),
    );
  });
});
