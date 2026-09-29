import { WARRANTY_TERMS_DEFAULT_TEXT } from "@/hooks/use-warranty-terms";
import type { Service, ServicePage } from "@/lib/types";
import { HopeMode, OrderStatus } from "@/lib/types";
import type { OrderView } from "@/lib/types";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the automatic "Términos y Condiciones de Garantía" document of the
 * work order.
 *
 * The accepted change shows a warranty action on an order whose labor is linked
 * to the catalog services "Reparación de motor" or "Reparación de cabeza de
 * fuerza", and hides it otherwise. The document renders the identification
 * block, the 8 numbered clauses and the IMPORTANTE notice, toggles between A4
 * and the 80 mm receipt, downloads a real PDF and can be sent over WhatsApp.
 *
 * The backend and the PDF builder are mocked at their seams, so a passing run
 * says nothing about the real canister reads or the bytes jsPDF produces.
 */

const {
  useOrderMock,
  updateStatusMock,
  removePartMock,
  removeLaborMock,
  useServicesMock,
  serviceTermsQueryMock,
  warrantyTermsQueryMock,
  getCompanyProfileMock,
  getDailyHopeMessageMock,
  downloadWarrantyPdfMock,
  prepareWhatsAppMock,
} = vi.hoisted(() => ({
  useOrderMock: vi.fn(),
  updateStatusMock: vi.fn(),
  removePartMock: vi.fn(),
  removeLaborMock: vi.fn(),
  useServicesMock: vi.fn(),
  serviceTermsQueryMock: vi.fn(),
  warrantyTermsQueryMock: vi.fn(),
  getCompanyProfileMock: vi.fn(),
  getDailyHopeMessageMock: vi.fn(),
  downloadWarrantyPdfMock: vi.fn(),
  prepareWhatsAppMock: vi.fn(),
}));

vi.mock("@/hooks/use-orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-orders")>();
  return {
    ...actual,
    useOrder: () => useOrderMock(),
    useUpdateOrderStatus: () => updateStatusMock(),
    useRemoveOrderPart: () => removePartMock(),
    useRemoveLabor: () => removeLaborMock(),
  };
});

vi.mock("@/hooks/use-services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-services")>();
  return {
    ...actual,
    useServices: (params: unknown) => useServicesMock(params),
  };
});

vi.mock("@/hooks/use-service-terms", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-service-terms")>();
  return { ...actual, useServiceTermsSettings: () => serviceTermsQueryMock() };
});

vi.mock("@/hooks/use-warranty-terms", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-warranty-terms")>();
  return {
    ...actual,
    useWarrantyTermsSettings: () => warrantyTermsQueryMock(),
  };
});

vi.mock("@/hooks/use-whatsapp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-whatsapp")>();
  return { ...actual, usePrepareWhatsAppMessage: () => prepareWhatsAppMock() };
});

// Keep the real helpers (`hopeMessageContent`, `pdfCompanyFromProfile`, …) and
// only replace the warranty PDF builder, whose bytes are not the contract here.
vi.mock("@/lib/pdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pdf")>();
  return { ...actual, downloadWarrantyPdf: downloadWarrantyPdfMock };
});

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCustomer: vi.fn().mockResolvedValue({
        id: 1n,
        name: "Ada Lovelace",
        phone: "+52",
        createdAt: 0n,
      }),
      listMotorcycles: vi.fn().mockResolvedValue([
        {
          id: 7n,
          customerId: 1n,
          plate: "ABC-123",
          brand: "Honda",
          model: "CB190R",
          year: 2022n,
          mileage: 15000n,
          createdAt: 0n,
        },
      ]),
      listTechnicians: vi.fn().mockResolvedValue([]),
      getCompanyProfile: getCompanyProfileMock,
      getDailyHopeMessage: getDailyHopeMessageMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a href="/" {...props}>
      {children}
    </a>
  ),
  useParams: () => ({ id: "42" }),
}));

vi.mock("@/components/order/AddPartDialog", () => ({
  AddPartDialog: () => null,
}));
vi.mock("@/components/order/AddLaborDialog", () => ({
  AddLaborDialog: () => null,
}));

function catalogService(overrides: Partial<Service> = {}): Service {
  return {
    id: 9n,
    active: true,
    code: "SRV-006",
    name: "Reparación de motor",
    createdAt: 1_700_000_000_000_000_000n,
    description: "Reparación completa del motor",
    category: "Motor",
    laborRate: 250000n,
    estimatedMinutes: 480n,
    ...overrides,
  };
}

function servicePage(items: Service[]): ServicePage {
  return { total: BigInt(items.length), offset: 0n, limit: 200n, items };
}

function orderView(overrides: Partial<OrderView["order"]> = {}): OrderView {
  return {
    order: {
      id: 42n,
      orderNumber: "OT-0001",
      status: OrderStatus.received,
      customerId: 1n,
      motorcycleId: 7n,
      intakeMileage: 15000n,
      problem: "Motor con ruido",
      parts: [],
      labor: [{ id: 1n, description: "Reparación de motor", price: 250000n }],
      technicianIds: [],
      statusHistory: [
        {
          to: OrderStatus.received,
          at: 1_700_000_000_000_000_000n,
          performedBy: undefined as never,
        },
      ],
      createdAt: 1_700_000_000_000_000_000n,
      updatedAt: 1_700_000_000_000_000_000n,
      photos: [],
      ...overrides,
    },
    totals: {
      partsSubtotal: 0n,
      laborSubtotal: 250000n,
      subtotal: 250000n,
      taxRate: 0n,
      tax: 0n,
      total: 250000n,
    },
  };
}

function idleMutation() {
  return { mutate: vi.fn(), isPending: false };
}

function loadedOrder(view: OrderView = orderView()) {
  return {
    data: view,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

describe("OrderDetailPage warranty document (cover)", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    useServicesMock.mockReset();
    serviceTermsQueryMock.mockReset();
    warrantyTermsQueryMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    downloadWarrantyPdfMock.mockReset();
    prepareWhatsAppMock.mockReset();

    updateStatusMock.mockReturnValue(idleMutation());
    removePartMock.mockReturnValue(idleMutation());
    removeLaborMock.mockReturnValue(idleMutation());
    getCompanyProfileMock.mockResolvedValue(null);
    getDailyHopeMessageMock.mockResolvedValue({
      enabled: false,
      mode: HopeMode.auto,
      text: "",
      citation: "",
      referenceDate: "26/09/2026",
    });
    serviceTermsQueryMock.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    warrantyTermsQueryMock.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useServicesMock.mockReturnValue({
      data: servicePage([]),
      isLoading: false,
      isError: false,
    });
    downloadWarrantyPdfMock.mockResolvedValue(undefined);
    prepareWhatsAppMock.mockReturnValue({
      mutate: (
        _input: unknown,
        options?: {
          onSuccess?: (result: {
            hasPhone: boolean;
            phone?: string;
            message: string;
          }) => void;
        },
      ) => {
        options?.onSuccess?.({
          hasPhone: true,
          phone: "+52 555 0100",
          message: "Hola Ada, adjuntamos los términos de garantía.",
        });
      },
      isPending: false,
    });
  });

  it("shows the warranty action when a labor line links to a motor service", async () => {
    useServicesMock.mockReturnValue({
      data: servicePage([catalogService()]),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Reparación de motor",
              price: 250000n,
              serviceId: 9n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(
      await screen.findByTestId("order_detail.warranty_button"),
    ).toBeInTheDocument();
  });

  it("shows the warranty action for a cabeza de fuerza service", async () => {
    useServicesMock.mockReturnValue({
      data: servicePage([
        catalogService({
          id: 11n,
          code: "SRV-011",
          name: "Reparación de cabeza de fuerza",
        }),
      ]),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Reparación de cabeza de fuerza",
              price: 250000n,
              serviceId: 11n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(
      await screen.findByTestId("order_detail.warranty_button"),
    ).toBeInTheDocument();
  });

  it("hides the warranty action when no labor line links to a warranty service", async () => {
    useServicesMock.mockReturnValue({
      data: servicePage([
        catalogService({ id: 5n, code: "SRV-001", name: "Cambio de aceite" }),
      ]),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Cambio de aceite",
              price: 30000n,
              serviceId: 5n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(
      screen.queryByTestId("order_detail.warranty_button"),
    ).not.toBeInTheDocument();
  });

  it("renders the default warranty terms text in the warranty dialog", async () => {
    useServicesMock.mockReturnValue({
      data: servicePage([catalogService()]),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Reparación de motor",
              price: 250000n,
              serviceId: 9n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      await screen.findByTestId("order_detail.warranty_button"),
    );

    const document = await screen.findByTestId(
      "order_detail.warranty_document",
    );
    // The identification block and the document title are present.
    expect(
      within(document).getByText("Términos y Condiciones de Garantía"),
    ).toBeInTheDocument();
    expect(
      within(document).getByTestId("order_detail.warranty_document.identity"),
    ).toBeInTheDocument();

    // With no saved text the page falls back to the default terms, rendered as
    // a single editable block rather than the eight per-clause elements.
    const terms = within(document).getByTestId(
      "order_detail.warranty_document.terms_text",
    );
    expect(terms).toHaveTextContent("ALCANCE DE LA GARANTÍA");
    expect(terms).toHaveTextContent("IMPORTANTE");
    expect(terms.textContent).toBe(WARRANTY_TERMS_DEFAULT_TEXT);
    expect(
      within(document).queryByTestId("order_detail.warranty_document.clause.1"),
    ).toBeNull();
    expect(
      within(document).queryByTestId(
        "order_detail.warranty_document.important",
      ),
    ).toBeNull();
  });

  it("renders the admin-saved warranty terms text in the warranty dialog", async () => {
    warrantyTermsQueryMock.mockReturnValue({
      data: {
        text: "Términos de garantía configurados por el administrador.",
        updatedAt: 1_700_000_000_000_000_000n,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useServicesMock.mockReturnValue({
      data: servicePage([catalogService()]),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Reparación de motor",
              price: 250000n,
              serviceId: 9n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      await screen.findByTestId("order_detail.warranty_button"),
    );

    const document = await screen.findByTestId(
      "order_detail.warranty_document",
    );
    expect(
      within(document).getByTestId("order_detail.warranty_document.terms_text"),
    ).toHaveTextContent(
      "Términos de garantía configurados por el administrador.",
    );
    expect(
      within(document).queryByTestId("order_detail.warranty_document.clause.1"),
    ).toBeNull();
  });

  it("toggles the warranty document between A4 and the 80 mm receipt", async () => {
    useServicesMock.mockReturnValue({
      data: servicePage([catalogService()]),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Reparación de motor",
              price: 250000n,
              serviceId: 9n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      await screen.findByTestId("order_detail.warranty_button"),
    );
    const document = await screen.findByTestId(
      "order_detail.warranty_document",
    );

    // A4 is the default paper.
    expect(document.querySelector(".doc-preview-a4")).not.toBeNull();

    await userEvent.click(
      within(document).getByTestId(
        "order_detail.warranty_document.format_receipt80",
      ),
    );

    expect(document.querySelector(".doc-preview-80mm")).not.toBeNull();
    expect(document.querySelector(".doc-preview-a4")).toBeNull();
  });

  it("downloads the warranty PDF for the selected format", async () => {
    useServicesMock.mockReturnValue({
      data: servicePage([catalogService()]),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Reparación de motor",
              price: 250000n,
              serviceId: 9n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      await screen.findByTestId("order_detail.warranty_button"),
    );
    const document = await screen.findByTestId(
      "order_detail.warranty_document",
    );

    await userEvent.click(
      within(document).getByTestId(
        "order_detail.warranty_document.format_receipt80",
      ),
    );
    await userEvent.click(
      within(document).getByTestId(
        "order_detail.warranty_document.download_button",
      ),
    );

    await waitFor(() =>
      expect(downloadWarrantyPdfMock).toHaveBeenCalledTimes(1),
    );
    // The builder receives the identification data and the chosen format.
    expect(downloadWarrantyPdfMock.mock.calls[0][0]).toMatchObject({
      orderNumber: "OT-0001",
      customerName: "Ada Lovelace",
    });
    expect(downloadWarrantyPdfMock.mock.calls[0][2]).toBe("receipt80");
    // With no saved text the default warranty terms are handed to the builder.
    expect(downloadWarrantyPdfMock.mock.calls[0][4]).toBe(
      WARRANTY_TERMS_DEFAULT_TEXT,
    );
  });

  it("passes the admin-saved warranty terms text to the PDF builder", async () => {
    warrantyTermsQueryMock.mockReturnValue({
      data: {
        text: "Términos de garantía configurados por el administrador.",
        updatedAt: 1_700_000_000_000_000_000n,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useServicesMock.mockReturnValue({
      data: servicePage([catalogService()]),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Reparación de motor",
              price: 250000n,
              serviceId: 9n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      await screen.findByTestId("order_detail.warranty_button"),
    );
    const document = await screen.findByTestId(
      "order_detail.warranty_document",
    );
    await userEvent.click(
      within(document).getByTestId(
        "order_detail.warranty_document.download_button",
      ),
    );

    await waitFor(() =>
      expect(downloadWarrantyPdfMock).toHaveBeenCalledTimes(1),
    );
    expect(downloadWarrantyPdfMock.mock.calls[0][4]).toBe(
      "Términos de garantía configurados por el administrador.",
    );
  });

  it("opens the WhatsApp attachment dialog for the warranty", async () => {
    useServicesMock.mockReturnValue({
      data: servicePage([catalogService()]),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Reparación de motor",
              price: 250000n,
              serviceId: 9n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      await screen.findByTestId("order_detail.warranty_button"),
    );
    await userEvent.click(
      await screen.findByTestId("order_detail.warranty_whatsapp_button"),
    );

    const dialog = await screen.findByTestId(
      "order_detail.warranty_whatsapp_dialog",
    );
    expect(
      within(dialog).getByTestId(
        "order_detail.warranty_whatsapp.attachment_panel",
      ),
    ).toBeInTheDocument();
  });

  it("uses the admin-saved service-terms text as the order document footer", async () => {
    serviceTermsQueryMock.mockReturnValue({
      data: {
        text: "Pie de página configurado por el administrador.",
        updatedAt: 1_700_000_000_000_000_000n,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(screen.getByTestId("order_detail.print_button"));

    const document = await screen.findByTestId("order_detail.document");
    expect(
      within(document).getByText(
        "Pie de página configurado por el administrador.",
      ),
    ).toBeInTheDocument();
  });
});
