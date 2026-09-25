import type { CustomerDetail, Motorcycle } from "@/lib/types";
import { CustomerDetailPage } from "@/pages/CustomerDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the customer detail page's contact data and
 * printable ficha.
 *
 * The accepted change removes the "Enviar por WhatsApp" action from this page.
 * The rest of the detail must keep working: the header shows the customer's own
 * contact data, and the "Ver ficha" preview still opens the customer's printable
 * document with its motorcycles. These tests pin that adjacent behavior and
 * deliberately never assert the page's WhatsApp button, whose removal is the
 * accepted change.
 */

const getCustomerDetailMock = vi.fn();
const getCompanyProfileMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCustomerDetail: getCustomerDetailMock,
      getCompanyProfile: getCompanyProfileMock,
    },
    isFetching: false,
  }),
}));

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

describe("CustomerDetailPage contact data and ficha (characterization)", () => {
  beforeEach(() => {
    getCustomerDetailMock.mockReset();
    getCompanyProfileMock.mockReset();
    useParamsMock.mockReset();
    useParamsMock.mockReturnValue({ id: "1" });
    getCompanyProfileMock.mockResolvedValue(null);
  });

  it("shows the customer's own contact data in the header", async () => {
    getCustomerDetailMock.mockResolvedValue(
      detail({
        customer: {
          id: 1n,
          name: "Ada Lovelace",
          phone: "+52 555 0100",
          email: "ada@example.com",
          document: "LOAA1815",
          address: "Calle 1 #2-3",
          createdAt: 1_700_000_000_000_000_000n,
        },
        motorcycles: [motorcycle(), motorcycle({ id: 8n, plate: "XYZ-789" })],
      }),
    );

    renderWithProviders(<CustomerDetailPage />);
    await screen.findByTestId("customer_detail.page");

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("+52 555 0100")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("LOAA1815")).toBeInTheDocument();
    // The motorcycle count reflects this customer's own fleet.
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("opens the customer's printable ficha with its motorcycles", async () => {
    getCustomerDetailMock.mockResolvedValue(
      detail({
        motorcycles: [
          motorcycle({ plate: "ABC-123", brand: "Yamaha", model: "FZ 2.0" }),
        ],
      }),
    );

    renderWithProviders(<CustomerDetailPage />);
    await screen.findByTestId("customer_detail.page");

    await userEvent.click(screen.getByTestId("customer_detail.preview_button"));

    const dialog = await screen.findByTestId(
      "customer_detail.preview_button.dialog",
    );
    // The ficha is the clicked customer's own document, numbered by its id.
    expect(
      within(dialog).getAllByText("Ficha de cliente").length,
    ).toBeGreaterThan(0);
    expect(within(dialog).getByText("CLI-1")).toBeInTheDocument();
    // The motorcycle section carries the customer's own bike.
    expect(within(dialog).getByText(/ABC-123/)).toBeInTheDocument();
  });
});
