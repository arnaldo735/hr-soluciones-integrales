import type { CustomerDetail, Motorcycle } from "@/lib/types";
import { CustomerDetailPage } from "@/pages/CustomerDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change on the customer detail page: «Agregar moto»,
 * «Editar moto» and «Ver ficha» must respond on the first click without a
 * perceptible pause, and opening the motorcycle modal must not touch the
 * backend until the user saves.
 *
 * The observable contract is that opening the modal issues no backend write,
 * that the modal still shows the right bike's data, that saving still persists
 * and refreshes the detail, and that the ficha preview opens without reading
 * the company profile until the dialog is actually open. These tests never
 * assert how long an open takes.
 */

const getCustomerDetailMock = vi.fn();
const updateCustomerMock = vi.fn();
const updateMotorcycleMock = vi.fn();
const createMotorcycleMock = vi.fn();
const getCompanyProfileMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCustomerDetail: getCustomerDetailMock,
      updateCustomer: updateCustomerMock,
      updateMotorcycle: updateMotorcycleMock,
      createMotorcycle: createMotorcycleMock,
      getCompanyProfile: getCompanyProfileMock,
    },
    isFetching: false,
  }),
}));

// The page reads the route param; the test drives it directly rather than
// mounting the whole router.
const useParamsMock = vi.fn();
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
  useParams: () => useParamsMock(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const downloadContactDocumentPdfMock = vi.fn();
vi.mock("@/lib/pdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pdf")>();
  return {
    ...actual,
    downloadContactDocumentPdf: (...args: unknown[]) =>
      downloadContactDocumentPdfMock(...args),
  };
});

function motorcycle(overrides: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 7n,
    customerId: 1n,
    brand: "Yamaha",
    model: "FZ 2.0",
    plate: "ABC-123",
    year: 2021n,
    mileage: 12000n,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function detail(overrides: Partial<CustomerDetail> = {}): CustomerDetail {
  return {
    customer: {
      id: 1n,
      name: "Ada Lovelace",
      phone: "+52 555 0100",
      email: "ada@example.com",
      document: "LOAA1815",
      address: "Calle 1 #2-3",
      createdAt: 1_700_000_000_000_000_000n,
    },
    motorcycles: [],
    orders: [],
    ...overrides,
  };
}

describe("CustomerDetailPage modal open (cover)", () => {
  beforeEach(() => {
    getCustomerDetailMock.mockReset();
    updateCustomerMock.mockReset();
    updateMotorcycleMock.mockReset();
    createMotorcycleMock.mockReset();
    getCompanyProfileMock.mockReset();
    downloadContactDocumentPdfMock.mockReset();
    useParamsMock.mockReset();
    useParamsMock.mockReturnValue({ id: "1" });
    getCompanyProfileMock.mockResolvedValue(null);
    downloadContactDocumentPdfMock.mockResolvedValue(undefined);
  });

  it("opens the add-moto modal without writing to the backend", async () => {
    getCustomerDetailMock.mockResolvedValue(detail());

    renderWithProviders(<CustomerDetailPage />);
    await screen.findByTestId("customer_detail.page");

    await userEvent.click(screen.getByTestId("motorcycle.open_modal_button"));

    const dialog = await screen.findByTestId("motorcycle.dialog");
    expect(within(dialog).getByText("Nueva moto")).toBeInTheDocument();
    expect(screen.getByTestId("motorcycle.plate_input")).toHaveValue("");

    // Opening the modal is a pure UI action: no create/update until submit.
    expect(createMotorcycleMock).not.toHaveBeenCalled();
    expect(updateMotorcycleMock).not.toHaveBeenCalled();
  });

  it("opens the edit-moto modal seeded without writing to the backend", async () => {
    getCustomerDetailMock.mockResolvedValue(
      detail({ motorcycles: [motorcycle()] }),
    );

    renderWithProviders(<CustomerDetailPage />);
    await screen.findByTestId("motorcycle.table");

    await userEvent.click(screen.getByTestId("motorcycle.edit_button.1"));

    const dialog = await screen.findByTestId("motorcycle.dialog");
    expect(within(dialog).getByText("Editar moto")).toBeInTheDocument();
    expect(screen.getByTestId("motorcycle.plate_input")).toHaveValue("ABC-123");
    expect(screen.getByTestId("motorcycle.brand_input")).toHaveValue("Yamaha");
    expect(screen.getByTestId("motorcycle.year_input")).toHaveValue("2021");
    expect(screen.getByTestId("motorcycle.mileage_input")).toHaveValue("12000");

    expect(createMotorcycleMock).not.toHaveBeenCalled();
    expect(updateMotorcycleMock).not.toHaveBeenCalled();
  });

  it("saves a new motorcycle on submit and refreshes the detail", async () => {
    getCustomerDetailMock.mockResolvedValue(detail());
    createMotorcycleMock.mockResolvedValue(motorcycle({ plate: "NEW-999" }));

    renderWithProviders(<CustomerDetailPage />);
    await screen.findByTestId("customer_detail.page");

    await userEvent.click(screen.getByTestId("motorcycle.open_modal_button"));
    await screen.findByTestId("motorcycle.dialog");

    await userEvent.type(
      screen.getByTestId("motorcycle.plate_input"),
      "NEW-999",
    );
    await userEvent.type(screen.getByTestId("motorcycle.brand_input"), "Honda");
    await userEvent.type(
      screen.getByTestId("motorcycle.model_input"),
      "CB 190",
    );
    await userEvent.type(screen.getByTestId("motorcycle.year_input"), "2022");
    await userEvent.type(
      screen.getByTestId("motorcycle.mileage_input"),
      "1500",
    );

    expect(createMotorcycleMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("motorcycle.submit_button"));

    await waitFor(() =>
      expect(createMotorcycleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 1n,
          plate: "NEW-999",
          brand: "Honda",
          model: "CB 190",
          year: 2022n,
          mileage: 1500n,
        }),
      ),
    );

    // The detail query is invalidated and read again after the save.
    await waitFor(() =>
      expect(getCustomerDetailMock.mock.calls.length).toBeGreaterThan(1),
    );
  });

  it("saves an edited motorcycle on submit with the bike's id", async () => {
    getCustomerDetailMock.mockResolvedValue(
      detail({ motorcycles: [motorcycle()] }),
    );
    updateMotorcycleMock.mockResolvedValue(motorcycle({ plate: "XYZ-789" }));

    renderWithProviders(<CustomerDetailPage />);
    await screen.findByTestId("motorcycle.table");

    await userEvent.click(screen.getByTestId("motorcycle.edit_button.1"));
    await screen.findByTestId("motorcycle.dialog");

    const plate = screen.getByTestId("motorcycle.plate_input");
    await userEvent.clear(plate);
    await userEvent.type(plate, "XYZ-789");

    expect(updateMotorcycleMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("motorcycle.submit_button"));

    await waitFor(() =>
      expect(updateMotorcycleMock).toHaveBeenCalledWith(
        7n,
        expect.objectContaining({ plate: "XYZ-789" }),
      ),
    );
  });

  it("opens the ficha preview on the first click without reading the company profile", async () => {
    getCustomerDetailMock.mockResolvedValue(
      detail({ motorcycles: [motorcycle()] }),
    );

    renderWithProviders(<CustomerDetailPage />);
    await screen.findByTestId("customer_detail.page");

    // The preview button is present and the page has not read the company
    // profile yet: the heavy body is mounted only once the dialog opens.
    expect(getCompanyProfileMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("customer_detail.preview_button"));

    const dialog = await screen.findByTestId(
      "customer_detail.preview_button.dialog",
    );
    expect(
      within(dialog).getAllByText("Ficha de cliente").length,
    ).toBeGreaterThan(0);

    // Opening the preview reads the profile for the header, but generates no
    // PDF until the user asks for it.
    await waitFor(() => expect(getCompanyProfileMock).toHaveBeenCalled());
    expect(downloadContactDocumentPdfMock).not.toHaveBeenCalled();
  });
});
