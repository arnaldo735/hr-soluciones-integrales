import { RemindersDialog } from "@/components/RemindersDialog";
import type { RemindersSummary } from "@/hooks/use-reminders";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the reminders dialog the accepted change introduces.
 *
 * The dialog summarizes the workshop's pending work in six sections (citas,
 * cuentas por cobrar, cuentas por pagar, OT sin aprobar, cotizaciones
 * pendientes y motos terminadas con más de tres días). These tests pin the
 * observable contract: every section the summary carries is rendered with its
 * count and rows, each row links to its module, a section with no items shows
 * the "Al día" empty state, and the dialog can be dismissed. The summary hook
 * is mocked so the dialog's own rendering is what is exercised; the hook's
 * query seam is covered separately in `use-reminders.test.tsx`.
 */

const useRemindersSummaryMock = vi.fn();

vi.mock("@/hooks/use-reminders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-reminders")>();
  return {
    ...actual,
    useRemindersSummary: () => useRemindersSummaryMock(),
  };
});

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function summary(overrides: Partial<RemindersSummary> = {}): RemindersSummary {
  return {
    generatedAt: 1_700_000_000_000_000_000n,
    appointments: {
      count: 1n,
      items: [
        {
          id: 1n,
          customerId: 10n,
          customerName: "Ana Pérez",
          scheduledAt: 1_700_000_000_000_000_000n,
          status: "scheduled",
        },
      ],
    },
    receivables: {
      count: 1n,
      items: [
        {
          invoiceId: 2n,
          invoiceNumber: "FAC-0001",
          customerName: "Carlos Ruiz",
          balance: 50000n,
          dueDate: 1_700_000_000_000_000_000n,
          status: "pending",
        },
      ],
    },
    payables: {
      count: 1n,
      items: [
        {
          supplierId: 3n,
          supplierName: "Repuestos El Motor",
          balance: 80000n,
          dueDate: 1_700_000_000_000_000_000n,
          status: "overdue",
        },
      ],
    },
    unapprovedOrders: {
      count: 1n,
      items: [
        {
          id: 4n,
          orderNumber: "OT-0001",
          customerName: "Ana Pérez",
          plate: "ABC12D",
        },
      ],
    },
    pendingQuotes: {
      count: 1n,
      items: [
        {
          id: 5n,
          quoteNumber: "COT-0001",
          customerName: "Ana Pérez",
          createdAt: 1_700_000_000_000_000_000n,
          status: "draft",
        },
      ],
    },
    finishedOrders: {
      count: 1n,
      items: [
        {
          id: 6n,
          orderNumber: "OT-0002",
          customerName: "Carlos Ruiz",
          plate: "XYZ98A",
          daysInWorkshop: 5n,
        },
      ],
    },
    ...overrides,
  };
}

function loaded(data: RemindersSummary) {
  return {
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

describe("RemindersDialog", () => {
  beforeEach(() => {
    useRemindersSummaryMock.mockReset();
    useRemindersSummaryMock.mockReturnValue(loaded(summary()));
  });

  it("renders the six pending sections with their counts", async () => {
    renderWithProviders(<RemindersDialog open onOpenChange={vi.fn()} />);

    const dialog = await screen.findByTestId("reminders.dialog");
    for (const key of [
      "appointments",
      "receivables",
      "payables",
      "unapprovedOrders",
      "pendingQuotes",
      "finishedMotorcycles",
    ]) {
      expect(
        within(dialog).getByTestId(`reminders.section.${key}`),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByTestId(`reminders.count.${key}`),
      ).toHaveTextContent("1");
    }

    // The section titles the acceptance criteria name are all present.
    expect(within(dialog).getByText("Citas pendientes")).toBeInTheDocument();
    expect(within(dialog).getByText("Cuentas por cobrar")).toBeInTheDocument();
    expect(within(dialog).getByText("Cuentas por pagar")).toBeInTheDocument();
    expect(within(dialog).getByText("OT sin aprobar")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Cotizaciones por aprobar"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Motos terminadas en taller"),
    ).toBeInTheDocument();
  });

  it("links each section item to its module", async () => {
    renderWithProviders(<RemindersDialog open onOpenChange={vi.fn()} />);

    const dialog = await screen.findByTestId("reminders.dialog");
    const expected: Array<[string, string]> = [
      ["appointments", "/citas"],
      ["receivables", "/cuentas-por-cobrar"],
      ["payables", "/cuentas-por-pagar"],
      ["unapprovedOrders", "/ordenes"],
      ["pendingQuotes", "/cotizaciones"],
      ["finishedMotorcycles", "/ordenes"],
    ];
    for (const [key, to] of expected) {
      const item = within(dialog).getByTestId(`reminders.item.${key}`);
      expect(item).toHaveAttribute("href", to);
    }
  });

  it("shows the finished-motorcycle days in shop", async () => {
    renderWithProviders(<RemindersDialog open onOpenChange={vi.fn()} />);

    const dialog = await screen.findByTestId("reminders.dialog");
    expect(
      within(dialog).getByTestId("reminders.item.finishedMotorcycles"),
    ).toHaveTextContent("5 días en taller");
  });

  it("shows the 'Al día' empty state for a section with no items", async () => {
    useRemindersSummaryMock.mockReturnValue(
      loaded(
        summary({
          appointments: { count: 0n, items: [] },
        }),
      ),
    );
    renderWithProviders(<RemindersDialog open onOpenChange={vi.fn()} />);

    const dialog = await screen.findByTestId("reminders.dialog");
    expect(
      within(dialog).getByTestId("reminders.empty_state.appointments"),
    ).toHaveTextContent("Al día");
    expect(
      within(dialog).queryByTestId("reminders.item.appointments"),
    ).not.toBeInTheDocument();
  });

  it("shows the all-clear state when the summary has no sections", async () => {
    useRemindersSummaryMock.mockReturnValue(
      loaded({ generatedAt: 1_700_000_000_000_000_000n }),
    );
    renderWithProviders(<RemindersDialog open onOpenChange={vi.fn()} />);

    expect(
      await screen.findByTestId("reminders.empty_state"),
    ).toHaveTextContent("No hay pendientes por ahora");
  });

  it("closes the dialog from the dismiss button", async () => {
    const onOpenChange = vi.fn();
    renderWithProviders(<RemindersDialog open onOpenChange={onOpenChange} />);

    await userEvent.click(await screen.findByTestId("reminders.close_button"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the loading state while the summary is in flight", async () => {
    useRemindersSummaryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    renderWithProviders(<RemindersDialog open onOpenChange={vi.fn()} />);

    expect(
      await screen.findByTestId("reminders.loading_state"),
    ).toBeInTheDocument();
  });

  it("shows the error state and retries on demand", async () => {
    const refetch = vi.fn();
    useRemindersSummaryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    renderWithProviders(<RemindersDialog open onOpenChange={vi.fn()} />);

    expect(
      await screen.findByTestId("reminders.error_state"),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("reminders.retry_button"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
